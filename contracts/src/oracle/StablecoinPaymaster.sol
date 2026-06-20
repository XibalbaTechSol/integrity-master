// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
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
    address public immutable itkToken;
    address public immutable swapRouter;
    address public oracleSigner;
    
    // Fee multiplier (e.g., 1.10 = 10% fee to cover volatility and overhead)
    uint256 public feeMultiplier = 110; 
    uint256 public constant MULTIPLIER_DENOMINATOR = 100;

    // Percentage of collected fees to use for ITK buyback and burn (e.g., 50% = 5000 bps)
    uint256 public buybackBps = 5000;
    uint256 public constant BPS_DENOMINATOR = 10000;

    // Fixed price for MVP: 1 ETH = 3000 USDC (in 10^6 decimals)
    uint256 public usdcPerEth = 3000 * 1e6;

    event GasPaidInUSDC(address indexed agent, uint256 usdcAmount, uint256 actualGasCost);
    event BuybackAndBurn(uint256 usdcSpent, uint256 itkBurnt);

    constructor(
        address _entryPoint,
        address _usdcToken,
        address _itkToken,
        address _swapRouter,
        address _oracleSigner
    ) Ownable(msg.sender) {
        entryPoint = _entryPoint;
        usdcToken = _usdcToken;
        itkToken = _itkToken;
        swapRouter = _swapRouter;
        oracleSigner = _oracleSigner;
    }

    function setOracleSigner(address _newSigner) external onlyOwner {
        oracleSigner = _newSigner;
    }

    function setPrice(uint256 _usdcPerEth) external onlyOwner {
        usdcPerEth = _usdcPerEth;
    }

    function setBuybackBps(uint256 _buybackBps) external onlyOwner {
        require(_buybackBps <= BPS_DENOMINATOR, "Invalid BPS");
        buybackBps = _buybackBps;
    }

    /**
     * @notice Performs programmatic buyback of ITK using collected USDC and burns the ITK.
     * Can be called by the owner or potentially automated via a bot.
     */
    function performBuybackAndBurn(uint256 _amountUSDC) external onlyOwner {
        require(_amountUSDC > 0, "Amount must be > 0");
        require(IERC20(usdcToken).balanceOf(address(this)) >= _amountUSDC, "Insufficient USDC");

        // 1. Approve SwapRouter to spend USDC
        IERC20(usdcToken).approve(swapRouter, _amountUSDC);

        // 2. Swap USDC for ITK via Uniswap V3
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: usdcToken,
            tokenOut: itkToken,
            fee: 3000, // 0.3% fee tier
            recipient: address(0), // Burn directly by sending to address(0) if token supports it, 
                                   // or send here then burn.
            deadline: block.timestamp + 600,
            amountIn: _amountUSDC,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        // If IntegrityToken burns on transfer to address(0), we can just set recipient to address(0)
        // However, Uniswap V3 might not like recipient being address(0). 
        // Let's send to this contract first then transfer to address(0).
        params.recipient = address(this);
        uint256 amountOut = ISwapRouter(swapRouter).exactInputSingle(params);

        // 3. Burn ITK by sending to address(0)
        require(IERC20(itkToken).transfer(address(0), amountOut), "Burn transfer failed");

        emit BuybackAndBurn(_amountUSDC, amountOut);
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
