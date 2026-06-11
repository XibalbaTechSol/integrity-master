// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./IntegrityPaymaster.sol";

/**
 * @title StablecoinPaymaster
 * @author Xibalba Solutions
 * @notice An ERC-4337 Paymaster that allows agents to pay for gas in USDC.
 * It uses an Oracle-provided price feed or fixed rate to calculate USDC reimbursement.
 */
contract StablecoinPaymaster is IPaymaster, Ownable {
    using ECDSA for bytes32;

    address public immutable entryPoint;
    address public immutable usdcToken;
    address public oracleSigner;
    
    // Fee multiplier (e.g., 1.10 = 10% fee to cover volatility and overhead)
    uint256 public feeMultiplier = 110; 
    uint256 public constant MULTIPLIER_DENOMINATOR = 100;

    // Fixed price for MVP: 1 ETH = 3000 USDC (in 10^6 decimals)
    uint256 public usdcPerEth = 3000 * 1e6;

    event GasPaidInUSDC(address indexed agent, uint256 usdcAmount, uint256 actualGasCost);

    constructor(
        address _entryPoint,
        address _usdcToken,
        address _oracleSigner
    ) Ownable(msg.sender) {
        entryPoint = _entryPoint;
        usdcToken = _usdcToken;
        oracleSigner = _oracleSigner;
    }

    function setOracleSigner(address _newSigner) external onlyOwner {
        oracleSigner = _newSigner;
    }

    function setPrice(uint256 _usdcPerEth) external onlyOwner {
        usdcPerEth = _usdcPerEth;
    }

    /**
     * @notice Validates that the agent has enough USDC to cover the gas.
     */
    function validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external override returns (bytes memory context, uint256 validationData) {
        require(msg.sender == entryPoint, "Paymaster: caller must be EntryPoint");

        // 1. Calculate max USDC cost
        uint256 maxUsdcCost = (maxCost * usdcPerEth * feeMultiplier) / (1e18 * MULTIPLIER_DENOMINATOR);
        
        // 2. Check agent's USDC balance
        require(IERC20(usdcToken).balanceOf(userOp.sender) >= maxUsdcCost, "Insufficient USDC balance");

        // 3. Verify Oracle Signature (optional: to restrict which agents can use USDC payment)
        // For MVP, we allow any agent with USDC.

        return (abi.encode(userOp.sender, maxUsdcCost), 0);
    }

    /**
     * @notice Reimburses the paymaster in USDC after the transaction is executed.
     */
    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost
    ) external override {
        require(msg.sender == entryPoint, "Paymaster: caller must be EntryPoint");
        
        (address agent, uint256 maxUsdcCost) = abi.decode(context, (address, uint256));

        // Calculate actual USDC cost based on actual gas used
        uint256 actualUsdcCost = (actualGasCost * usdcPerEth * feeMultiplier) / (1e18 * MULTIPLIER_DENOMINATOR);
        
        if (actualUsdcCost > maxUsdcCost) {
            actualUsdcCost = maxUsdcCost; // Cap at pre-approved amount
        }

        // Collect USDC from the agent
        require(IERC20(usdcToken).transferFrom(agent, address(this), actualUsdcCost), "USDC transfer failed");

        emit GasPaidInUSDC(agent, actualUsdcCost, actualGasCost);
    }

    /**
     * @notice Allows owner to withdraw collected USDC.
     */
    function withdrawUSDC(address _to, uint256 _amount) external onlyOwner {
        IERC20(usdcToken).transfer(_to, _amount);
    }
}
