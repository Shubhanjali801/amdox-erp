"""
Launcher for the Amdox ML microservice.
Run with:  python run.py
More reliable than `python -m uvicorn ...` inside Git Bash on Windows,
which can deliver a spurious KeyboardInterrupt to the server.
"""
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )
