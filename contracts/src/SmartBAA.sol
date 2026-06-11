// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SmartBAA
 * @dev Implementation of a Smart HIPAA Business Associate Agreement (BAA).
 * This contract enforces legal agreements via EIP-712 signatures and 
 * manages parametric liability through ITK staking and automated slashing.
 */
contract SmartBAA is EIP712, Ownable {
    using ECDSA for bytes32;

    enum BAAStatus { Pending, Active, Terminated, Breached }

    struct BAA {
        address coveredEntity;
        address businessAssociate;
        bytes32 documentHash;
        string uri;
        BAAStatus status;
        uint256 stakedITK;
        uint256 disputeWindowEnd; // Timestamp when a slash becomes final
        address controller;      // Human/Org controller with recovery rights
    }

    IERC20 public itkToken;
    address public integrityOracle;

    // Mapping from BAA ID (keccak256(coveredEntity, businessAssociate)) to BAA details
    mapping(bytes32 => BAA) public baas;

    // EIP-712 TypeHash
    bytes32 private constant BAA_TYPEHASH = keccak256(
        "BAA(address coveredEntity,address businessAssociate,bytes32 documentHash,string uri,uint256 stakedITK,address controller)"
    );

    event BAAProposed(bytes32 indexed baaId, address indexed coveredEntity, address indexed businessAssociate);
    event BAASigned(bytes32 indexed baaId);
    event BAASlashed(bytes32 indexed baaId, uint256 amount);
    event BAATerminated(bytes32 indexed baaId);
    event BAAEscalated(bytes32 indexed baaId, string reason);
    event ControllerUpdated(bytes32 indexed baaId, address indexed newController);

    constructor(address _itkToken, address _integrityOracle) 
        EIP712("Xibalba Smart BAA", "1") 
        Ownable(msg.sender) 
    {
        itkToken = IERC20(_itkToken);
        integrityOracle = _integrityOracle;
    }

    /**
     * @dev Proposes a new BAA. Requires the Business Associate to stake ITK.
     */
    function proposeBAA(
        address _coveredEntity,
        bytes32 _documentHash,
        string calldata _uri,
        uint256 _stakeAmount,
        address _controller
    ) external returns (bytes32 baaId) {
        baaId = keccak256(abi.encodePacked(_coveredEntity, msg.sender));
        require(baas[baaId].status == BAAStatus.Pending || baas[baaId].status == BAAStatus.Terminated, "BAA already exists");

        // Transfer ITK stake from the Business Associate to this contract
        require(itkToken.transferFrom(msg.sender, address(this), _stakeAmount), "ITK transfer failed");

        baas[baaId] = BAA({
            coveredEntity: _coveredEntity,
            businessAssociate: msg.sender,
            documentHash: _documentHash,
            uri: _uri,
            status: BAAStatus.Pending,
            stakedITK: _stakeAmount,
            disputeWindowEnd: 0,
            controller: _controller
        });

        emit BAAProposed(baaId, _coveredEntity, msg.sender);
    }

    /**
     * @dev Signs a proposed BAA using EIP-712. Can be called by the Covered Entity.
     */
    function signBAA(bytes32 _baaId, bytes calldata _signature) external {
        BAA storage baa = baas[_baaId];
        require(baa.status == BAAStatus.Pending, "BAA not in pending state");
        require(msg.sender == baa.coveredEntity, "Only Covered Entity can sign");

        bytes32 structHash = keccak256(abi.encode(
            BAA_TYPEHASH,
            baa.coveredEntity,
            baa.businessAssociate,
            baa.documentHash,
            keccak256(bytes(baa.uri)),
            baa.stakedITK,
            baa.controller
        ));

        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, _signature);

        require(signer == baa.coveredEntity, "Invalid EIP-712 signature");

        baa.status = BAAStatus.Active;
        emit BAASigned(_baaId);
    }

    /**
     * @dev Triggers a 'Soft Slash' with a dispute window to mitigate basis risk.
     * Restricted to the Integrity Oracle.
     */
    function initiateSlash(bytes32 _baaId, string calldata _reason) external {
        require(msg.sender == integrityOracle, "Only Oracle can initiate");
        BAA storage baa = baas[_baaId];
        require(baa.status == BAAStatus.Active, "BAA not active");

        baa.status = BAAStatus.Breached;
        baa.disputeWindowEnd = block.timestamp + 3 days; // 72-hour dispute window

        emit BAAEscalated(_baaId, _reason);
    }

    /**
     * @dev Finalizes the slash after the dispute window.
     */
    function finalizeSlash(bytes32 _baaId) external {
        BAA storage baa = baas[_baaId];
        require(baa.status == BAAStatus.Breached, "No breach pending");
        require(block.timestamp > baa.disputeWindowEnd, "Dispute window still open");

        uint256 amount = baa.stakedITK;
        baa.stakedITK = 0;

        // Transfer slashed ITK to the Covered Entity as immediate damages
        require(itkToken.transfer(baa.coveredEntity, amount), "Slashed ITK transfer failed");

        emit BAASlashed(_baaId, amount);
    }

    /**
     * @dev Allows the controller to recover the BA address if keys are lost.
     */
    function recoverBusinessAssociate(bytes32 _baaId, address _newBA) external {
        BAA storage baa = baas[_baaId];
        require(msg.sender == baa.controller, "Only controller can recover");
        
        baa.businessAssociate = _newBA;
        emit ControllerUpdated(_baaId, _newBA);
    }

    /**
     * @dev Updates the Integrity Oracle address.
     */
    function setOracle(address _newOracle) external onlyOwner {
        integrityOracle = _newOracle;
    }

    /**
     * @dev Helper to get the EIP-712 domain separator.
     */
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @dev Helper to get BAA status.
     */
    function getBAAStatus(address _ce, address _ba) external view returns (BAAStatus) {
        bytes32 baaId = keccak256(abi.encodePacked(_ce, _ba));
        return baas[baaId].status;
    }
}
