"""
Hexadynamics - Smart Mining Safety & Hazard Detection System
FastAPI Backend Architecture for SIH26007
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import asyncio
import time
import math

app = FastAPI(
    title="HEXADYNAMICS Mining Safety API",
    description="Real-Time Smart Mining Safety & Hazard Detection System for Low-Visibility Open Cast Iron Ore Mines",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active WebSocket connections
connected_clients: List[WebSocket] = []

@app.get("/api/health")
async def health_check():
    return {
        "status": "OPERATIONAL",
        "team": "Hexadynamics",
        "batch": "2028",
        "problem_statement": "SIH26007",
        "region": "Bailadila Open-Cast Iron Ore Mine",
        "timestamp": time.time()
    }

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_json({"type": "pong", "time": time.time()})
    except WebSocketDisconnect:
        connected_clients.remove(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
