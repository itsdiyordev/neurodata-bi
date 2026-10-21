import os
import io
import shutil
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
from dotenv import load_dotenv

from database import db_manager
from demo_data import generate_demo_dataset
from ai_analyst import ai_analyst

load_dotenv()

app = FastAPI(
    title="NeuroData BI Engine",
    description="High-performance in-memory DuckDB analytical engine with Gemini 2.5 Flash copilot",
    version="1.0.0"
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
    gemini_api_key: Optional[str] = Field(None, description="Optional user Gemini API Key")

class QueryRequest(BaseModel):
    sql: str = Field(..., min_length=5, description="DuckDB SQL query")

@app.get("/api/health")
def health_check():
    """Service health and database state verification."""
    return {
        "status": "healthy",
        "service": "NeuroData BI Analytics Engine",
        "has_dataset_loaded": db_manager.has_data,
        "engine": "DuckDB (In-Memory) + Gemini 2.5 Flash"
    }

@app.post("/api/demo")
def load_demo():
    """
    Generates a 380+ row realistic B2B/B2C E-commerce dataset,
    loads it into DuckDB table 'dataset', and returns full data profiling.
    """
    try:
        df = generate_demo_dataset()
        profile = db_manager.reset_and_load_dataframe(df)
        return {
            "success": True,
            "message": "Demo E-Commerce dataset loaded successfully into DuckDB (table: dataset).",
            "profile": profile
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load demo dataset: {str(e)}")

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Accepts CSV or Excel spreadsheet, loads it into DuckDB table 'dataset',
    profiles the schema, calculates KPIs, and generates initial overview visualization.
    """
    filename = (file.filename or "").lower()
    if not (filename.endswith(".csv") or filename.endswith(".xlsx") or filename.endswith(".xls")):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload a .csv or .xlsx / .xls file."
        )

    try:
        contents = await file.read()
        if len(contents) > 50 * 1024 * 1024: # 50 MB limit
            raise HTTPException(status_code=400, detail="File size exceeds maximum 50MB limit.")

        if filename.endswith(".csv"):
            # Attempt UTF-8 with latin-1 fallback
            try:
                df = pd.read_csv(io.BytesIO(contents), encoding="utf-8")
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(contents), encoding="latin-1")
        else:
            df = pd.read_excel(io.BytesIO(contents))

        # Clean column names (strip whitespace and special characters)
        df.columns = [str(c).strip().replace(" ", "_").replace("-", "_") for c in df.columns]

        if df.empty or len(df.columns) == 0:
            raise HTTPException(status_code=400, detail="The uploaded file contains no data or columns.")

        profile = db_manager.reset_and_load_dataframe(df)
        return {
            "success": True,
            "filename": file.filename,
            "message": f"Successfully loaded {len(df)} records into DuckDB.",
            "profile": profile
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing file: {str(e)}")

@app.post("/api/ask")
def ask_question(payload: AskRequest):
    """
    Analyzes user question, extracts schema, generates DuckDB SQL via Gemini 2.5 Flash
    (or smart deterministic fallback parser), executes query in DuckDB, and returns
    SQL, chart config, explanation, and AI reasoning steps.
    """
    if not db_manager.has_data:
        raise HTTPException(
            status_code=400,
            detail="No dataset loaded. Please upload a CSV/Excel file or launch Demo Dataset first."
        )

    try:
        analysis = ai_analyst.analyze_question(
            question=payload.question,
            user_api_key=payload.gemini_api_key
        )
        return analysis
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
