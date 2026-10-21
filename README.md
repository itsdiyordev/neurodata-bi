# NeuroData BI — AI Data Analyst & Data Scientist Platform (Phase 1 MVP)

> **Next-Generation B2B SaaS AI Analytics Platform** powered by an in-memory **DuckDB** analytical SQL engine, **Gemini 2.5 Flash** copilot, and an **Obsidian Dark Mode** reactive interface built with React, Vite, Tailwind CSS, Recharts, and Framer Motion.

---

## 🚀 Key Features

### 1. Persistent DuckDB Analytical Engine & Session Storage (`/backend`)
- **Persistent Local File Storage**: Stores tables in a local DuckDB file (`backend/data/neurodata_store.duckdb`), preventing data loss across server restarts and browser reloads.
- **Session Isolation & Auto-Restore**: Generates isolated session tables (`dataset_<session_id>`) with persistent metadata. Features `GET /api/session/restore` to restore the active dataset, KPIs, and charts on page refresh without re-uploading.
- **Sub-10ms Analytical Vectorization**: Executes analytical aggregations and group-bys directly on vectorized DuckDB column stores.

### 2. Smart Data Sanitizer (Auto-Cleaning ETL Pipeline) (`backend/sanitizer.py`)
- **Automated Header Detection**: Detects and trims metadata titles and leading empty rows from messy corporate Excel spreadsheets.
- **SQL-Safe Column Normalization**: Converts messy column headers to snake_case (`"Total Revenue ($)"` ➔ `total_revenue`), strips forbidden characters, and preserves clean mapping for display.
- **Smart Type Coercion**: Detects string currencies (`"$1,250.00"`, `"10,500 сум"`, `"45%"`) and dates, auto-coercing them to `DOUBLE`, `INTEGER`, and `DATE` so DuckDB analytical functions (`SUM()`, `AVG()`) run without type errors.
- **Data Health Scoring**: Calculates an automated data quality score and produces an interactive ETL cleaning report.

### 3. Autonomous Self-Healing SQL Agent Loop (`backend/ai_analyst.py`)
- **Multi-Attempt Retry Loop (`max_retries = 3`)**: Automatically catches DuckDB execution errors (`Binder Error`, `Parser Error`, unquoted identifiers, or missing columns) and feeds exact error telemetry back to Gemini or the schema healer for instant autonomous repair.
- **Detailed Reasoning Trace & Telemetry**: Every analytical response includes structured trace steps (`info`, `warning`, `error`, `healed`, `success`) rendering the entire diagnosis and repair lifecycle.
- **Thesis Defense Simulation Chip**: Features a dedicated `🧪 Test Self-Healing` chip that simulates an intentional column binder error being caught by DuckDB and automatically repaired live.

### 4. Executive AI Intelligence Report & CSV Export Suite (`/frontend`)
- **One-Click Executive Report Modal (`📥 Export AI Report`)**: C-suite/McKinsey-grade presentation modal with KPI summary cards, embedded Recharts visualization, verified DuckDB SQL runtime telemetry, and top 15 rows lineage.
- **Pristine PDF Printing**: Built-in `@media print` CSS engine allowing clean browser printing (`window.print()`) directly to PDF without sidebar/chat clutter.
- **Markdown Export**: Instant `📋 Copy Markdown Summary` button copying an executive briefing to clipboard.
- **Client-Side CSV Export (`⬇️ Download CSV`)**: Export the active query result table directly to a local `.csv` file from the Data Preview tab.

### 5. Deep Conversational Memory & Persistent Chat Storage (`backend/database.py` & `ai_analyst.py`)
- **100-Message Rolling Context Window**: Automatically persists both user questions and AI responses in DuckDB's `chat_history` table with schema-isolated session IDs, enforcing a clean 100-message rolling window per session.
- **Context-Aware Follow-Up Resolution**: Resolves relative instructions (e.g., *"↳ Show only Top 3 from this"*, *"↳ Sort by lowest instead"*, *"↳ Break this down by region"*, *"↳ Exclude the top one"*), extending and adapting previous SQL queries while retaining existing filter constraints.
- **F5 Refresh Resilience**: `GET /api/session/restore` retrieves both data profiling and the full message history so conversations survive browser refreshes without losing context.
- **Interactive Historical Snapshot Restores (`🔄 Load on Canvas`)**: Every past AI message in the chat history features a mini-button that re-renders that past query's interactive chart, SQL code, and data table back onto the Main Canvas.
- **Memory Status Counter & Reset**: Features a live `🧠 Memory Active: X/100 msgs` badge in the chat panel with a one-click `🗑️ Clear Memory` action (`DELETE /api/chat/clear`).

### 6. Obsidian Dark Mode Design System (`/frontend`)
- **Craft & Micro-Interactions** (following Emil Kowalski & Jakub Krehel design engineering):
  - Custom Obsidian palette: `#090D16` deep space background, `#111827/80` glassmorphic cards with `backdrop-blur-md`
  - Electric Indigo (`#6366F1`) & Neon Purple (`#A855F7`) accents
  - Tactile button press feedback: `:active` state with `scale(0.97)` and custom spring easing (`cubic-bezier(0.23, 1, 0.32, 1)`)
  - Optical alignment and `tabular-nums` for rock-solid metric counters
- **3-Column Split-Screen Workspace (`h-screen overflow-hidden flex`)**:
  1. **Left Sidebar (260px)**: Custom SVG logo, file upload trigger, instant Demo dataset loader, Phase 2 Live DB modal trigger, Auto-Cleaned ETL badge, and interactive Schema Explorer Tree with original header subtitles.
  2. **Center Main Canvas (~60% width)**:
     - Empty state with glowing drag-and-drop zone and prominent demo launcher.
     - 4 Top KPI cards (with interactive Auto-Cleaned ETL trigger).
     - Interactive Recharts canvas (`BarChart`, `LineChart`, `AreaChart` with dynamic toggle).
     - Tabbed Inspector: Tab 1 (`📋 Data Preview` with pagination + CSV download) & Tab 2 (`</> Generated SQL` with execution telemetry and Self-Healed query comparison diff).
  3. **Right Panel (380px)**:
     - Segmented mode switcher: `📊 AI Data Analyst` (active) vs `🔮 AI Data Scientist` (Phase 3 preview).
     - Live Deep Conversational Memory Bar (`🧠 Memory Active: X/100 msgs` + `🗑️ Clear Memory`).
     - Chat stream with rich **"🧠 AI Reasoning Steps"** trace accordion, **`🛡️ Self-Healed SQL`** inspection cards, and **`🔄 Load on Canvas`** historical buttons.
     - Dynamic contextual follow-up prompt chips (`"↳ Show only Top 3 from this"`, `"↳ Sort by lowest instead"`, etc.).
     - Quick Prompt chips (`"What is our best-selling product?"`, `"Why did sales drop in March?"`, `"Show top 5 categories by revenue"`, and `"🧪 Test Self-Healing"`).
     - Gemini API key input modal + Smart Mock status badge.
  4. **Agentation Visual Feedback**: Integrated directly on the canvas for instant UI annotation.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, Framer Motion, Agentation |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, DuckDB (Persistent Storage), Pandas, Openpyxl, Google GenAI SDK (`google-genai`) |
| **Container & Ops** | Docker (Multi-stage build), Docker Compose, Alpine Linux & Debian Slim |
| **Design System** | Obsidian Dark Mode, Inter, JetBrains Mono, Emil Kowalski micro-interactions |

---

## 🏁 Quick Start & Running Locally

### Option A: Docker Deployment (Recommended for Production)

Launch the entire unified stack (Frontend + FastAPI Backend + Persistent DuckDB Storage) with one command:

```bash
docker compose up --build -d
```
*Application & Dashboard will be live at: [http://localhost:8000](http://localhost:8000)*
*API Swagger Documentation will be live at: [http://localhost:8000/docs](http://localhost:8000/docs)*

To stop the container:
```bash
docker compose down
```

#### Standalone Docker Run:
```bash
# 1. Build the production image
docker build -t neurodata-bi .

# 2. Run with persistent volume for DuckDB datasets
docker run -d \
  --name neurodata-bi-app \
  -p 8000:8000 \
  -e GEMINI_API_KEY="your-gemini-key-here" \
  -v neurodata_storage:/app/backend/data \
  neurodata-bi
```

---

### Option B: One-Click Launch (Windows Local Dev)
Run the root batch file:
```cmd
start_all.bat
```
Or for PowerShell:
```powershell
.\run_dev.ps1
```

---

### Option C: Manual Launch (Local Dev)

#### 1. Start the Backend
```cmd
cd backend
venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*API Swagger Documentation will be live at: [http://localhost:8000/docs](http://localhost:8000/docs)*

#### 2. Start the Frontend
```cmd
cd frontend
npm run dev
```
*Frontend Application will be live at: [http://localhost:5173](http://localhost:5173)*

---

## 🔒 Security Architecture (Strix / ECC Security Review)
1. **Zero SQL Injection / Mutation**: Enforced in `backend/database.py` via an AST/regex guard forbidding destructive verbs (`DROP`, `DELETE`, `UPDATE`, `INSERT`, `ALTER`, `ATTACH`, `COPY`, `INSTALL`, file readers). Only read-only `SELECT` / `WITH` analytical queries are permitted.
2. **File Upload Hardening**:
   - Extension whitelist: `.csv`, `.xlsx`, `.xls`
   - File size ceiling: 50MB
   - Streamed in-memory parsing with zero disk persistence
3. **Data Privacy**: Only table schema structure and 3 sample rows are shared with the LLM; no customer data or full datasets leave the sandbox.
4. **CORS Governance**: Configured to restrict allowed origins to local development hosts.
