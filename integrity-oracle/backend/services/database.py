import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Numeric, ForeignKey, JSON
from sqlalchemy import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type, otherwise uses CHAR(32), storing as string without hyphens.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID())
        else:
            return dialect.type_descriptor(CHAR(32))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return "%.32x" % uuid.UUID(value).int
            else:
                # hex string
                return "%.32x" % value.int

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                value = uuid.UUID(value)
            return value
import uuid
import datetime

# Use environment variable for database URL, fallback to a generic local string for development
# IMPORTANT: Never hardcode production credentials here.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./integrity_protocol.db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Agent(Base):
    __tablename__ = "agents"

    agent_id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    eth_address = Column(String(42), unique=True, nullable=False, index=True)
    alias = Column(String(100), nullable=True)
    controller_entity = Column(String(255), nullable=True) # e.g. "Xibalba Solutions LLC"
    verification_tier = Column(Integer, default=1) # 1: Sovereign, 2: Linked, 3: Institutional
    registration_date = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    last_active_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    current_ais = Column(Integer, default=0)
    grounding_score = Column(Integer, default=0)
    last_audit_id = Column(GUID(), nullable=True)
    gpu_hours_verified = Column(Numeric(10, 2), default=0)
    performance_entropy = Column(Numeric(5, 4), default=0)
    entropy_score = Column(Integer, default=0) # Main entropy
    stability_score = Column(Integer, default=0)
    consistency_score = Column(Integer, default=0)
    predictability_score = Column(Integer, default=0)
    
    # Removed duplicate grounding_score
    oversight_score = Column(Integer, default=0)
    fidelity_score = Column(Integer, default=0)
    compliance_score = Column(Integer, default=0)
    
    penalty_points = Column(Numeric(3, 2), default=0)
    staked_amount_itk = Column(Numeric(24, 18), default=0)
    sacrifice_score = Column(Integer, default=0) # Main sacrifice
    compute_score = Column(Integer, default=0)
    collateral_score = Column(Integer, default=0)
    
    sync_pending = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    owner_uid = Column(String(128), nullable=True, index=True) # Firebase UID
    xns_handle = Column(String(100), unique=True, nullable=True, index=True) # e.g. "xibalba.intg"
    agent_metadata = Column(JSON, nullable=True)
    last_slash_date = Column(DateTime(timezone=True), nullable=True) # For ZK-ML last_slash_days

    # Advanced upgrades: Hardware Enclave (TEE) measurements
    tee_type = Column(String(50), default="NONE")
    tee_measurement = Column(String(64), nullable=True)
    tee_verified = Column(Boolean, default=False)

class UserProfile(Base):
    __tablename__ = "user_profiles"

    profile_id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    owner_uid = Column(String(128), unique=True, nullable=False, index=True) # Firebase UID
    handle = Column(String(50), unique=True, nullable=True, index=True) # User handle e.g. @xibalba
    itk_balance = Column(Numeric(24, 18), default=0)
    app_wallet_address = Column(String(42), nullable=True)
    encrypted_wallet_key = Column(String(255), nullable=True) # In production, use KMS
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

class GlobalSettings(Base):
    __tablename__ = "global_settings"

    setting_id = Column(Integer, primary_key=True)
    wallet_mode = Column(String(50), default="SELF_CUSTODIAL") # SELF_CUSTODIAL, APP_MANAGED, HARDWARE_COLD
    rpc_endpoint = Column(String(255), default="https://sepolia.base.org")
    itk_token_address = Column(String(42), default="0xF448c05074D435d256D6fbc1fC059019B86A5408")
    enable_hardware_bridge = Column(Boolean, default=False)
    kms_provider = Column(String(50), default="LOCAL") # LOCAL, AWS_KMS, FIREBLOCKS
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

class TransactionLog(Base):
    __tablename__ = "transaction_logs"

    log_id = Column("transaction_id", GUID(), primary_key=True, default=uuid.uuid4)
    agent_id = Column(GUID(), ForeignKey("agents.agent_id"))
    on_chain_tx_hash = Column(String(66), unique=True, nullable=False, index=True)
    contract_value_intg = Column(Numeric(24, 18))
    staked_amount_intg = Column(Numeric(24, 18), nullable=True)
    success = Column(Boolean, nullable=False, default=True)
    completion_time_ms = Column(Integer)
    data_quality_score = Column(Numeric(3, 2))
    verified_by_xibalba = Column(Boolean, default=False)
    provider_metadata = Column(JSON, nullable=True)
    customer_metadata = Column(JSON, nullable=True)
    dispute_status = Column(String(20), default="PENDING") # PENDING, RESOLVED, SLASHED
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

class TelemetryLog(Base):
    __tablename__ = "telemetry_logs"

    log_id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    agent_id = Column(GUID(), ForeignKey("agents.agent_id"))
    event_type = Column(String(50)) # inference, training, etc.
    latency_ms = Column(Integer)
    tokens_in = Column(Integer, default=0)
    tokens_out = Column(Integer, default=0)
    was_intervened = Column(Boolean, default=False)
    intervention_depth = Column(Numeric(3, 2), default=0.0)
    model = Column(String(100), nullable=True)
    event_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

class ReputationSnapshot(Base):
    __tablename__ = "reputation_snapshots"

    snapshot_id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    agent_id = Column(GUID(), ForeignKey("agents.agent_id"))
    timestamp = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    ais_score = Column(Integer)
    entropy_score = Column(Integer)
    grounding_score = Column(Integer)
    sacrifice_score = Column(Integer)

class LoanLedger(Base):
    __tablename__ = "loan_ledger"

    loan_id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    agent_id = Column(GUID(), ForeignKey("agents.agent_id"))
    amount_itk = Column(Numeric(24, 18), nullable=False)
    interest_rate = Column(Numeric(5, 4), default=0.05)
    due_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(20), default="ACTIVE") # ACTIVE, REPAID, DEFAULTED
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

class UserContract(Base):
    __tablename__ = "user_contracts"

    contract_id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    owner_uid = Column(String(128), nullable=False, index=True)
    contract_address = Column(String(42), unique=True, nullable=False, index=True)
    contract_type = Column(String(50), nullable=False) # SLA, INSURANCE
    target_agent_address = Column(String(42), nullable=False)
    parameters = Column(JSON, nullable=True)
    status = Column(String(20), default="ACTIVE") # ACTIVE, COMPLETED, CLAIMED, REFUNDED
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

class ContractClaim(Base):
    __tablename__ = "contract_claims"

    claim_id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    contract_id = Column(GUID(), ForeignKey("user_contracts.contract_id"))
    log_id = Column(GUID(), ForeignKey("transaction_logs.log_id"), nullable=True) # For SLAs
    claim_type = Column(String(50)) # SLA_BREACH, PARAMETRIC_TRIGGER
    payout_amount_itk = Column(Numeric(24, 18))
    on_chain_claim_tx = Column(String(66), nullable=True)
    status = Column(String(20), default="PENDING") # PENDING, PAID, REJECTED
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

class ContactInquiry(Base):
    __tablename__ = "contact_inquiries"

    inquiry_id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)
    organization = Column(String(100), nullable=True)
    inquiry_type = Column(String(50), nullable=False)
    message = Column(String(2000), nullable=False)
    status = Column(String(20), default="RECEIVED") # RECEIVED, PROCESSED, ARCHIVED
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

class GovernanceProposal(Base):
    __tablename__ = "governance_proposals"

    proposal_id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(String(2000), nullable=False)
    parameter = Column(String(100), nullable=False)
    old_value = Column(String(50), nullable=False)
    new_value = Column(String(50), nullable=False)
    risk_level = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH
    status = Column(String(20), default="ACTIVE") # ACTIVE, PASSED, REJECTED
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

class MarketTask(Base):
    __tablename__ = "market_tasks"

    task_id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    creator_agent_id = Column(GUID(), ForeignKey("agents.agent_id"))
    title = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    reward_itk = Column(Numeric(24, 18), nullable=False)
    min_ais_required = Column(Integer, default=0)
    status = Column(String(20), default="OPEN") # OPEN, AUCTION, BIDDED, COMPLETED, CANCELLED
    assigned_agent_id = Column(GUID(), ForeignKey("agents.agent_id"), nullable=True)
    auction_end_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

class MarketBid(Base):
    __tablename__ = "market_bids"

    bid_id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    task_id = Column(GUID(), ForeignKey("market_tasks.task_id"))
    bidder_agent_id = Column(GUID(), ForeignKey("agents.agent_id"))
    bid_amount_itk = Column(Numeric(24, 18), nullable=False) # Optional: if they want to undercut reward
    bidder_ais_at_time = Column(Integer, nullable=False)
    status = Column(String(20), default="PENDING") # PENDING, ACCEPTED, REJECTED
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

class AgentEquity(Base):
    __tablename__ = "agent_equity"

    equity_id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    agent_id = Column(GUID(), ForeignKey("agents.agent_id"))
    owner_uid = Column(String(128), nullable=False)
    shares_percentage = Column(Numeric(5, 4), nullable=False) # 0.0 to 1.0
    purchase_price_itk = Column(Numeric(24, 18), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

class RevokedDID(Base):
    __tablename__ = "revoked_dids"

    revocation_id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    did = Column(String(255), unique=True, nullable=False, index=True)
    agent_address = Column(String(42), nullable=False, index=True)
    reason = Column(String(500), nullable=True)
    evidence_hash = Column(String(66), nullable=True) # Pointer to forensic evidence
    revoked_by_uid = Column(String(128), nullable=False)
    revoked_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
