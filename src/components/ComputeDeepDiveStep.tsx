import React, { useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  Database,
  Search,
  AppWindow,
  Server,
  Zap,
  ArrowRight,
  Copy,
  Check,
  Terminal
} from 'lucide-react';

interface ComputeDeepDiveStepProps {
  onCompleteStep: () => void;
  isCompleted: boolean;
}

type ComputeTabId = 'lakebase' | 'ai-search' | 'apps' | 'sql-warehouses' | 'serverless';

interface ComputeTabExplain {
  id: ComputeTabId;
  tabLabel: string;
  tagline: string;
  snowflakeEquivalent: string;
  whatItActuallyIs: string;
  whyIsItInCompute: string;
  mentalTrapToAvoid: string;
  codeTitle: string;
  codeSnippet: string;
}

const COMPUTE_TABS: ComputeTabExplain[] = [
  {
    id: 'lakebase',
    tabLabel: 'Lakebase (Lakebase Postgres)',
    tagline: 'Serverless OLTP Postgres Engine Built on the Lakehouse (<10ms Point Reads/Writes)',
    snowflakeEquivalent: 'Snowflake Unistore / Hybrid Tables + Snowflake Postgres',
    whatItActuallyIs:
      'Correction to a super common misconception: Your analytical warehouse data is ALREADY stored in regular Delta Lake tables (`Catalog`). **Lakebase** is NOT your analytical warehouse! Lakebase (powered by the Neon serverless Postgres architecture) is a **transactional OLTP PostgreSQL database** integrated directly with Unity Catalog.',
    whyIsItInCompute:
      'Like Neon, Lakebase separates Postgres compute endpoints from storage. It lives in the Compute menu (and is moving to the top-right app switcher as "Lakebase Postgres") because you provision & auto-scale **Postgres OLTP compute instances** that serve low-latency (<10ms) row-by-row reads/writes for web apps and AI agents, while syncing bidirectionally with your Delta Lake tables.',
    mentalTrapToAvoid:
      'Do NOT put your normal analytical star schemas or BI tables in Lakebase! Keep all analytical/warehouse data in standard Unity Catalog Delta tables (queried via SQL Warehouses). Use Lakebase ONLY when building an interactive web app, CRM, or AI agent that needs sub-10ms Postgres transactions (`INSERT/UPDATE` single rows, foreign keys, pgvector) synced with Delta Lake.',
    codeTitle: 'Synced Table: Expose a Unity Catalog Delta Table to Low-Latency Lakebase Postgres',
    codeSnippet: `-- 1. Your analytical data lives in standard Delta Lake (OLAP):
CREATE TABLE prod.gold.customer_360 (
  customer_id STRING,
  lifetime_value DECIMAL(18,2),
  churn_risk_score DOUBLE
) CLUSTER BY (customer_id);

-- 2. Sync it to a Lakebase Postgres instance for <10ms app lookups (OLTP)
-- Or connect your React/FastAPI app directly via standard Postgres connection string:
-- postgresql://user:token@ep-lakebase-prod.databricks.com:5432/app_db`
  },
  {
    id: 'ai-search',
    tabLabel: 'AI Search (Vector Search Endpoints)',
    tagline: 'Dedicated Low-Latency Vector Index Serving Nodes for RAG & Semantic Search',
    snowflakeEquivalent: 'Snowflake Cortex Search Service',
    whatItActuallyIs:
      'In Databricks, when you want to do semantic search or RAG over millions of documents/rows, you create a **Vector Search Index** on top of a Delta table in Unity Catalog. **AI Search** in the Compute tab is the **Vector Search Endpoint**—the always-on, low-latency serving infrastructure that hosts those vector indexes in memory/NVMe.',
    whyIsItInCompute:
      'Analytical SQL Warehouses are built for scanning gigabytes in seconds, whereas an AI chatbot or search bar needs vector similarity lookups in **20–50 milliseconds** at thousands of queries per second (QPS). Therefore, Databricks provisions a dedicated **AI Search Endpoint** (compute node) that automatically scales up as you add more Vector Indexes or higher QPS traffic.',
    mentalTrapToAvoid:
      'Remember the split: The **Vector Index** itself is a data object inside **Catalog** (right next to your tables), while the **AI Search Endpoint** that serves queries against that index is a compute resource here in **Compute > AI Search**.',
    codeTitle: 'Querying an AI Search Vector Index directly from SQL',
    codeSnippet: `-- Query your AI Search index in <50ms directly from SQL:
SELECT
  doc_id,
  title,
  chunk_text,
  search_score
FROM VECTOR_SEARCH(
  index => 'prod.kb.support_docs_vector_idx', -- Hosted on an AI Search Compute Endpoint!
  query => 'How do I configure SSO with Okta?',
  num_results => 5
);`
  },
  {
    id: 'apps',
    tabLabel: 'Apps (Databricks Apps)',
    tagline: 'Serverless Container Hosting for Streamlit, Gradio, Dash, React + FastAPI',
    snowflakeEquivalent: 'Streamlit in Snowflake (SiS) + Snowpark Container Services (SPCS)',
    whatItActuallyIs:
      'Yes—when you build an internal data or AI application on Databricks (using **Streamlit, Dash, Gradio, Flask, FastAPI, or React + Node**), **Databricks Apps** hosts and runs that web application serverlessly inside your workspace with automatic SSO authentication and Unity Catalog permissions.',
    whyIsItInCompute:
      'Every running web app needs a lightweight container runtime (CPU/RAM) to serve HTTP requests and render the UI. Under `Compute > Apps`, you can see all deployed web apps, start/stop their container runtime, inspect logs, and access their `*.databricksapps.com` URLs.',
    mentalTrapToAvoid:
      'Notice how **Apps + Lakebase + AI Search** form a complete stack: You host the frontend UI in **Apps**, store user clicks/state in **Lakebase Postgres**, run semantic retrieval on **AI Search**, and run heavy analytics on **SQL Warehouses**!',
    codeTitle: 'app.yaml — Deploying a FastAPI / Streamlit / React App to Databricks Apps',
    codeSnippet: `# app.yaml inside your project folder
command: ["streamlit", "run", "app.py"]
env:
  - name: "DATABRICKS_WAREHOUSE_ID"
    valueFrom: "sql_warehouse"
  - name: "LAKEBASE_HOST"
    value: "ep-lakebase-prod.databricks.com"`
  },
  {
    id: 'sql-warehouses',
    tabLabel: 'SQL Warehouses',
    tagline: 'Photon-Accelerated MPP SQL Compute for BI, SQL Editor & dbt',
    snowflakeEquivalent: 'Snowflake Virtual Warehouses (XS to 6XL)',
    whatItActuallyIs:
      'Your primary analytical compute engine! Every time you run a query in the SQL Editor, refresh a Dashboard, or run `dbt build`, it executes on a SQL Warehouse.',
    whyIsItInCompute:
      'Just like `Admin > Warehouses` in Snowsight, this is where you configure T-shirt size (`2X-Small` to `4X-Large`), auto-stop timeout, and multi-cluster scaling bounds.',
    mentalTrapToAvoid:
      'Always enable **Serverless** SQL Warehouses—they wake up in ~2 seconds and eliminate VM boot wait times.',
    codeTitle: 'Creating or Resizing a Serverless SQL Warehouse',
    codeSnippet: `-- In SQL or Terraform, SQL Warehouses map 1-to-1 with Snowflake Virtual Warehouses:
-- T-shirt sizes: 2X-Small, X-Small, Small, Medium, Large, X-Large, 2X-Large...
SELECT current_warehouse();`
  },
  {
    id: 'serverless',
    tabLabel: 'Serverless (Notebooks, Jobs & Pipelines)',
    tagline: 'Instant Elastic Compute for Python Notebooks, Workflows & Delta Live Tables',
    snowflakeEquivalent: 'Snowflake Serverless Tasks / Snowpark Optimized Warehouses',
    whatItActuallyIs:
      'Historically, running a Python Notebook or Spark Job required manually configuring AWS/Azure/GCP VM instances, Spark versions, and autoscaling rules. With **Serverless Compute**, Databricks manages the pool automatically—your Python/SQL notebooks attach in seconds with zero cluster configuration.',
    whyIsItInCompute:
      'Gives you visibility into active serverless notebook sessions, serverless job runs, and budget policies.',
    mentalTrapToAvoid:
      'You rarely need to manually create classic "All-Purpose Clusters" anymore unless you need custom OS drivers or specific GPU instance types.',
    codeTitle: 'Attaching a Notebook to Serverless Compute',
    codeSnippet: `# In any Databricks Notebook top-right dropdown:
# Select "Serverless" -> Instant attach in 2 seconds!
df = spark.read.table("prod.gold.customer_360")
display(df)`
  }
];

export const ComputeDeepDiveStep: React.FC<ComputeDeepDiveStepProps> = ({
  onCompleteStep,
  isCompleted
}) => {
  const [selectedTabId, setSelectedTabId] = useState<ComputeTabId>('lakebase');
  const [copied, setCopied] = useState<boolean>(false);

  const activeTab = COMPUTE_TABS.find(t => t.id === selectedTabId) || COMPUTE_TABS[0];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-8">
      {/* Module Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="text-xs font-medium text-slate-500 mb-1">
              <span>Step 06 of 08</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Your Compute Screenshot Explained</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Serverless · SQL Warehouses · AI Search · Apps · Lakebase</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Inside the <code className="font-mono text-xl bg-slate-100 px-2 py-0.5 rounded">Compute</code> Menu: Lakebase, AI Search & Apps
            </h2>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onCompleteStep}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer ${
                isCompleted
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isCompleted ? 'Step 6 Completed — Next: Sidebar Map' : 'Mark Step 6 Complete & Continue'}
            </button>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600 leading-relaxed max-w-4xl">
          You noticed the 5 tabs across the top of your **Compute** screen: **`Serverless`**, **`SQL warehouses`**, **`AI Search`**, **`Apps`**, and **`Lakebase`**. While `Serverless` and `SQL warehouses` are obvious, the other three (`Lakebase`, `AI Search`, and `Apps`) represent a huge architectural shift—let's clear up the exact difference between **Lakehouse (Delta Lake)** and **Lakebase (Postgres)**, and why **AI Search** lives inside Compute!
        </p>
      </div>

      {/* Section 1: Screenshot + Interactive 5-Tab Compute Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Your Compute Screenshot & Quick Summary (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 mb-1">Your Uploaded Compute View</div>
            <h3 className="text-base font-bold text-slate-900 mb-3">
              The 5 Compute Engines of Modern Databricks
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-950 p-2">
              <img
                src="/assets/aistudio/Screenshot_2026-11-06_at_10.09.51_PM_f16da5c7.png"
                alt="Databricks Compute menu showing Serverless, SQL warehouses, AI Search, Apps, and Lakebase tabs"
                referrerPolicy="no-referrer"
                className="w-full object-contain rounded-lg mx-auto"
              />
            </div>

            <div className="mt-4 space-y-2.5">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs">
                <div className="font-bold text-amber-950">
                  Wait—Is "Lakebase" where my warehouse data is stored?
                </div>
                <p className="text-amber-900 mt-1 leading-relaxed">
                  <strong>No!</strong> That is the #1 naming trap:
                  <br />• <strong>Lakehouse (Delta Lake in `Catalog`)</strong> = Your analytical data warehouse tables (OLAP), queried by <strong>SQL Warehouses</strong>.
                  <br />• <strong>Lakebase (`Lakebase Postgres`)</strong> = Databricks' built-in <strong>OLTP PostgreSQL database</strong> (like Snowflake Unistore / Hybrid Tables) for sub-10ms point reads/writes when building transactional web apps or AI agents!
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-slate-900 text-slate-100 rounded-xl p-4 text-xs">
            <div className="font-bold text-sky-300 mb-1">
              Why the screenshot says "Lakebase has a new home":
            </div>
            <p className="text-slate-300 leading-relaxed">
              Databricks acquired <strong>Neon</strong> (the serverless Postgres company) to build Lakebase. Because Lakebase is a full OLTP Postgres platform (with branches, tables, and compute endpoints), Databricks moved it to the top-right 9-dots App Switcher icon under <strong>Lakebase Postgres</strong>!
            </p>
          </div>
        </div>

        {/* Right: Interactive 5-Tab Compute Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                1. Click Each of the 5 Compute Tabs to Inspect What It Does
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Replicating the exact navigation bar from your screenshot (`Serverless | SQL warehouses | AI Search | Apps | Lakebase`):
              </p>

              {/* Simulated Compute Top Tab Bar */}
              <div className="flex flex-wrap items-center gap-1.5 mt-4 p-1.5 bg-slate-900 rounded-xl">
                {COMPUTE_TABS.map(tab => {
                  const isSelected = tab.id === selectedTabId;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedTabId(tab.id)}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        isSelected
                          ? 'bg-sky-500 text-white shadow-xs'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {tab.id === 'lakebase'
                        ? 'Lakebase'
                        : tab.id === 'ai-search'
                        ? 'AI Search'
                        : tab.id === 'apps'
                        ? 'Apps'
                        : tab.id === 'sql-warehouses'
                        ? 'SQL warehouses'
                        : 'Serverless'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Compute Tab Deep Dive */}
            <div className="mt-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-base font-bold text-slate-900">{activeTab.tabLabel}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{activeTab.tagline}</p>
                </div>
                <span className="text-xs font-mono font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-md shrink-0">
                  Snowflake: {activeTab.snowflakeEquivalent}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="text-xs font-bold text-slate-900 mb-1">What It Actually Is</div>
                  <p className="text-xs text-slate-700 leading-relaxed">{activeTab.whatItActuallyIs}</p>
                </div>

                <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-4">
                  <div className="text-xs font-bold text-sky-950 mb-1">
                    Why Is It Under the "Compute" Menu?
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{activeTab.whyIsItInCompute}</p>
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950">
                <strong className="font-bold">Key Architectural Rule for Snowflake Engineers: </strong>
                {activeTab.mentalTrapToAvoid}
              </div>

              {/* Code Snippet */}
              <div className="bg-slate-900 rounded-xl p-4">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <span className="text-xs font-mono text-orange-300 font-semibold">
                    {activeTab.codeTitle}
                  </span>
                  <button
                    onClick={() => handleCopy(activeTab.codeSnippet)}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="text-xs font-mono text-slate-100 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                  {activeTab.codeSnippet}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Side-by-Side Comparison: Lakehouse (SQL Warehouse) vs Lakebase (Postgres) vs AI Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          2. Clearing Up the Confusion: SQL Warehouse vs Lakebase vs AI Search
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Why does Databricks have three different data serving engines under Compute? Because each serves a completely different latency and query pattern:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                <th className="py-3 px-4">Dimension</th>
                <th className="py-3 px-4 text-sky-800">1. SQL Warehouses (Lakehouse OLAP)</th>
                <th className="py-3 px-4 text-orange-800">2. Lakebase (Serverless Postgres OLTP)</th>
                <th className="py-3 px-4 text-emerald-800">3. AI Search (Vector Search Endpoints)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              <tr className="hover:bg-slate-50/80">
                <td className="py-3 px-4 font-bold text-slate-900">Primary Workload</td>
                <td className="py-3 px-4">Analytical queries, BI dashboards, dbt transformations, aggregations over millions/billions of rows</td>
                <td className="py-3 px-4">Transactional web app state, single-row lookups/updates, AI agent memory, operational CRUD</td>
                <td className="py-3 px-4">Real-time semantic similarity search & RAG retrieval over text/image embeddings</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-3 px-4 font-bold text-slate-900">Target Query Latency</td>
                <td className="py-3 px-4 font-mono">500 ms – 30+ seconds (high throughput)</td>
                <td className="py-3 px-4 font-mono">&lt; 10 milliseconds (high QPS point lookups)</td>
                <td className="py-3 px-4 font-mono">20 – 50 milliseconds (ANN vector k-NN search)</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-3 px-4 font-bold text-slate-900">Underlying Storage</td>
                <td className="py-3 px-4">Columnar <strong>Delta Lake (Parquet)</strong> in cloud object storage</td>
                <td className="py-3 px-4">Row-oriented <strong>Postgres pages</strong> (Neon architecture) synced with Delta Lake</td>
                <td className="py-3 px-4">In-memory / NVMe <strong>HNSW Vector Index</strong> auto-synced from a Delta Lake table</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-3 px-4 font-bold text-slate-900">Snowflake Equivalent</td>
                <td className="py-3 px-4 font-semibold text-sky-900">Virtual Warehouses + Standard Tables</td>
                <td className="py-3 px-4 font-semibold text-sky-900">Snowflake Unistore / Hybrid Tables</td>
                <td className="py-3 px-4 font-semibold text-sky-900">Snowflake Cortex Search</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
