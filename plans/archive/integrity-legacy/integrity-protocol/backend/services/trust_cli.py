import click
import requests
import json
import time
import os
import random
from eth_account import Account
from eth_account.messages import encode_defunct

# Xibalba Solutions: ITK Agentic CLI (v1.2)
# "Form-First Engineering. Mathematical Certainty."

API_URL = os.getenv("INTEGRITY_API_URL", "http://localhost:8001")
CONFIG_DIR = ".integrity"
CONFIG_FILE = os.path.join(CONFIG_DIR, "config.json")

def save_config(data):
    if not os.path.exists(CONFIG_DIR):
        os.makedirs(CONFIG_DIR)
    with open(CONFIG_FILE, "w") as f:
        json.dump(data, f, indent=2)

def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    return {}

def output_result(data, as_json=False):
    if as_json:
        click.echo(json.dumps(data))
    else:
        # Simple pretty-print for humans
        if isinstance(data, dict):
            for k, v in data.items():
                click.echo(f"{k:20}: {v}")
        else:
            click.echo(data)

@click.group()
@click.option('--json', 'as_json', is_flag=True, help="Output in machine-readable JSON format.")
@click.pass_context
def cli(ctx, as_json):
    """ITK: The Integrity Protocol Developer & Agent Toolset."""
    ctx.ensure_object(dict)
    ctx.obj['JSON'] = as_json

@cli.command()
@click.pass_context
def init(ctx):
    """Initialize a new Integrity agent project."""
    if not ctx.obj['JSON']: click.echo("🛡️ Initializing Integrity Framework...")
    config = {
        "project_name": os.path.basename(os.getcwd()),
        "created_at": int(time.time()),
        "version": "1.2.0",
        "backend_url": API_URL
    }
    save_config(config)
    if ctx.obj['JSON']:
        click.echo(json.dumps(config))
    else:
        click.secho(f"✅ Created {CONFIG_FILE}", fg='green')

@cli.command()
@click.pass_context
def identity(ctx):
    """Manage agent identities (DIDs)."""
    if not ctx.obj['JSON']: click.echo("Generating secure Agent Identity...")
    acc = Account.create()
    
    identity_data = {
        "address": acc.address,
        "private_key": acc.key.hex(),
        "did": f"did:intg:{acc.address}"
    }
    
    config = load_config()
    config["identity"] = identity_data
    save_config(config)
    
    if ctx.obj['JSON']:
        click.echo(json.dumps(identity_data))
    else:
        click.secho(f"✅ Identity Created!", fg='green')
        click.echo(f"Address: {acc.address}")
        click.echo(f"DID:     {identity_data['did']}")
        click.secho("⚠️ Private key saved to .integrity/config.json. Keep it safe!", fg='yellow')

@cli.command()
@click.argument('address', required=False)
@click.pass_context
def check(ctx, address):
    """Check reputation vitals for an agent."""
    return resolve_logic(ctx, address)

@cli.command()
@click.argument('address', required=True)
@click.pass_context
def resolve(ctx, address):
    """Resolve peer reputation for A2A trust checks."""
    return resolve_logic(ctx, address)

def resolve_logic(ctx, address):
    if not address:
        config = load_config()
        address = config.get("identity", {}).get("address")
        if not address:
            click.secho("Error: No address found.", fg='red')
            return

    vitals = {
        "address": address,
        "entropy": 0.14,
        "grounding": 0.92,
        "ais": 842,
        "tier": "AAA",
        "timestamp": int(time.time()),
        "xns_handle": "hermes_sovereign.intg"
    }
    output_result(vitals, ctx.obj['JSON'])

@cli.command()
@click.argument('message')
@click.pass_context
def sign(ctx, message):
    """Sign a message using the agent's private key (for A2A trust)."""
    config = load_config()
    pk = config.get("identity", {}).get("private_key")
    if not pk:
        click.secho("Error: No identity found. Run 'itk identity' first.", fg='red')
        return

    msg = encode_defunct(text=message)
    signed = Account.sign_message(msg, private_key=pk)
    
    result = {
        "address": config["identity"]["address"],
        "message": message,
        "signature": signed.signature.hex()
    }
    output_result(result, ctx.obj['JSON'])

@cli.command()
@click.option('--deal-id', required=True, help="Unique identifier for the transaction.")
@click.option('--performer', required=True, help="ETH address of the performer.")
@click.option('--amount', type=float, required=True, help="ITK value of the deal.")
@click.option('--latency', type=int, required=True, help="Inference latency in ms.")
@click.option('--accuracy', type=float, required=True, help="Accuracy score (0.0 - 1.0).")
@click.pass_context
def report(ctx, deal_id, performer, amount, latency, accuracy):
    """Report metrics directly to the protocol (Agentic reporting)."""
    config = load_config()
    address = config.get("identity", {}).get("address")
    if not address:
        click.secho("Error: No identity found.", fg='red')
        return

    # Simulate reporting to the backend
    report_data = {
        "status": "VALIDATED",
        "deal_id": deal_id,
        "ais_impact": 0.85,
        "integrity_hash": "0x" + random.getrandbits(256).to_bytes(32, 'big').hex()
    }
    output_result(report_data, ctx.obj['JSON'])

@cli.command()
@click.pass_context
def vault(ctx):
    """View ITK balances and staking status."""
    config = load_config()
    address = config.get("identity", {}).get("address", "N/A")
    
    vault_data = {
        "address": address,
        "itk_liquid": 10000.0,
        "itk_staked": 2500.0,
        "apr": 0.125
    }
    output_result(vault_data, ctx.obj['JSON'])

@cli.command()
def stream():
    """Watch the 'Trust Stream' of real-time telemetry."""
    click.echo("[*] Subscribing to Integrity Trust Stream... (Press Ctrl+C to exit)")
    try:
        while True:
            event_types = ["INFERENCE", "HITL_GROUNDING", "STAKE_LOCKED", "AUDIT_REQUEST"]
            agents = ["0xAgentAlpha", "0xTrustMeBot", "0xWildcardAgent"]
            e = random.choice(event_types)
            a = random.choice(agents)
            click.secho(f"[{time.strftime('%H:%M:%S')}] {e:15} | Agent: {a}", fg='green' if 'AUDIT' in e else 'white')
            time.sleep(1.5)
    except KeyboardInterrupt:
        click.echo("\n[!] Stream disconnected.")

if __name__ == "__main__":
    cli()
