import asyncio
import logging

# Simple mock slashing mechanism for testing
class MockProtocol:
    def __init__(self):
        self.stakes = {"node_1": 1000, "node_2": 1000}
        self.treasury = 0

    def slash(self, node_id, amount):
        if node_id in self.stakes:
            slashed_amount = min(self.stakes[node_id], amount)
            self.stakes[node_id] -= slashed_amount
            self.treasury += slashed_amount
            return True
        return False

async def simulate_slashing():
    protocol = MockProtocol()
    logging.info(f"Initial Stakes: {protocol.stakes}")

    # Simulate node_2 producing malicious reasoning
    slashed = protocol.slash("node_2", 200)
    
    assert slashed is True
    assert protocol.stakes["node_2"] == 800
    assert protocol.treasury == 200
    logging.info(f"Slashing successful. New Stakes: {protocol.stakes}, Treasury: {protocol.treasury}")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(simulate_slashing())
