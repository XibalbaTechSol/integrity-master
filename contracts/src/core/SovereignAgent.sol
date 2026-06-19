// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./IAccount.sol";

/**
 * @title SovereignAgent
 * @author Xibalba Solutions
 * @notice An individual, on-chain identity for an AI agent.
 * Tied to an Identity NFT from the AgentFactory.
 * Fully compliant with ERC-4337 Account Abstraction.
 */
contract SovereignAgent is AccessControl, IAccount {
    using ECDSA for bytes32;

    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    string public agentAlias;
    uint256 public ais;
    uint256 public tier;
    uint256 public identityTokenId;
    address public factory;
    address public immutable entryPoint;

    event AISUpdated(uint256 newScore, uint256 newTier);
    event ControllerRotated(address indexed oldController, address indexed newController);
    event AgentExecuted(address indexed target, uint256 value, bytes data);

    modifier onlyEntryPoint() {
        require(msg.sender == entryPoint, "SovereignAgent: caller must be EntryPoint");
        _;
    }

    constructor(
        string memory _alias, 
        address _controller, 
        address _initialOracle, 
        uint256 _tokenId, 
        address _factory,
        address _entryPoint
    ) {
        agentAlias = _alias;
        factory = _factory;
        identityTokenId = _tokenId;
        entryPoint = _entryPoint;
        
        _grantRole(DEFAULT_ADMIN_ROLE, _controller);
        _grantRole(ORACLE_ROLE, _initialOracle);
        ais = 300; // Baseline
        tier = 1;
    }

    /**
     * @notice Ensures that only the current holder of the Identity NFT can manage keys.
     */
    modifier onlyNFTHolder() {
        require(IERC721(factory).ownerOf(identityTokenId) == msg.sender, "Caller does not own the Identity NFT.");
        _;
    }

    /**
     * @notice ERC-4337 UserOperation validation.
     * Verifies the signature is from a wallet with DEFAULT_ADMIN_ROLE.
     */
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external override onlyEntryPoint returns (uint256 validationData) {
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(userOpHash);
        address recovered = ethSignedMessageHash.recover(userOp.signature);

        if (!hasRole(DEFAULT_ADMIN_ROLE, recovered)) {
            return 1; // SIG_VALIDATION_FAILED
        }

        if (missingAccountFunds > 0) {
            (bool success,) = payable(msg.sender).call{value: missingAccountFunds}("");
            (success); // EntryPoint is trusted
        }

        return 0; // SIG_VALIDATION_SUCCESS
    }

    /**
     * @notice Allows the EntryPoint to execute arbitrary operations.
     */
    function execute(address dest, uint256 value, bytes calldata func) external onlyEntryPoint {
        (bool success, bytes memory result) = dest.call{value: value}(func);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
        emit AgentExecuted(dest, value, func);
    }

    function updateAIS(uint256 _ais, uint256 _tier) external onlyRole(ORACLE_ROLE) {
        require(_ais >= 300 && _ais <= 1000, "AIS out of bounds");
        ais = _ais;
        tier = _tier;
        emit AISUpdated(_ais, _tier);
    }

    /**
     * @notice Rotates control to a new wallet. Only possible by the NFT holder.
     */
    function rotateController(address _newController) external onlyNFTHolder {
        _grantRole(DEFAULT_ADMIN_ROLE, _newController);
        _revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
        emit ControllerRotated(msg.sender, _newController);
    }
}
