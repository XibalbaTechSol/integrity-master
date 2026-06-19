// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./SmartBAA.sol";
import "./CoveredEntityRegistry.sol";

contract SmartBAAFactory {
    CoveredEntityRegistry public registry;
    address public itkToken;
    address public stakingVault;

    mapping(address => address[]) public deployedBAAs; // CE -> BAA[]

    event BAADeployed(address indexed ce, address indexed baaAddress);

    constructor(address _registry, address _itkToken, address _stakingVault) {
        registry = CoveredEntityRegistry(_registry);
        itkToken = _itkToken;
        stakingVault = _stakingVault;
    }

    function deploySmartBAA(
        address _ba,
        string memory _agreementHash,
        bytes32 _allowedScope,
        uint256 _requiredCollateral
    ) external returns (address) {
        require(registry.isRegistered(msg.sender), "Not a registered Covered Entity");

        SmartBAA newBAA = new SmartBAA(
            msg.sender,
            _ba,
            _agreementHash,
            _allowedScope,
            _requiredCollateral,
            itkToken,
            stakingVault
        );

        deployedBAAs[msg.sender].push(address(newBAA));
        
        // Automate authorization in the staking vault
        StakingReputation(stakingVault).registerBAA(address(newBAA));
        
        emit BAADeployed(msg.sender, address(newBAA));
        
        return address(newBAA);
    }

    function getBAAs(address ce) external view returns (address[] memory) {
        return deployedBAAs[ce];
    }
}
