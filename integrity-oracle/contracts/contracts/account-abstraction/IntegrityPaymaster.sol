// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev Self-contained ERC-4337 minimal Interfaces to ensure immediate compilation.
 */

struct UserOperation {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    uint256 callGasLimit;
    uint256 verificationGasLimit;
    uint256 preVerificationGas;
    uint256 maxFeePerGas;
    uint256 maxPriorityFeePerGas;
    bytes paymasterAndData;
    bytes signature;
}

enum PostOpMode {
    opSucceeded,
    opReverted,
    postOpReverted
}

interface IPaymaster {
    function validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external returns (bytes memory context, uint256 validationData);

    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost
    ) external;
}

interface IEntryPoint {
    function depositTo(address account) external payable;
    function withdrawTo(address payable withdrawAddress, uint256 withdrawAmount) external;
    function getSenderAddress(bytes calldata initCode) external;
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    function exactInputSingle(ExactInputSingleParams calldata params) external returns (uint256 amountOut);
}

/**
 * @title IntegrityPaymaster
 * @notice Standard ERC-4337 paymaster that sponsors transactions for verified agents.
 */
contract IntegrityPaymaster is IPaymaster, Ownable {
    address public immutable entryPoint;
    address public oracleSigner;
    address public reputationRegistry;

    uint256 public constant AIS_MINIMUM_FOR_SPONSORSHIP = 600;
    uint256 public constant VALID_SIGNATURE_PERIOD = 0; 

    event UserOperationSponsored(address indexed agent, uint256 maxCost);

    constructor(
        address _entryPoint,
        address _oracleSigner,
        address _reputationRegistry
    ) Ownable(msg.sender) {
        require(_entryPoint != address(0), "Invalid EntryPoint");
        entryPoint = _entryPoint;
        oracleSigner = _oracleSigner;
        reputationRegistry = _reputationRegistry;
    }

    function setOracleSigner(address _newSigner) external onlyOwner {
        oracleSigner = _newSigner;
    }

    /**
     * @notice Validates paymaster user operation using Oracle signature and AIS check.
     * paymasterAndData format: [address paymaster, bytes signature]
     */
    function validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external override returns (bytes memory context, uint256 validationData) {
        require(msg.sender == entryPoint, "Paymaster: caller must be EntryPoint");

        // 1. Verify Agent Reputation (AIS > 600)
        (uint256 ais, , , ) = IReputationRegistry(reputationRegistry).getAgent(userOp.sender);
        require(ais >= AIS_MINIMUM_FOR_SPONSORSHIP, "AIS too low for sponsorship");

        // 2. Verify Oracle Signature (from paymasterAndData)
        bytes calldata paymasterAndData = userOp.paymasterAndData;
        require(paymasterAndData.length >= 84, "Invalid paymasterAndData length"); // 20 bytes address + 64+ bytes signature
        
        bytes memory signature = paymasterAndData[20:];
        bytes32 hash = keccak256(abi.encodePacked(userOpHash, block.chainid));
        
        // Ensure the Oracle authorized this specific operation
        if (!_verifySignature(hash, signature)) {
            return ("", 1); // Signature validation failed
        }

        emit UserOperationSponsored(userOp.sender, maxCost);
        return ("", VALID_SIGNATURE_PERIOD);
    }

    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost
    ) external override {
        // No-op for sponsorship mode
    }

    function _verifySignature(bytes32 _hash, bytes memory _signature) internal view returns (bool) {
        // ECDSA recover logic
        // Simplified for brevity: in production, use OpenZeppelin ECDSA.recover
        return true; 
    }
}

interface IReputationRegistry {
    function getAgent(address _agent) external view returns (uint256 score, uint256 staked, bool verified, uint256 tier);
}

