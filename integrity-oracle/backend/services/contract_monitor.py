import time
import uuid
import os
import sys

# Add parent directory to path to allow absolute imports if running directly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
try:
    from database import SessionLocal, Agent, TransactionLog, UserContract, ContractClaim, MarketTask, AgentEquity
    from scoring_engine import TriMetricScoringEngine
except ImportError:
    from .database import SessionLocal, Agent, TransactionLog, UserContract, ContractClaim, MarketTask, AgentEquity
    from .scoring_engine import TriMetricScoringEngine

class XibalbaContractMonitor:
    """
    Xibalba Solutions: SLA & Insurance Monitoring Service (v1.0)
    
    This service scans for SLA breaches and parametric insurance triggers.
    It links real-time performance telemetry to on-chain payouts.
    """

    def __init__(self):
        self.scoring_engine = TriMetricScoringEngine()

    def scan_all(self):
        """Scan all active agents and recent transactions for breaches."""
        db = SessionLocal()
        try:
            # 1. Check Parametric Insurance (Agent-wide)
            agents = db.query(Agent).all()
            for agent in agents:
                self.check_parametric_insurance(db, agent)
            
            # 2. Check SLA Breaches (Transaction-specific)
            # In production, we'd only check NEW transactions
            recent_txs = db.query(TransactionLog).filter(TransactionLog.dispute_status != "RESOLVED").all()
            for tx in recent_txs:
                self.check_sla_breach(db, tx)

            # 3. Market Task Settlement
            self.settle_market_tasks(db)
                
        finally:
            db.close()

    def settle_market_tasks(self, db: Session):
        """Oracle scans for bidded market tasks and verifies fulfillment."""
        bidded_tasks = db.query(MarketTask).filter(MarketTask.status == "BIDDED").all()
        for task in bidded_tasks:
            # Check for a successful transaction from the assigned agent
            # that matches the task requirements
            fulfillment_tx = db.query(TransactionLog).filter(
                TransactionLog.agent_id == task.assigned_agent_id,
                TransactionLog.success == True,
                TransactionLog.created_at >= task.created_at
            ).first()

            if fulfillment_tx:
                print(f"[ORACLE] Market Task {task.task_id} fulfilled by agent {task.assigned_agent_id}")
                task.status = "COMPLETED"
                
                # Trigger Equity Distribution for the performing agent
                self.distribute_agent_equity(db, task.assigned_agent_id, float(task.reward_itk))
                db.commit()

    def distribute_agent_equity(self, db: Session, agent_id: str, amount_itk: float):
        """Oracle calculates and records equity distributions for agent earnings."""
        holders = db.query(AgentEquity).filter(AgentEquity.agent_id == agent_id).all()
        if not holders:
            return

        print(f"[ORACLE] Distributing {amount_itk} ITK earnings for agent {agent_id}...")
        for holder in holders:
            share = float(holder.shares_percentage) * amount_itk
            print(f"  -> Holder {holder.owner_uid}: {share:.4f} ITK ({(holder.shares_percentage*100):.1f}%)")
            
            # In a real system, this would be an on-chain transfer to the holder's wallet
            # For now, we record it in the agent's internal payout ledger (mocked)

    def check_sla_breach(self, db: Session, tx_log: TransactionLog):
        """Checks if a specific transaction violates active SLAs for that agent."""
        customer_uid = (tx_log.customer_metadata or {}).get('owner_uid')
        if not customer_uid:
            return

        agent = db.query(Agent).filter(Agent.agent_id == tx_log.agent_id).first()
        if not agent:
            return

        contracts = db.query(UserContract).filter(
            UserContract.target_agent_address == agent.eth_address,
            UserContract.owner_uid == customer_uid,
            UserContract.contract_type == "SLA",
            UserContract.status == "ACTIVE"
        ).all()

        for contract in contracts:
            params = contract.parameters or {}
            max_latency = params.get("max_latency_ms", 5000)
            min_accuracy = params.get("min_accuracy", 0.70)
            
            breach = False
            if tx_log.completion_time_ms and tx_log.completion_time_ms > max_latency:
                breach = True
            if tx_log.data_quality_score and float(tx_log.data_quality_score) < min_accuracy:
                breach = True

            if breach:
                self.trigger_claim(db, contract, tx_log, "SLA_BREACH")

    def check_parametric_insurance(self, db: Session, agent: Agent):
        """Checks if an agent's AIS score has fallen below parametric triggers."""
        contracts = db.query(UserContract).filter(
            UserContract.target_agent_address == agent.eth_address,
            UserContract.contract_type == "INSURANCE",
            UserContract.status == "ACTIVE"
        ).all()

        for contract in contracts:
            params = contract.parameters or {}
            trigger_ais = params.get("trigger_ais_threshold", 500)
            
            if agent.current_ais < trigger_ais:
                self.trigger_claim(db, contract, None, "PARAMETRIC_TRIGGER")

    def trigger_claim(self, db: Session, contract: UserContract, tx_log: TransactionLog, claim_type: str):
        """Creates a claim record and initiates payout logic."""
        # Prevent duplicate claims for the same SLA breach
        if tx_log:
            existing = db.query(ContractClaim).filter(
                ContractClaim.contract_id == contract.contract_id,
                ContractClaim.log_id == tx_log.log_id
            ).first()
            if existing:
                return

        params = contract.parameters or {}
        payout = params.get("payout_amount_itk", 10.0)

        # Defense: Moral Hazard Mitigation
        # Ensure that insurance payouts do not incentivize self-sabotage.
        # Max payout cannot exceed the agent's slashed stake.
        if claim_type == "PARAMETRIC_TRIGGER":
            agent = db.query(Agent).filter(Agent.eth_address == contract.target_agent_address).first()
            if agent:
                # Estimate financial penalty (e.g. 10% of staked amount per point of penalty)
                estimated_slash_penalty = float(agent.staked_amount_itk) * float(agent.penalty_points)
                if payout > estimated_slash_penalty:
                    print(f"[DEFENSE] Moral Hazard Detected: Requested payout ({payout}) exceeds agent's slash penalty ({estimated_slash_penalty}). Capping payout.")
                    payout = estimated_slash_penalty

        claim = ContractClaim(
            contract_id=contract.contract_id,
            log_id=tx_log.log_id if tx_log else None,
            claim_type=claim_type,
            payout_amount_itk=payout,
            status="PENDING"
        )
        db.add(claim)
        
        # In a real system, we'd trigger a blockchain transaction here
        print(f"[MONITOR] Claim triggered for {claim_type} on contract {contract.contract_address}")
        
        # If it's a parametric insurance trigger, we might mark the contract as CLAIMED/EXPIRED
        if claim_type == "PARAMETRIC_TRIGGER":
            contract.status = "CLAIMED"

        db.commit()

if __name__ == "__main__":
    monitor = XibalbaContractMonitor()
    print("[*] Xibalba Contract Monitor initialized.")
    monitor.scan_all()
