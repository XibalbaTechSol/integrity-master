// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ReputationRegistry.sol";

/**
 * @title CCIPReputationBridge
 * @notice Securely transmits and synchronizes Agent reputation profiles across blockchains.
 */
contract CCIPReputationBridge is CCIPReceiver, Ownable {
    
    IRouterClient public routerClient;
    ReputationRegistry public registry;

    // Mapping of remote chain selectors to allowed bridge contract addresses
    mapping(uint64 => address) public trustedBridges;

    event ReputationSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address indexed agent,
        uint256 aisScore
    );

    event ReputationReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChainSelector,
        address indexed agent,
        uint256 aisScore
    );

    constructor(address _router, address _registry) CCIPReceiver(_router) Ownable(msg.sender) {
        require(_router != address(0), "Invalid Router");
        require(_registry != address(0), "Invalid Registry");
        routerClient = IRouterClient(_router);
        registry = ReputationRegistry(_registry);
    }

    /**
     * @notice Sets the trusted bridge contract address for a given remote chain.
     */
    function setTrustedBridge(uint64 _chainSelector, address _bridgeAddress) external onlyOwner {
        trustedBridges[_chainSelector] = _bridgeAddress;
    }

    /**
     * @notice Bridges an agent's current reputation to a target chain.
     */
    function bridgeReputation(
        uint64 _destinationChainSelector,
        address _agent,
        address _feeToken
    ) external payable returns (bytes32 messageId) {
        // Fetch current score from local registry
        (uint256 currentAis, , , ) = registry.getAgent(_agent);
        require(currentAis > 0, "No reputation score to bridge");

        address destinationBridge = trustedBridges[_destinationChainSelector];
        require(destinationBridge != address(0), "Destination bridge not configured");

        // Construct the CCIP message
        bytes memory data = abi.encode(_agent, currentAis);
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(destinationBridge),
            data: data,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200_000})
            ),
            feeToken: _feeToken
        });

        uint256 fee = routerClient.getFee(_destinationChainSelector, message);

        if (_feeToken == address(0)) {
            require(msg.value >= fee, "Insufficient fee provided");
            messageId = routerClient.ccipSend{value: fee}(
                _destinationChainSelector,
                message
            );
        } else {
            IERC20(_feeToken).transferFrom(msg.sender, address(this), fee);
            IERC20(_feeToken).approve(address(routerClient), fee);
            messageId = routerClient.ccipSend(
                _destinationChainSelector,
                message
            );
        }

        emit ReputationSent(messageId, _destinationChainSelector, _agent, currentAis);
        return messageId;
    }

    /**
     * @notice CCIPReceiver hook to process inbound cross-chain reputation updates.
     */
    function _ccipReceive(Client.Any2EVMMessage memory any2EvmMessage) internal override {
        uint64 sourceChainSelector = any2EvmMessage.sourceChainSelector;
        address sender = abi.decode(any2EvmMessage.sender, (address));

        // Enforce security checks: must come from the trusted peer bridge on the source chain
        require(sender == trustedBridges[sourceChainSelector], "Sender not trusted");

        (address agent, uint256 aisScore, uint256 tier) = abi.decode(any2EvmMessage.data, (address, uint256, uint256));

        // Synchronize on the target registry
        registry.updateAISByBridge(agent, aisScore, tier);
        
        emit ReputationReceived(any2EvmMessage.messageId, sourceChainSelector, agent, aisScore);
    }

}
