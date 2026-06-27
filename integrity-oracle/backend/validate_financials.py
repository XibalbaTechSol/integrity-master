import sys
import requests
import json

BASE_URL = "http://localhost:8080"
SENDER = "0x5B5670D93038406468E0FA2c9683bF1673DEDbf3"
RECIPIENT = "0xd62982a313FfA10966e76CD9dA11708Edbb01B3f"
AGENT_ETH = "0x2573Aa3b86DBf4bc95252d39cC732EaB0E722c80" # Institutional_Ironclad in DB

def log_section(title):
    print("=" * 60)
    print(f" {title.upper()} ")
    print("=" * 60)

def test_wallet_balance():
    log_section("1. Wallet Balance Test")
    # Sender
    res_sender = requests.get(f"{BASE_URL}/v1/wallet/{SENDER}/balance")
    print(f"GET /v1/wallet/{SENDER}/balance: Status {res_sender.status_code}")
    print(json.dumps(res_sender.json(), indent=2))
    
    # Recipient
    res_recipient = requests.get(f"{BASE_URL}/v1/wallet/{RECIPIENT}/balance")
    print(f"GET /v1/wallet/{RECIPIENT}/balance: Status {res_recipient.status_code}")
    print(json.dumps(res_recipient.json(), indent=2))
    
    assert res_sender.status_code == 200
    assert res_recipient.status_code == 200

def test_wallet_transfer():
    log_section("2. Send / Receive (Transfer) Test")
    
    # Get initial balance of recipient
    bal_before = requests.get(f"{BASE_URL}/v1/wallet/{RECIPIENT}/balance").json()["balance_itk"]
    print(f"Recipient balance BEFORE: {bal_before} ITK")
    
    # Perform transfer
    payload = {
        "from_address": SENDER,
        "to_address": RECIPIENT,
        "amount_itk": 2500.0
    }
    res_transfer = requests.post(f"{BASE_URL}/v1/wallet/transfer", json=payload)
    print(f"POST /v1/wallet/transfer: Status {res_transfer.status_code}")
    print(json.dumps(res_transfer.json(), indent=2))
    
    assert res_transfer.status_code == 200
    assert res_transfer.json()["status"] == "success"
    
    # Verify balances AFTER
    bal_after = requests.get(f"{BASE_URL}/v1/wallet/{RECIPIENT}/balance").json()["balance_itk"]
    print(f"Recipient balance AFTER: {bal_after} ITK")
    
    # Balance should increase by 2500
    assert bal_after == bal_before + 2500.0
    print("[+] Send/Receive transfer validated successfully!")

def test_credit_and_loans():
    log_section("3. Credit Profile and Loan Borrow/Repay Test")
    
    # Fetch credit profile
    res_profile = requests.get(f"{BASE_URL}/v1/agent/{AGENT_ETH}/credit/profile")
    print(f"GET /v1/agent/{AGENT_ETH}/credit/profile: Status {res_profile.status_code}")
    profile = res_profile.json()
    print(json.dumps(profile, indent=2))
    
    assert res_profile.status_code == 200
    initial_borrowed = profile.get("total_borrowed", 0.0)
    
    # Borrow 500 ITK reputation loan
    borrow_payload = {
        "amount": 500.0,
        "term_days": 30
    }
    res_borrow = requests.post(f"{BASE_URL}/v1/agent/{AGENT_ETH}/credit/borrow", json=borrow_payload)
    print(f"POST /v1/agent/{AGENT_ETH}/credit/borrow: Status {res_borrow.status_code}")
    print(json.dumps(res_borrow.json(), indent=2))
    
    assert res_borrow.status_code == 200
    assert res_borrow.json()["status"] == "approved"
    
    # Fetch credit profile again to verify total_borrowed increase
    profile_after = requests.get(f"{BASE_URL}/v1/agent/{AGENT_ETH}/credit/profile").json()
    print(f"Credit profile total_borrowed after borrow: {profile_after.get('total_borrowed')}")
    assert profile_after.get("total_borrowed") == initial_borrowed + 500.0
    
    # Repay the loan (500 ITK)
    # Find the active loan ID we just created
    active_loans = profile_after.get("active_loans", [])
    assert len(active_loans) > 0
    loan_id = active_loans[-1]["loan_id"]
    
    repay_payload = {
        "loan_id": loan_id,
        "amount": 500.0
    }
    res_repay = requests.post(f"{BASE_URL}/v1/agent/{AGENT_ETH}/credit/repay", json=repay_payload)
    print(f"POST /v1/agent/{AGENT_ETH}/credit/repay: Status {res_repay.status_code}")
    print(json.dumps(res_repay.json(), indent=2))
    
    assert res_repay.status_code == 200
    assert res_repay.json()["status"] == "repaid" or res_repay.json()["status"] == "success"
    
    # Fetch credit profile again to verify repayment reflected
    profile_final = requests.get(f"{BASE_URL}/v1/agent/{AGENT_ETH}/credit/profile").json()
    print(f"Credit profile total_borrowed after repayment: {profile_final.get('total_borrowed')}")
    assert profile_final.get("total_borrowed") == initial_borrowed
    
    print("[+] Credit Profile, Loan Borrow, and Repay validated successfully!")

if __name__ == "__main__":
    try:
        test_wallet_balance()
        test_wallet_transfer()
        test_credit_and_loans()
        log_section("All Financial Tab Functions work perfectly!")
        sys.exit(0)
    except Exception as e:
        print(f"[-] Validation failed: {e}")
        sys.exit(1)
