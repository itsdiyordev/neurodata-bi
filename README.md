# NeuroData BI — AI Data Analyst & Data Scientist Platform (Phase 1 MVP)

> **Next-Generation B2B SaaS AI Analytics Platform** powered by an in-memory **DuckDB** analytical SQL engine, **Gemini 2.5 Flash** copilot, and an **Obsidian Dark Mode** reactive interface built with React, Vite, Tailwind CSS, Recharts, and Framer Motion.

---

## 🚀 Key Features

### 1. In-Memory DuckDB Analytical Engine (`/backend`)
- **Sub-10ms Analytical Vectorization**: Executes analytical aggregations and group-bys directly in an in-memory DuckDB database session.
- **Data Profiling & Auto-KPIs**: Ingests `.csv` and `.xlsx` files, extracts schema types (`VARCHAR`, `DOUBLE`, `INTEGER`, `DATE`), calculates missingness/quality health scores (e.g., `99.4%`), and computes real-time business KPIs:
  - Total Records
  - Total Revenue
  - Average Order Value (AOV)
  - Data Quality Health Score
- **Realistic 380+ Row Demo Dataset**: Pre-configured with B2B/B2C tech sales data across North America, EMEA, and APAC. Features an intentional supply chain disruption anomaly in March 2024 for immediate executive probing.

### 2. Zero Data Exposure LLM Architecture (`backend/ai_analyst.py`)
- **Schema-Only Synthesis**: Never passes raw data rows or sensitive customer PII to external LLMs. Only column names, data types, and 3 sample rows are provided to the prompt.
- **Gemini 2.5 Flash with Strict JSON Schema**: Outputs valid DuckDB SQL, chart configuration, and an executive-level business explanation.
- **Smart Deterministic Fallback Parser**: Even if `GEMINI_API_KEY` is not provided, the platform seamlessly runs DuckDB analytical queries for demo prompts and queries without failing.

### 3. Obsidian Dark Mode Design System (`/frontend`)
- **Craft & Micro-Interactions** (following Emil Kowalski & Jakub Krehel design engineering):
  - Custom Obsidian palette: `#090D16` deep space background, `#111827/80` glassmorphic cards with `backdrop-blur-md`
  - Electric Indigo (`#6366F1`) & Neon Purple (`#A855F7`) accents
  - Tactile button press feedback: `:active` state with `scale(0.97)` and custom spring easing (`cubic-bezier(0.23, 1, 0.32, 1)`)
  - Optical alignment and `tabular-nums` for rock-solid metric counters
- **3-Column Split-Screen Workspace (`h-screen overflow-hidden flex`)**:
  1. **Left Sidebar (260px)**: Custom SVG logo, file upload trigger, instant Demo dataset loader, Phase 2 Live DB modal trigger, and interactive Schema Explorer Tree.
  2. **Center Main Canvas (~60% width)**:
     - Empty state with glowing drag-and-drop zone and prominent demo launcher.
     - 4 Top KPI cards.
     - Interactive Recharts canvas (`BarChart`, `LineChart`, `AreaChart` with dynamic toggle).
     - Tabbed Inspector: Tab 1 (`📋 Data Preview` with pagination) & Tab 2 (`</> Generated SQL` with execution telemetry in ms).
  3. **Right Panel (380px)**:
     - Segmented mode switcher: `📊 AI Data Analyst` (active) vs `🔮 AI Data Scientist` (Phase 3 preview).
     - Chat stream with expandable **"🧠 AI Reasoning Steps"** accordion.
     - Quick Prompt chips (`"What is our best-selling product?"`, `"Why did sales drop in March?"`, `"Show top 5 categories by revenue"`).
     - Gemini API key input modal + Smart Mock status badge.
  4. **Agentation Visual Feedback**: Integrated directly on the canvas for instant UI annotation.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, Framer Motion, Agentation |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, DuckDB (In-Memory), Pandas, Openpyxl, Google GenAI SDK (`google-genai`) |
| **Design System** | Obsidian Dark Mode, Inter, JetBrains Mono, Emil Kowalski micro-interactions |

---

## 🏁 Quick Start & Running Locally

### Option A: One-Click Launch (Windows)
Run the root batch file:
```cmd
start_all.bat
```
Or for PowerShell:
```powershell
.\run_dev.ps1
```

### Option B: Manual Launch

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
