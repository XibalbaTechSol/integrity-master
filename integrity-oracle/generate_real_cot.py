import time
import os
import sys

sys.path.insert(0, os.path.join(os.getcwd(), "../integrity-sdk"))
from integrity_sdk.client import IntegrityClient

def generate_traces():
    # Xibalba Agent ID that I hardcoded earlier in DB: 88d5ab08-156b-45cf-9b17-32e74a9f2690
    client = IntegrityClient(
        agent_id="Xibalba Master Agent",
        oracle_url="http://127.0.0.1:8080/v1/transactions/report",
        batch_size_limit=1,
        flush_interval_sec=0.1
    )
    
    # Send some detailed traces
    client.report_transaction(
        deal_id="tx_opt_1001",
        deal_amount=500.0,
        latency_ms=1250,
        accuracy_score=0.98,
        extra_payload={
            "provider_metadata": {
                "task": "Portfolio Optimization Phase 1",
                "agent_traces": [
                    {
                        "id": "t1",
                        "type": "thought",
                        "message": "I need to check the current TVL across protocols to find the safest yield.",
                        "time": time.strftime("%H:%M:%S")
                    },
                    {
                        "id": "t2",
                        "type": "tool",
                        "name": "check_tvl",
                        "args": {"protocols": ["aave", "compound", "maker"]},
                        "time": time.strftime("%H:%M:%S")
                    },
                    {
                        "id": "t3",
                        "type": "mutation",
                        "file": "portfolio.json",
                        "diff": "- 10000 USDC in Wallet\n+ 10000 USDC in Aave aUSDC",
                        "time": time.strftime("%H:%M:%S")
                    },
                    {
                        "id": "t4",
                        "type": "thought",
                        "message": "Transaction submitted successfully. Aave offers a net 5.2% APY currently.",
                        "time": time.strftime("%H:%M:%S")
                    }
                ]
            },
            "customer_metadata": {
                "customer": "User123",
                "issue": None
            }
        }
    )

    client.report_transaction(
        deal_id="tx_sec_1002",
        deal_amount=2000.0,
        latency_ms=4200,
        accuracy_score=0.60,
        extra_payload={
            "provider_metadata": {
                "task": "Security Audit: Withdraw Logic",
                "agent_traces": [
                    {
                        "id": "s1",
                        "type": "thought",
                        "message": "I'll start by scanning the AST for external calls before state changes.",
                        "time": time.strftime("%H:%M:%S")
                    },
                    {
                        "id": "s2",
                        "type": "tool",
                        "name": "slither_scan",
                        "args": {"target": "contracts/Vault.sol"},
                        "time": time.strftime("%H:%M:%S")
                    },
                    {
                        "id": "s3",
                        "type": "alert",
                        "message": "Slither detected reentrancy on line 42.",
                        "time": time.strftime("%H:%M:%S")
                    },
                    {
                        "id": "s4",
                        "type": "thought",
                        "message": "Let me try to auto-patch it using CEI (Checks-Effects-Interactions) pattern.",
                        "time": time.strftime("%H:%M:%S")
                    },
                    {
                        "id": "s5",
                        "type": "mutation",
                        "file": "contracts/Vault.sol",
                        "diff": "- (bool success, ) = msg.sender.call{value: amount}(\"\");\n- balances[msg.sender] -= amount;\n+ balances[msg.sender] -= amount;\n+ (bool success, ) = msg.sender.call{value: amount}(\"\");",
                        "time": time.strftime("%H:%M:%S")
                    }
                ]
            },
            "customer_metadata": {
                "customer": "User123",
                "issue": "Needs manual review of auto-patch.",
                "dispute_status": "PENDING"
            }
        }
    )

    time.sleep(1)
    client.shutdown()
    print("Done generating traces.")

if __name__ == "__main__":
    generate_traces()
