from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/v1/agent/{agent_id}")
async def get_agent(agent_id: str):
    return {
        "agent_id": agent_id,
        "current_ais": 850, # High score for simulation
        "status": "active"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
