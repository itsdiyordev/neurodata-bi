import os
import io
import asyncio
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, UploadFile, File, HTTPException, Header, Query, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
import pandas as pd
from dotenv import load_dotenv

from database import db_manager, clean_table_name
from sanitizer import DataSanitizer
from demo_data import generate_relational_demo_datasets, generate_demo_dataset
from ai_analyst import ai_analyst

load_dotenv()

app = FastAPI(
    title="NeuroData BI Engine",
    description="High-performance persistent DuckDB multi-table relational engine with async pipeline and Gemini Copilot",
    version="1.2.0"
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

class PinWidgetPayload(BaseModel):
    session_id: Optional[str] = None
    title: str
    sql_query: str
    chart_config: Dict[str, Any]
    chart_data: Optional[List[Dict[str, Any]]] = None
    insight_summary: Optional[str] = ""

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
    tables = db_manager.get_workspace_tables()
    return {
        "status": "healthy",
        "service": "NeuroData BI Analytics Engine",
        "has_dataset_loaded": db_manager.has_data,
        "active_session_id": db_manager.active_session_id,
        "active_table": db_manager.table_name,
        "loaded_tables_count": len(tables),
        "tables": [t["table_name"] for t in tables],
        "engine": "DuckDB (Thread-Safe Persistent Multi-Table Storage) + Async Non-Blocking Gemini Pipeline"
    }

@app.get("/api/session/restore")
async def restore_session(
    session_id: Optional[str] = Query(None),
    x_session_id: Optional[str] = Header(None)
):
    """
    Restores the full multi-table relational workspace, schema profile, KPIs,
    detected relationships, persistent chat history, proactive insights, and pinned dashboard widgets.
    """
    sid = session_id or x_session_id
    restored = await asyncio.to_thread(db_manager.restore_session, sid)
    if not restored:
        return {
            "success": False,
            "restored": False,
            "message": "No active dataset found in persistent storage. Please load demo data or upload a file."
        }

    actual_sid = restored["session_id"]
    proactive_insights = await asyncio.to_thread(db_manager.generate_proactive_insights, actual_sid)
    pinned_widgets = await asyncio.to_thread(db_manager.get_pinned_widgets, actual_sid)

    return {
        "success": True,
        "restored": True,
        "session_id": restored["session_id"],
        "active_table": restored["table_name"],
        "original_filename": restored.get("original_filename", ""),
        "profile": restored["profile"],
        "workspace_tables": restored.get("workspace_tables", []),
        "relationships": restored.get("relationships", []),
        "cleaning_report": restored["cleaning_report"],
        "chat_history": restored.get("chat_history", []),
        "proactive_insights": proactive_insights,
        "pinned_widgets": pinned_widgets
    }

@app.post("/api/demo")
async def load_demo(
    session_id: Optional[str] = Query(None),
    x_session_id: Optional[str] = Header(None)
):
    """
    Generates 3 interconnected relational tables (orders, customers, products),
    sanitizes them through DataSanitizer, and loads them into persistent DuckDB with auto-JOIN detection,
    proactive insights generation, and pre-seeded pinned dashboard widgets.
    """
    try:
        sid = session_id or x_session_id or "demo_session"
        tables_dict = generate_relational_demo_datasets()

        clean_tables = {}
        cleaning_reports = {}
        for tbl_name, raw_df in tables_dict.items():
            clean_df, report = DataSanitizer.sanitize(raw_df, original_filename=f"{tbl_name}.csv")
            clean_tables[tbl_name] = clean_df
            cleaning_reports[tbl_name] = report

        profile = await asyncio.to_thread(
            db_manager.load_multi_tables,
            tables_dict=clean_tables,
            session_id=sid,
            cleaning_reports=cleaning_reports,
            primary_table="orders"
        )

        # Seed 2 default pinned widgets if none exist yet for immediate board experience
        existing_pins = await asyncio.to_thread(db_manager.get_pinned_widgets, sid)
        if not existing_pins:
            trend_query = """SELECT strftime(CAST(order_date AS DATE), '%b %Y') as period, ROUND(SUM(revenue), 2) as total_revenue FROM orders GROUP BY 1, strftime(CAST(order_date AS DATE), '%Y-%m') ORDER BY strftime(CAST(order_date AS DATE), '%Y-%m') ASC;""".strip()
            try:
                trend_res = await asyncio.to_thread(db_manager.execute_query, trend_query)
                await asyncio.to_thread(
                    db_manager.save_pinned_widget,
                    session_id=sid,
                    title="Monthly Revenue Trend (March Anomaly)",
                    sql_query=trend_query,
                    chart_config={
                        "type": "area",
                        "x_key": "period",
                        "y_key": "total_revenue",
                        "title": "Monthly Revenue Trend (March Anomaly)"
                    },
                    chart_data=trend_res.get("data", []),
                    insight_summary="Sales dropped noticeably in March 2024 due to critical supply chain bottlenecks before rebounding in Q2.",
                    widget_id=f"demo_pin_1_{sid}"
                )
            except Exception as e:
                print(f"[main] Demo pin 1 seed error: {e}")

            cat_query = """SELECT p.category, ROUND(SUM(o.revenue), 2) as total_revenue FROM orders o JOIN products p ON o.product_id = p.product_id GROUP BY p.category ORDER BY total_revenue DESC;""".strip()
            try:
                cat_res = await asyncio.to_thread(db_manager.execute_query, cat_query)
                await asyncio.to_thread(
                    db_manager.save_pinned_widget,
                    session_id=sid,
                    title="Product Category Revenue Breakdown",
                    sql_query=cat_query,
                    chart_config={
                        "type": "bar",
                        "x_key": "category",
                        "y_key": "total_revenue",
                        "title": "Product Category Revenue Breakdown"
                    },
                    chart_data=cat_res.get("data", []),
                    insight_summary="Cloud Infrastructure and Hardware represent over 72% of total transactional volume.",
                    widget_id=f"demo_pin_2_{sid}"
                )
            except Exception as e:
                print(f"[main] Demo pin 2 seed error: {e}")

        workspace_tables = db_manager.get_workspace_tables(sid)
        relationships = db_manager.detect_relationships(sid)
        proactive_insights = await asyncio.to_thread(db_manager.generate_proactive_insights, sid)
        pinned_widgets = await asyncio.to_thread(db_manager.get_pinned_widgets, sid)

        return {
            "success": True,
            "session_id": sid,
            "message": "Multi-table relational demo workspace loaded (3 tables: orders, customers, products).",
            "profile": profile,
            "cleaning_report": cleaning_reports.get("orders"),
            "workspace_tables": workspace_tables,
            "relationships": relationships,
            "proactive_insights": proactive_insights,
            "pinned_widgets": pinned_widgets
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
    Uploads a CSV or Excel file as a new named table in the multi-table workspace.
    Derives clean SQL table name, detects relational join keys, and scans for proactive statistical insights.
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

        # Clean table name derivation
        tbl_name = clean_table_name(file.filename or "upload_data")

        # Execute Auto-Cleaning ETL Pipeline
        clean_df, cleaning_report = DataSanitizer.sanitize(raw_df, original_filename=file.filename or "")

        if clean_df.empty or len(clean_df.columns) == 0:
            raise HTTPException(status_code=400, detail="Unable to extract valid columns from file.")

        sid = session_id or x_session_id or "user_upload_session"
        profile = await asyncio.to_thread(
            db_manager.load_table,
            df=clean_df,
            table_name=tbl_name,
            session_id=sid,
            original_filename=file.filename or f"{tbl_name}.csv",
            cleaning_report=cleaning_report
        )

        workspace_tables = db_manager.get_workspace_tables(sid)
        relationships = db_manager.detect_relationships(sid)
        proactive_insights = await asyncio.to_thread(db_manager.generate_proactive_insights, sid)
        pinned_widgets = await asyncio.to_thread(db_manager.get_pinned_widgets, sid)

        return {
            "success": True,
            "filename": file.filename,
            "table_name": tbl_name,
            "message": f"Successfully sanitized and loaded {len(clean_df):,} records into table '{tbl_name}'.",
            "profile": profile,
            "cleaning_report": cleaning_report,
            "workspace_tables": workspace_tables,
            "relationships": relationships,
            "proactive_insights": proactive_insights,
            "pinned_widgets": pinned_widgets
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.delete("/api/tables/{table_name}")
async def delete_table(table_name: str):
    """
    Deletes an individual table from the multi-table workspace.
    """
    deleted = await asyncio.to_thread(db_manager.delete_table, table_name)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found or could not be removed.")

    profile = db_manager.get_data_profile()
    workspace_tables = db_manager.get_workspace_tables()
    relationships = db_manager.detect_relationships()

    return {
        "success": True,
        "message": f"Table '{table_name}' removed from workspace.",
        "deleted_table": table_name,
        "profile": profile,
        "workspace_tables": workspace_tables,
        "relationships": relationships
    }

@app.post("/api/tables/active/{table_name}")
async def set_active_table(table_name: str):
    """
    Switches the active preview table in the workspace.
    """
    profile = await asyncio.to_thread(db_manager.switch_active_table, table_name)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found in workspace.")
    
    return {
        "success": True,
        "active_table": table_name,
        "profile": profile,
        "workspace_tables": db_manager.get_workspace_tables(),
        "relationships": db_manager.detect_relationships()
    }

@app.post("/api/dashboard/pin")
async def pin_widget(
    payload: PinWidgetPayload,
    session_id: Optional[str] = Query(None),
    x_session_id: Optional[str] = Header(None)
):
    """
    Saves an interactive chart widget to the session's persistent pinned dashboard.
    """
    sid = payload.session_id or session_id or x_session_id or db_manager.active_session_id or "default_session"
    widget = await asyncio.to_thread(
        db_manager.save_pinned_widget,
        session_id=sid,
        title=payload.title,
        sql_query=payload.sql_query,
        chart_config=payload.chart_config,
        chart_data=payload.chart_data,
        insight_summary=payload.insight_summary or ""
    )
    all_widgets = await asyncio.to_thread(db_manager.get_pinned_widgets, sid)
    return {
        "success": True,
        "widget": widget,
        "pinned_widget": widget,
        "pinned_widgets": all_widgets
    }

@app.delete("/api/dashboard/pin/{widget_id}")
async def unpin_widget(
    widget_id: str,
    session_id: Optional[str] = Query(None),
    x_session_id: Optional[str] = Header(None)
):
    """
    Removes a pinned chart widget from the session's dashboard.
    """
    sid = session_id or x_session_id or db_manager.active_session_id or "default_session"
    await asyncio.to_thread(db_manager.delete_pinned_widget, sid, widget_id)
    all_widgets = await asyncio.to_thread(db_manager.get_pinned_widgets, sid)
    return {
        "success": True,
        "removed_id": widget_id,
        "pinned_widgets": all_widgets
    }

@app.post("/api/ask")
async def ask_question(
    payload: AskRequest,
    background_tasks: BackgroundTasks,
    x_session_id: Optional[str] = Header(None)
):
    """
    Non-blocking async query analysis endpoint:
    - Multi-table schema reasoning with automatic JOIN generation.
    - Zero blocking on older turns (>15 msgs) via cached executive summaries.
    - Asynchronously delegates rolling summary updates to BackgroundTasks.
    - Thread-safe DuckDB execution with Self-Healing error recovery.
    """
    if not db_manager.has_data:
        raise HTTPException(
            status_code=400,
            detail="No dataset loaded. Please upload a CSV/Excel file or launch Demo Dataset first."
        )

    sid = payload.session_id or x_session_id or db_manager.active_session_id or "default_session"

    # Save user message to persistent DuckDB history
    user_msg_id = await asyncio.to_thread(
        db_manager.save_chat_message,
        session_id=sid,
        role="user",
        content=payload.question
    )

    try:
        # Fully non-blocking async analysis
        analysis = await ai_analyst.analyze_question_async(
            question=payload.question,
            user_api_key=payload.gemini_api_key,
            simulate_healing=bool(payload.simulate_healing),
            session_id=sid
        )

        # Save assistant message to persistent DuckDB history
        ai_msg_id = await asyncio.to_thread(
            db_manager.save_chat_message,
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

        # Trigger rolling summary update asynchronously in the background (NON-BLOCKING)
        background_tasks.add_task(
            ai_analyst.update_summary_in_background,
            session_id=sid,
            user_api_key=payload.gemini_api_key
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
async def clear_chat_history(
    session_id: Optional[str] = Query(None),
    x_session_id: Optional[str] = Header(None)
):
    """
    Deletes all persistent chat history and summary for the active session.
    """
    sid = session_id or x_session_id or db_manager.active_session_id or "default_session"
    deleted_count = await asyncio.to_thread(db_manager.clear_chat_history, sid)
    ai_analyst.clear_session_summary(sid)
    return {
        "success": True,
        "session_id": sid,
        "deleted_count": deleted_count,
        "message": f"Successfully cleared {deleted_count} messages from conversation memory."
    }

@app.get("/api/chat/history")
async def get_chat_history(
    session_id: Optional[str] = Query(None),
    x_session_id: Optional[str] = Header(None),
    limit: int = 100
):
    """
    Retrieves the last `limit` messages (up to 100) from persistent DuckDB chat history.
    """
    sid = session_id or x_session_id or db_manager.active_session_id or "default_session"
    messages = await asyncio.to_thread(db_manager.get_chat_history, sid, limit)
    return {
        "session_id": sid,
        "count": len(messages),
        "messages": messages
    }

@app.post("/api/query")
async def direct_query(payload: QueryRequest):
    """
    Executes a direct DuckDB SQL query against the active dataset table with security validation.
    """
    if not db_manager.has_data:
        raise HTTPException(status_code=400, detail="No dataset loaded.")
    try:
        result = await asyncio.to_thread(db_manager.execute_query, payload.sql)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query execution error: {str(e)}")

@app.get("/api/profile")
async def get_current_profile():
    """Returns the current dataset schema, sample rows, KPIs, and workspace tables."""
    if not db_manager.has_data:
        return {"has_data": False, "columns": [], "kpis": {}, "workspace_tables": [], "relationships": []}
    return await asyncio.to_thread(db_manager.get_data_profile)

# Static files / SPA serving
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
