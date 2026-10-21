import os
import io
import shutil
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Header, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
import pandas as pd
from dotenv import load_dotenv

from database import db_manager
from sanitizer import DataSanitizer
from demo_data import generate_demo_dataset
from ai_analyst import ai_analyst

load_dotenv()

app = FastAPI(
    title="NeuroData BI Engine",
    description="High-performance persistent DuckDB analytical engine with Smart Data Sanitizer and Gemini Copilot",
    version="1.1.0"
)

# CORS Configuration for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AskRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=1000, description="Analytical natural language question")
    session_id: Optional[str] = Field(None, description="Active session ID for persistent conversational memory")
    gemini_api_key: Optional[str] = Field(None, description="Optional user Gemini API Key")
    simulate_healing: Optional[bool] = Field(False, description="Simulate an intentional query failure to demonstrate the self-healing agent loop")

class QueryRequest(BaseModel):
    sql: str = Field(..., min_length=5, description="DuckDB SQL query")

@app.get("/api/health")
def health_check():
    """Service health and database state verification."""
    return {
        "status": "healthy",
        "service": "NeuroData BI Analytics Engine",
        "has_dataset_loaded": db_manager.has_data,
        "active_session_id": db_manager.active_session_id,
        "engine": "DuckDB (Persistent Storage) + Gemini 2.5 Flash + Smart Data Sanitizer + Conversational Memory"
    }

@app.get("/api/session/restore")
def restore_session(
    session_id: Optional[str] = Query(None),
    x_session_id: Optional[str] = Header(None)
):
    """
    Restores the last loaded dataset, schema profile, KPIs, cleaning report,
    and persistent chat history (up to 100 messages) from DuckDB storage.
    """
    sid = session_id or x_session_id
    restored = db_manager.restore_session(sid)
    if not restored:
        return {
            "success": False,
            "restored": False,
            "message": "No active dataset found in persistent storage. Please load demo data or upload a file."
        }
    return {
        "success": True,
        "restored": True,
        "session_id": restored["session_id"],
        "original_filename": restored.get("original_filename", ""),
        "profile": restored["profile"],
        "cleaning_report": restored["cleaning_report"],
        "chat_history": restored.get("chat_history", [])
    }

@app.post("/api/demo")
def load_demo(
    session_id: Optional[str] = Query(None),
    x_session_id: Optional[str] = Header(None)
):
    """
    Generates realistic B2B/B2C E-commerce dataset, sanitizes it via DataSanitizer,
    loads it into persistent DuckDB, and returns full data profiling + cleaning report.
    """
    try:
        sid = session_id or x_session_id or "demo_session"
        raw_df = generate_demo_dataset()
        clean_df, cleaning_report = DataSanitizer.sanitize(raw_df, original_filename="ecommerce_demo_sales.csv")
        profile = db_manager.load_dataset(
            df=clean_df, 
            session_id=sid, 
            original_filename="ecommerce_demo_sales.csv",
            cleaning_report=cleaning_report
        )
        return {
            "success": True,
            "message": "Demo E-Commerce dataset loaded and auto-cleaned successfully.",
            "profile": profile,
            "cleaning_report": cleaning_report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load demo dataset: {str(e)}")

@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    session_id: Optional[str] = Query(None),
    x_session_id: Optional[str] = Header(None)
):
    """
    Accepts CSV or Excel spreadsheet, cleans it through Smart Data Sanitizer
    (header detection, snake_case normalization, currency/date coercion),
    and stores it persistently into DuckDB.
    """
    filename = (file.filename or "").lower()
    if not (filename.endswith(".csv") or filename.endswith(".xlsx") or filename.endswith(".xls")):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload a .csv or .xlsx / .xls file."
        )

    try:
        contents = await file.read()
        if len(contents) > 50 * 1024 * 1024:  # 50 MB limit
            raise HTTPException(status_code=400, detail="File size exceeds maximum 50MB limit.")

        if filename.endswith(".csv"):
            try:
                raw_df = pd.read_csv(io.BytesIO(contents), encoding="utf-8")
            except UnicodeDecodeError:
                raw_df = pd.read_csv(io.BytesIO(contents), encoding="latin-1")
        else:
            raw_df = pd.read_excel(io.BytesIO(contents))

        if raw_df.empty:
            raise HTTPException(status_code=400, detail="The uploaded file contains no data.")

        # Execute Auto-Cleaning ETL Pipeline
        clean_df, cleaning_report = DataSanitizer.sanitize(raw_df, original_filename=file.filename or "")

        if clean_df.empty or len(clean_df.columns) == 0:
            raise HTTPException(status_code=400, detail="Unable to extract valid columns from file.")

        sid = session_id or x_session_id or "user_upload_session"
        profile = db_manager.load_dataset(
            df=clean_df,
            session_id=sid,
            original_filename=file.filename or "upload.csv",
            cleaning_report=cleaning_report
        )

        return {
            "success": True,
            "filename": file.filename,
            "message": f"Successfully sanitized and loaded {len(clean_df):,} records into DuckDB.",
            "profile": profile,
            "cleaning_report": cleaning_report
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/api/ask")
def ask_question(
    payload: AskRequest,
    x_session_id: Optional[str] = Header(None)
):
    """
    Analyzes user question with Deep Conversational Memory (up to 100 turns):
    - Retrieves prior conversation context and executed SQL.
    - Generates context-aware DuckDB SQL via Gemini 2.5 Flash or Smart Fallback engine.
    - Runs autonomous Self-Healing loop if DuckDB runtime errors occur.
    - Automatically persists both user question and AI answer to DuckDB chat_history.
    """
    if not db_manager.has_data:
        raise HTTPException(
            status_code=400,
            detail="No dataset loaded. Please upload a CSV/Excel file or launch Demo Dataset first."
        )

    sid = payload.session_id or x_session_id or db_manager.active_session_id or "default_session"

    # Save user message to persistent DuckDB history
    user_msg_id = db_manager.save_chat_message(
        session_id=sid,
        role="user",
        content=payload.question
    )

    try:
        analysis = ai_analyst.analyze_question(
            question=payload.question,
            user_api_key=payload.gemini_api_key,
            simulate_healing=bool(payload.simulate_healing),
            session_id=sid
        )

        # Save assistant message to persistent DuckDB history
        ai_msg_id = db_manager.save_chat_message(
            session_id=sid,
            role="assistant",
            content=analysis.get("explanation", ""),
            sql_query=analysis.get("sql_query"),
            chart_config=analysis.get("chart_config"),
            reasoning_trace=analysis.get("reasoning_trace"),
            healing_attempts=analysis.get("healing_attempts", 0),
            failed_queries=analysis.get("failed_queries"),
            is_healed=bool(analysis.get("is_healed")),
            engine=analysis.get("engine")
        )

        analysis["user_message_id"] = user_msg_id
        analysis["ai_message_id"] = ai_msg_id
        analysis["session_id"] = sid
        return analysis

    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.delete("/api/chat/clear")
def clear_chat_history(
    session_id: Optional[str] = Query(None),
    x_session_id: Optional[str] = Header(None)
):
    """
    Deletes all persistent chat history for the active session, resetting the memory window.
    """
    sid = session_id or x_session_id or db_manager.active_session_id or "default_session"
    deleted_count = db_manager.clear_chat_history(sid)
    return {
        "success": True,
        "session_id": sid,
        "deleted_count": deleted_count,
        "message": f"Successfully cleared {deleted_count} messages from conversation memory."
    }

@app.get("/api/chat/history")
def get_chat_history(
    session_id: Optional[str] = Query(None),
    x_session_id: Optional[str] = Header(None),
    limit: int = 100
):
    """
    Retrieves the last `limit` messages (up to 100) from persistent DuckDB chat history.
    """
    sid = session_id or x_session_id or db_manager.active_session_id or "default_session"
    messages = db_manager.get_chat_history(sid, limit=limit)
    return {
        "session_id": sid,
        "count": len(messages),
        "messages": messages
    }

@app.post("/api/query")
def direct_query(payload: QueryRequest):
    """
    Executes a direct DuckDB SQL query against the active dataset table with security validation.
    """
    if not db_manager.has_data:
        raise HTTPException(status_code=400, detail="No dataset loaded.")
    try:
        result = db_manager.execute_query(payload.sql)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query execution error: {str(e)}")

@app.get("/api/profile")
def get_current_profile():
    """Returns the current dataset schema, sample rows, and KPIs."""
    if not db_manager.has_data:
        return {"has_data": False, "columns": [], "kpis": {}}
    return db_manager.get_data_profile()

# Static files / SPA serving (supports containerized and unified deployment)
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "static"))

dist_dir = STATIC_DIR if os.path.isdir(STATIC_DIR) else (FRONTEND_DIST if os.path.isdir(FRONTEND_DIST) else None)

if dist_dir and os.path.isdir(dist_dir):
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/", include_in_schema=False)
    async def serve_index():
        index_file = os.path.join(dist_dir, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        return {
            "service": "NeuroData BI Engine",
            "status": "online",
            "docs": "/docs",
            "api_health": "/api/health"
        }

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path == "api" or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="API route not found")
        file_path = os.path.join(dist_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(dist_dir, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Resource not found")
else:
    @app.get("/", include_in_schema=False)
    async def serve_api_info():
        return {
            "service": "NeuroData BI Engine",
            "status": "online",
            "docs": "/docs",
            "api_health": "/api/health"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
