# Quant ZeroDrift 📉

C++ based PDE solver and control theory engine for the **Quantitative Financial Engine**.

This service ensures that trading agents remain within their "Zero Drift" behavioral envelope, preventing algorithmic runaway and preserving capital.

## AIS-Based Control Theory Integration

The engine dynamically calibrates risk limits by ingesting the agent's real-time **Agent Integrity Score (AIS)** from the Oracle.

- **Dynamic Risk Calibration**: High AIS agents are granted wider volatility bands, while low AIS agents (detecting drift or high entropy) are automatically throttled via a stochastic PDE boundary condition.
- **Drift PDE Solver**: Solves the Black-Scholes-Merton partial differential equation with an added drift penalty term linked to the agent's performance variance.
- **State Vector Alignment**: Synchronizes agent behavioral state with market ticks to detect hidden divergence before it results in loss.

## Usage

```bash
# Build the engine
g++ -O3 main.cpp -o zerodrift

# Run the controller with a risk limit and target AIS
./zerodrift --risk-limit 0.05 --min-ais 850
```
