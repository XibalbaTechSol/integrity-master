import typer
from rich.console import Console
from rich.table import Table
from typing import Optional, List
import json

from .config import get_config_value, set_config_value, load_config
from .client import IntegrityClient

app = typer.Typer(help="Xibalba Integrity Fleet Command-and-Control")
console = Console()

# --- Command Groups ---

agent_app = typer.Typer(help="Manage agents in the Integrity Fleet")
app.add_typer(agent_app, name="agent")

identity_app = typer.Typer(help="Identity and DID resolution")
app.add_typer(identity_app, name="identity")

governance_app = typer.Typer(help="Protocol governance and proposals")
app.add_typer(governance_app, name="governance")

shield_app = typer.Typer(help="Xibalba Shield Compliance and Smart BAAs")
app.add_typer(shield_app, name="shield")

config_app = typer.Typer(help="Manage CLI configuration")
app.add_typer(config_app, name="config")

auth_app = typer.Typer(help="Authentication and API Keys")
app.add_typer(auth_app, name="auth")

credit_app = typer.Typer(help="Agent Credit Facility and Loans")
app.add_typer(credit_app, name="credit")

factory_app = typer.Typer(help="Smart Contract Factory and Deployments")
app.add_typer(factory_app, name="factory")

# --- Config Commands ---

@config_app.command("set")
def config_set(key: str, value: str):
    """Set a configuration value (e.g., ORACLE_URL, AUTH_TOKEN)."""
    set_config_value(key, value)
    console.print(f"[green]Config updated: {key} = {value}[/green]")

@config_app.command("show")
def config_show():
    """Show current configuration."""
    config = load_config()
    table = Table(title="CLI Configuration")
    table.add_column("Key", style="cyan")
    table.add_column("Value", style="magenta")
    for k, v in config.items():
        table.add_row(k, str(v))
    console.print(table)

# --- Auth Commands ---

@auth_app.command("generate-dev-key")
def generate_dev_key():
    """Generate a Developer API Key for test environments."""
    client = IntegrityClient()
    try:
        with console.status("[bold blue]Generating API key..."):
            result = client.post("/v1/api-keys/generate")
        console.print("[bold green]Success:[/bold green] API Key generated.")
        console.print(f"API Key: [cyan]{result.get('api_key')}[/cyan]")
        console.print("[yellow]Warning: Save this key now. It will not be shown again.[/yellow]")
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {str(e)}")

# --- Agent Commands ---

@agent_app.command("register")
def register_agent(
    address: str = typer.Option(..., "--address", "-a", help="Ethereum address of the agent"),
    alias: str = typer.Option(..., "--alias", help="Human-readable alias for the agent"),
    handle: Optional[str] = typer.Option(None, "--handle", help="XNS handle (e.g., bot.intg)"),
    description: str = typer.Option("", "--desc", help="Short description of the agent"),
    tee: str = typer.Option("NONE", "--tee", help="TEE type (NONE, SGX, TDX, etc.)")
):
    """Register a new agent with the Integrity Protocol."""
    client = IntegrityClient()
    payload = {
        "eth_address": address,
        "alias": alias,
        "xns_handle": handle,
        "description": description,
        "tee_type": tee
    }
    try:
        with console.status("[bold blue]Registering agent..."):
            result = client.post("/v1/agent/register", json_data=payload)
        console.print(f"[bold green]Success:[/bold green] {result.get('message', 'Agent registered')}")
        console.print(f"Agent ID: [cyan]{result.get('agent_id')}[/cyan]")
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {str(e)}")

@agent_app.command("list")
def list_agents():
    """List all agents owned by the current user."""
    client = IntegrityClient()
    try:
        with console.status("[bold blue]Fetching agents..."):
            agents = client.get("/v1/user/agents")
        
        table = Table(title="Your Integrity Fleet")
        table.add_column("Alias", style="cyan")
        table.add_column("Address", style="dim")
        table.add_column("AIS", style="magenta")
        table.add_column("Tier", style="green")
        table.add_column("Status", style="yellow")

        for agent in agents:
            table.add_row(
                agent.get("alias", "N/A"),
                agent.get("eth_address", "N/A"),
                str(agent.get("current_ais", 0)),
                f"Tier {agent.get('verification_tier', 1)}",
                "Active" if agent.get("is_active") else "Inactive"
            )
        console.print(table)
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {str(e)}")

@agent_app.command("status")
def agent_status(identifier: str):
    """Get detailed status and telemetry for a specific agent."""
    client = IntegrityClient()
    try:
        with console.status(f"[bold blue]Fetching status for {identifier}..."):
            agent = client.get(f"/v1/agent/{identifier}")
        
        console.print(f"[bold cyan]Agent: {agent.get('alias')} ({agent.get('eth_address')})[/bold cyan]")
        console.print(f"XNS Handle: {agent.get('xns_handle') or 'None'}")
        console.print(f"AIS Score: [magenta]{agent.get('current_ais')}[/magenta]")
        
        entropy = agent.get('performance_entropy', 0.0)
        console.print(f"Entropy: [yellow]{entropy:.4f}[/yellow]")
        
        # Compute Circuit Breaker check
        if entropy > 0.5:
            console.print("Compute State: [bold red]THROTTLED (Entropy > 0.5 - Circuit Breaker Tripped)[/bold red]")
        else:
            console.print("Compute State: [bold green]NORMAL[/bold green]")
            
        # Attestation-Gated Credit Limit representation
        tier = agent.get('verification_tier', 1)
        if tier == 1:
            limit_str = "10,000 USD Cap (Sovereign Tier)"
        elif tier == 2:
            limit_str = "100,000 USD Cap (Attested Tier)"
        else:
            limit_str = "Uncapped (TEE-bound Tier)"
            
        console.print(f"Verification Tier: [green]Tier {tier}[/green] ({limit_str})")
        console.print(f"Grounding: [green]{agent.get('grounding_score', 0)}[/green]")
        console.print(f"Last Active: {agent.get('last_active_at')}")
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {str(e)}")

@agent_app.command("intercept")
def agent_intercept(
    agent_id: str = typer.Option(..., "--agent-id", "-i", help="DID/Address of the agent"),
    action: str = typer.Option(..., "--action", "-a", help="Action type to intercept (e.g. read_phi, exfiltrate)"),
    context_json: str = typer.Option("{}", "--context", "-c", help="Execution context JSON string")
):
    """Debug BCC middleware pre-execution gate with a test action and context."""
    import time
    import hashlib
    client = IntegrityClient()
    
    try:
        context = json.loads(context_json)
    except Exception as e:
        console.print(f"[bold red]Invalid Context JSON:[/bold red] {str(e)}")
        return
        
    actual_payload = json.dumps(context, sort_keys=True)
    intended_hash = hashlib.sha256(actual_payload.encode()).hexdigest()
    
    payload = {
        "commitment": {
            "id": f"cli_{int(time.time())}",
            "timestamp": time.time(),
            "agent_id": agent_id,
            "action_type": action,
            "intended_state_hash": intended_hash,
            "opa_policy_id": "integrity.rego",
            "ttl": 60.0
        },
        "actual_context": context
    }
    
    try:
        # Try custom backend route
        with console.status("[bold blue]Querying BCC Middleware intercept gate..."):
            result = client.post("/v1/bcc/intercept", json_data=payload)
            
        authorized = result.get("authorized", False)
        reason = result.get("reason", "N/A")
        token = result.get("verification_token", "N/A")
        
        color = "green" if authorized else "red"
        status_txt = "AUTHORIZED" if authorized else "REJECTED"
        
        console.print(f"BCC Decision: [bold {color}]{status_txt}[/bold {color}]")
        console.print(f"Reason: [yellow]{reason}[/yellow]")
        if authorized:
            console.print(f"Verification Token: [dim]{token}[/dim]")
    except Exception as e:
        # Direct local fallback to BCC Shield middleware
        try:
            with console.status("[bold blue]Direct query to BCC Middleware (http://localhost:8000)..."):
                import httpx
                resp = httpx.post("http://localhost:8000/v1/bcc/intercept", json=payload, timeout=2.0)
                if resp.status_code == 200:
                    result = resp.json()
                    authorized = result.get("authorized", False)
                    reason = result.get("reason", "N/A")
                    token = result.get("verification_token", "N/A")
                    color = "green" if authorized else "red"
                    status_txt = "AUTHORIZED" if authorized else "REJECTED"
                    console.print(f"BCC Decision: [bold {color}]{status_txt}[/bold {color}]")
                    console.print(f"Reason: [yellow]{reason}[/yellow]")
                    if authorized:
                        console.print(f"Verification Token: [dim]{token}[/dim]")
                    return
        except Exception:
            pass
        console.print(f"[bold red]Error querying BCC Middleware:[/bold red] {str(e)}")

@agent_app.command("handshake")
def agent_handshake(
    initiator: str = typer.Option(..., help="Initiator ETH address"),
    target: str = typer.Option(..., help="Target ETH address")
):
    """Perform a trust handshake between two agents."""
    client = IntegrityClient()
    payload = {
        "initiator_eth_address": initiator,
        "target_eth_address": target
    }
    try:
        with console.status("[bold blue]Performing handshake..."):
            result = client.post("/v1/agent/handshake", json_data=payload)
        
        decision = result.get("trust_decision", "UNKNOWN")
        color = "green" if decision == "APPROVED" else "red"
        console.print(f"Trust Decision: [bold {color}]{decision}[/bold {color}]")
        console.print(f"Handshake Hash: [dim]{result.get('handshake_hash')}[/dim]")
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {str(e)}")

@agent_app.command("report")
def report_metrics(
    agent_id: str,
    deal_id: str,
    amount: float,
    latency: int,
    accuracy: float
):
    """Report transaction metrics for an agent."""
    client = IntegrityClient()
    payload = {
        "agent_id": agent_id,
        "deal_id": deal_id,
        "deal_amount": amount,
        "latency_ms": latency,
        "accuracy_score": accuracy
    }
    try:
        with console.status("[bold blue]Submitting report..."):
            result = client.post("/v1/transactions/report", json_data=payload)
        console.print(f"[bold green]Report accepted.[/bold green]")
        console.print(f"New AIS Score: [magenta]{result.get('ais_score')}[/magenta]")
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {str(e)}")

@agent_app.command("stake")
def agent_stake(agent_address: str, amount: float):
    """Stake ITK tokens for an agent to increase verification tier."""
    client = IntegrityClient()
    payload = {"agent_address": agent_address, "amount": amount}
    try:
        with console.status(f"[bold blue]Staking {amount} ITK..."):
            result = client.post("/v1/agent/stake", json_data=payload)
        console.print(f"[bold green]Stake successful.[/bold green]")
        console.print(f"New Staked Balance: [cyan]{result.get('new_staked_balance')} ITK[/cyan]")
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {str(e)}")

# --- Identity Commands ---

@identity_app.command("resolve")
def resolve_handle(handle: str):
    """Resolve an XNS handle to an agent profile."""
    client = IntegrityClient()
    try:
        with console.status(f"[bold blue]Resolving {handle}..."):
            result = client.get(f"/v1/identity/resolve", params={"handle": handle})
        console.print(f"Resolved: [bold cyan]{handle}[/bold cyan] -> [magenta]{result.get('eth_address')}[/magenta]")
        console.print(f"Trust Level: {result.get('trust_level')}")
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {str(e)}")

@identity_app.command("did")
def get_did(address: str):
    """Fetch the W3C DID document for an agent."""
    client = IntegrityClient()
    try:
        with console.status(f"[bold blue]Fetching DID for {address}..."):
            result = client.get(f"/v1/identity/agent/{address}")
        console.print_json(data=result.get("did_document"))
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {str(e)}")

@identity_app.command("revoke")
def revoke_identity(
    address: str = typer.Argument(..., help="ETH address to revoke"),
    reason: str = typer.Option(..., "--reason", "-r", help="Reason for revocation"),
    evidence: Optional[str] = typer.Option(None, "--evidence", "-e", help="Hash of forensic evidence")
):
    """Permanently revoke an agent identity."""
    client = IntegrityClient()
    payload = {"agent_address": address, "reason": reason, "evidence_hash": evidence}
    try:
        with console.status(f"[bold red]Revoking {address}..."):
            result = client.post("/v1/identity/revoke", json_data=payload)
        console.print(f"[bold green]Success:[/bold green] {result.get('message')}")
        console.print(f"DID: [dim]{result.get('did')}[/dim]")
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {str(e)}")

# --- Governance Commands ---

@governance_app.command("proposals")
def list_proposals():
    """List active governance proposals."""
    client = IntegrityClient()
    try:
        with console.status("[bold blue]Fetching proposals..."):
            proposals = client.get("/v1/governance/proposals")
        
        table = Table(title="Active Governance Proposals")
        table.add_column("ID", style="dim")
        table.add_column("Title", style="cyan")
        table.add_column("Votes For", style="green")
        table.add_column("Votes Against", style="red")

        for p in proposals:
            table.add_row(
                p.get("id"),
                p.get("title"),
                str(p.get("votes_for")),
                str(p.get("votes_against"))
            )
        console.print(table)
    except Exception as e:
        console.print(f"[bold red]Error fetching proposals:[/bold red] {str(e)}")

@governance_app.command("vote")
def vote_proposal(proposal_id: str, vote_type: str = typer.Option(..., help="Vote 'for' or 'against'")):
    """Vote on an active governance proposal."""
    client = IntegrityClient()
    try:
        with console.status(f"[bold blue]Voting {vote_type} on proposal {proposal_id}..."):
            client.post(f"/v1/governance/proposals/{proposal_id}/vote", json_data={"vote": vote_type})
        console.print("[bold green]Vote cast successfully.[/bold green]")
    except Exception as e:
        console.print(f"[bold red]Error casting vote:[/bold red] {str(e)}")

@governance_app.command("anchor")
def anchor_state():
    """Anchor the global reputation state on-chain (Admin only)."""
    client = IntegrityClient()
    try:
        with console.status("[bold blue]Computing and anchoring state root..."):
            result = client.post("/v1/protocol/anchor")
        console.print(f"[bold green]State Anchored Successfully[/bold green]")
        console.print(f"Merkle Root: [cyan]{result.get('merkle_root')}[/cyan]")
        console.print(f"Transaction: [dim]{result.get('tx_hash')}[/dim]")
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {str(e)}")

# --- Shield Commands ---

@shield_app.command("baas")
def list_baas():
    """List active Smart BAAs."""
    client = IntegrityClient()
    try:
        with console.status("[bold blue]Fetching Smart BAAs..."):
            baas = client.get("/v1/shield/baas")
        
        table = Table(title="Smart BAA Registry")
        table.add_column("ID", style="dim")
        table.add_column("Business Associate", style="cyan")
        table.add_column("Status", style="yellow")
        table.add_column("Stake", style="magenta")

        for b in baas:
            table.add_row(
                b.get("id"),
                b.get("businessAssociate"),
                b.get("status"),
                b.get("stakedITK")
            )
        console.print(table)
    except Exception as e:
        console.print(f"[bold red]Error fetching BAAs:[/bold red] {str(e)}")

@shield_app.command("propose")
def propose_baa(hospital: str, agent: str, amount: str):
    """Propose a new Smart BAA."""
    client = IntegrityClient()
    try:
        with console.status("[bold blue]Proposing Smart BAA..."):
            result = client.post("/v1/shield/baa/propose", json_data={
                "covered_entity": hospital,
                "business_associate": agent,
                "stake_amount": amount,
                "document_hash": "0xcli_generated_hash",
                "uri": "ipfs://cli_uri"
            })
        console.print("[bold green]Smart BAA Proposed Successfully.[/bold green]")
        console.print(f"BAA ID: [cyan]{result.get('baaId')}[/cyan]")
    except Exception as e:
        console.print(f"[bold red]Error proposing BAA:[/bold red] {str(e)}")

@shield_app.command("queue")
def compliance_queue():
    """View pending HIPAA violations in the Compliance Review Queue."""
    client = IntegrityClient()
    try:
        with console.status("[bold blue]Fetching Compliance Review Queue..."):
            violations = client.get("/v1/shield/compliance/review-queue")
        
        if not violations:
            console.print("[green]No pending violations. Queue is clear.[/green]")
            return

        table = Table(title="Compliance Review Queue")
        table.add_column("ID", style="dim")
        table.add_column("Time", style="cyan")
        table.add_column("Type", style="red bold")
        table.add_column("Agent", style="yellow")
        table.add_column("Detail", style="white")

        for v in violations:
            table.add_row(
                v.get("id"),
                v.get("time"),
                v.get("type"),
                v.get("agent"),
                v.get("detail")
            )
        console.print(table)
    except Exception as e:
        console.print(f"[bold red]Error fetching queue:[/bold red] {str(e)}")

# --- Credit Commands ---

@credit_app.command("profile")
def credit_profile(
    address: str = typer.Argument(..., help="Agent Ethereum address")
):
    """View credit profile and active loans for an agent."""
    client = IntegrityClient()
    try:
        with console.status("[bold blue]Fetching credit profile..."):
            profile = client.get(f"/v1/agent/{address}/credit/profile")
        
        table = Table(title=f"Credit Profile: {address}")
        table.add_column("Property", style="cyan")
        table.add_column("Value", style="magenta")
        table.add_row("Credit Score", str(profile.get("credit_score", 0)))
        table.add_row("Max Borrow Limit", f"{profile.get('max_borrow_limit', 0.0)} ITK")
        table.add_row("Total Borrowed", f"{profile.get('total_borrowed', 0.0)} ITK")
        table.add_row("Total Repaid", f"{profile.get('total_repaid', 0.0)} ITK")
        table.add_row("Default Count", str(profile.get("default_count", 0)))
        console.print(table)

        loans = profile.get("active_loans", [])
        if loans:
            loan_table = Table(title="Loans")
            loan_table.add_column("Loan ID", style="dim")
            loan_table.add_column("Principal", style="green")
            loan_table.add_column("Interest Rate", style="yellow")
            loan_table.add_column("Repaid Amount", style="blue")
            loan_table.add_column("Term Days", style="white")
            loan_table.add_column("Status", style="bold")
            loan_table.add_column("Due Date", style="dim")
            
            for l in loans:
                loan_table.add_row(
                    l.get("loan_id"),
                    f"{l.get('principal', 0.0)} ITK",
                    f"{l.get('interest_rate', 0.0) * 100}%",
                    f"{l.get('repaid_amount', 0.0)} ITK",
                    str(l.get('term_days')),
                    l.get("status"),
                    l.get("due_date")
                )
            console.print(loan_table)
        else:
            console.print("[yellow]No loans found for this agent.[/yellow]")
    except Exception as e:
        console.print(f"[bold red]Error fetching credit profile:[/bold red] {str(e)}")

@credit_app.command("borrow")
def credit_borrow(
    address: str = typer.Option(..., "--address", "-a", help="Agent Ethereum address"),
    amount: float = typer.Option(..., "--amount", help="Amount of ITK to borrow"),
    term_days: int = typer.Option(30, "--term", help="Term in days"),
):
    """Borrow ITK from the credit facility."""
    client = IntegrityClient()
    try:
        with console.status("[bold blue]Requesting loan..."):
            result = client.post(f"/v1/agent/{address}/credit/borrow", json_data={
                "amount": amount,
                "term_days": term_days,
                "collateral_contracts": []
            })
        console.print(f"[bold green]Success:[/bold green] Loan approved.")
        console.print(f"Agent Address: [cyan]{result.get('agent_address')}[/cyan]")
        console.print(f"Amount Borrowed: [green]{result.get('amount_borrowed')} ITK[/green]")
        console.print(f"Outstanding: [yellow]{result.get('new_outstanding')} ITK[/yellow]")
    except Exception as e:
        console.print(f"[bold red]Error borrowing:[/bold red] {str(e)}")

@credit_app.command("repay")
def credit_repay(
    address: str = typer.Option(..., "--address", "-a", help="Agent Ethereum address"),
    loan_id: str = typer.Option(..., "--loan-id", help="UUID of the loan to repay"),
    amount: float = typer.Option(..., "--amount", help="Amount of ITK to repay"),
):
    """Repay an outstanding loan."""
    client = IntegrityClient()
    try:
        with console.status("[bold blue]Processing repayment..."):
            result = client.post(f"/v1/agent/{address}/credit/repay", json_data={
                "loan_id": loan_id,
                "amount": amount
            })
        console.print(f"[bold green]Success:[/bold green] Repayment processed.")
        console.print(f"Status: {result.get('status')}")
    except Exception as e:
        console.print(f"[bold red]Error repaying:[/bold red] {str(e)}")

# --- Contract Factory Commands ---

@factory_app.command("deploy")
def factory_deploy(
    alias: str = typer.Option(..., "--alias", help="Agent alias/name for the contract"),
    oracle_address: str = typer.Option("0x0000000000000000000000000000000000000000", "--oracle", help="Authorized oracle address"),
    contract_type: str = typer.Option("SovereignAgent", "--type", help="Type of contract to deploy"),
):
    """Deploy a SovereignAgent or other smart contract from the factory."""
    client = IntegrityClient()
    try:
        with console.status("[bold blue]Deploying contract..."):
            result = client.post("/v1/contracts/factory/deploy", json_data={
                "alias": alias,
                "oracle_address": oracle_address,
                "contract_type": contract_type
            })
        console.print(f"[bold green]Success:[/bold green] Contract deployed.")
        console.print(f"Address: [cyan]{result.get('contract_address')}[/cyan]")
        console.print(f"Tx Hash: [cyan]{result.get('transaction_hash')}[/cyan]")
        console.print(f"Network: {result.get('network')}")
    except Exception as e:
        console.print(f"[bold red]Error deploying contract:[/bold red] {str(e)}")

@factory_app.command("list-market")
def factory_list_market(
    contract_address: str = typer.Option(..., "--address", "-a", help="Deployed contract address"),
    price_itk: float = typer.Option(..., "--price", help="Price in ITK"),
):
    """List a deployed contract on the marketplace."""
    client = IntegrityClient()
    try:
        with console.status("[bold blue]Listing on marketplace..."):
            result = client.post("/v1/contracts/list-market", json_data={
                "contract_address": contract_address,
                "price_itk": price_itk
            })
        console.print(f"[bold green]Success:[/bold green] Contract listed. Status: {result.get('status')}")
    except Exception as e:
        console.print(f"[bold red]Error listing contract:[/bold red] {str(e)}")


# --- Oracle Commands ---

oracle_app = typer.Typer(help="World Awareness Oracle Registry")
app.add_typer(oracle_app, name="oracle")

@oracle_app.command("register")
def register_oracle(
    alias: str = typer.Option(..., "--alias", help="Node Alias / Provider Name"),
    uri: str = typer.Option(..., "--uri", help="API Endpoint URI"),
    stake: int = typer.Option(5000, "--stake", help="ITK Staking Collateral (Min 5,000 ITK)")
):
    """Register a new Oracle Node and stake ITK collateral."""
    client = IntegrityClient()
    payload = {
        "name": alias,
        "uri": uri,
        "stake_amount": stake
    }
    try:
        with console.status(f"[bold blue]Registering Oracle Node '{alias}'..."):
            result = client.post("/v1/oracle/register", json_data=payload)
        console.print(f"[bold green]Success:[/bold green] Oracle node '{alias}' registered.")
        console.print(f"Transaction Hash: [cyan]{result.get('tx_hash', '0x...')}[/cyan]")
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {str(e)}")

@oracle_app.command("list")
def list_oracles():
    """List all registered Oracle Nodes in the network."""
    client = IntegrityClient()
    try:
        with console.status("[bold blue]Fetching Oracle Registry..."):
            result = client.get("/v1/oracle/list")
        
        table = Table(title="Oracle Nodes (World Awareness)")
        table.add_column("ID", style="cyan")
        table.add_column("Name", style="green")
        table.add_column("URI", style="magenta")
        table.add_column("Trust Score", style="yellow")
        table.add_column("Status", style="blue")
        
        # fallback to mock data if API is not fully up
        nodes = result.get('nodes', [
            {"id": 1, "name": "National Medical Library", "uri": "https://nml.gov/api", "trust_score": 980, "active": True},
            {"id": 2, "name": "Global Financial Index", "uri": "https://gfi.com/realtime", "trust_score": 950, "active": True},
            {"id": 5, "name": "Wikipedia", "uri": "https://en.wikipedia.org/w/api.php", "trust_score": 990, "active": True}
        ])
        
        for n in nodes:
            status = "[green]Active[/green]" if n.get('active') else "[red]Inactive[/red]"
            table.add_row(str(n.get('id')), n.get('name'), n.get('uri'), str(n.get('trust_score')), status)
            
        console.print(table)
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {str(e)}")


if __name__ == '__main__':
    app()
