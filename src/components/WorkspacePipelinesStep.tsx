import React, { useState } from 'react';
import {
  CheckCircle2,
  Folder,
  FolderGit2,
  FileCode2,
  LayoutDashboard,
  Sparkles,
  Workflow,
  Terminal,
  Copy,
  Check,
  Home,
  Users,
  Share2,
  Star,
  Trash2,
  Search
} from 'lucide-react';

interface WorkspacePipelinesStepProps {
  onCompleteStep: () => void;
  isCompleted: boolean;
}

interface WorkspaceObjectMap {
  id: string;
  objectName: string;
  exampleInWorkspace: string;
  snowflakeEquivalent: string;
  whatItDoes: string;
  usedInAutomatedPipelines: string;
  badgeType: 'Scratchpad' | 'Production Ready' | 'BI & Analytics';
}

const WORKSPACE_OBJECTS: WorkspaceObjectMap[] = [
  {
    id: 'user-folder',
    objectName: 'Workspace > Users > developer@company.com',
    exampleInWorkspace: 'Personal Home Directory (/Users/developer@company.com)',
    snowflakeEquivalent: 'Snowsight Personal Worksheets & Notebooks Folder',
    whatItDoes:
      'Your private scratchpad folder for ad-hoc SQL queries, exploratory Python/SQL notebooks, draft dashboards, and Genie spaces.',
    usedInAutomatedPipelines:
      'NO — Never run production jobs out of your personal `/Users/` folder! If your account changes or you edit a scratch file, production breaks. Production pipelines belong in Git Folders (`Repos`) or Databricks Asset Bundles.',
    badgeType: 'Scratchpad'
  },
  {
    id: 'genie-space',
    objectName: 'Genie agent (AI/BI Genie Space)',
    exampleInWorkspace: 'Bakehouse Sales Starter Space (Type: Genie agent)',
    snowflakeEquivalent: 'Snowflake Cortex Analyst',
    whatItDoes:
      'A conversational natural-language-to-SQL agent grounded on specific Unity Catalog tables, business instructions, and verified SQL metrics.',
    usedInAutomatedPipelines:
      'Used by business stakeholders to ask questions in plain English ("What were top 5 regions last quarter?"); not an ETL pipeline tool.',
    badgeType: 'BI & Analytics'
  },
  {
    id: 'notebook',
    objectName: 'Notebook (SQL, Python, Scala, R)',
    exampleInWorkspace: 'Untitled Notebook (Type: Notebook)',
    snowflakeEquivalent: 'Snowsight Worksheet + Snowflake Notebook',
    whatItDoes:
      'Multi-cell interactive document where you can mix `%sql`, `%python`, and `%md` cells in the same file attached to either a Serverless SQL Warehouse or Spark cluster.',
    usedInAutomatedPipelines:
      'YES — Unlike Snowsight Worksheets (which are mostly ad-hoc), Databricks Notebooks or `.sql` files stored in Git (`Repos`) can be scheduled directly as production tasks in Databricks Workflows!',
    badgeType: 'Production Ready'
  },
  {
    id: 'dashboard',
    objectName: 'Dashboard (AI/BI Dashboard)',
    exampleInWorkspace: 'Workspace Usage Dashboard (Type: Dashboard)',
    snowflakeEquivalent: 'Snowsight Dashboards',
    whatItDoes:
      'Native visual BI dashboards powered by Serverless SQL Warehouses that can be shared with viewers across the organization without extra BI licenses.',
    usedInAutomatedPipelines:
      'Can be scheduled to refresh and email snapshots automatically on a cron schedule or as the final task of a Databricks Workflow.',
    badgeType: 'BI & Analytics'
  },
  {
    id: 'repos',
    objectName: 'Workspace > Repos (Git Folders)',
    exampleInWorkspace: 'Left Sidebar: > Repos (/Repos/prod/analytics-engineering)',
    snowflakeEquivalent: 'Snowflake Git Repository Integration',
    whatItDoes:
      'Clones a GitHub, GitLab, or Azure DevOps repository into Databricks so you can commit, branch, and pull `.sql`, `.py`, or dbt files.',
    usedInAutomatedPipelines:
      'YES — When automating production pipelines, your Workflows pull code directly from a Git Repo (or you deploy headlessly from VS Code / CI-CD without touching the UI).',
    badgeType: 'Production Ready'
  }
];

interface PipelinePattern {
  id: 'ide-dbt' | 'workflows-git' | 'declarative-dlt';
  title: string;
  subtitle: string;
  snowflakeEquivalent: string;
  doYouTouchWorkspaceUi: string;
  whenToChoose: string;
  codeSnippet: string;
  codeLanguage: string;
}

const PIPELINE_PATTERNS: PipelinePattern[] = [
  {
    id: 'ide-dbt',
    title: 'Pattern A: External IDE + dbt / Airflow (Zero Workspace UI)',
    subtitle: 'Treat Databricks purely as a remote SQL Warehouse engine',
    snowflakeEquivalent: 'dbt-snowflake + Airflow / GitHub Actions running against a Virtual Warehouse',
    doYouTouchWorkspaceUi:
      '0% UI needed. You never have to log into the Databricks Workspace folder browser.',
    whenToChoose:
      'Choose this if your team already writes SQL models in VS Code / Cursor with dbt and orchestrates via Airflow, Dagster, or GitHub Actions.',
    codeLanguage: 'profiles.yml (dbt-databricks connection)',
    codeSnippet: `# ~/.dbt/profiles.yml — Connects directly to Serverless SQL Warehouse!
my_databricks_project:
  target: prod
  outputs:
    prod:
      type: databricks
      catalog: prod_finance        # Equivalent to Snowflake database
      schema: core                 # Equivalent to Snowflake schema
      host: dbc-a1b2c3d4.cloud.databricks.com
      http_path: /sql/1.0/warehouses/99a88b77c66d   # Your Serverless SQL Warehouse
      auth_type: oauth`
  },
  {
    id: 'workflows-git',
    title: 'Pattern B: Native Databricks Workflows + Git (`Repos` / Asset Bundles)',
    subtitle: 'Schedule multi-step DAGs of SQL files, Notebooks, Python & dbt directly in Databricks',
    snowflakeEquivalent: 'Snowflake Tasks (`CREATE TASK ... AFTER parent_task`) + Git Integration',
    doYouTouchWorkspaceUi:
      'Instead of personal `/Users/` folders, point Workflows directly at your Git repository (`Repos`) or deploy via CLI (`databricks bundle deploy`).',
    whenToChoose:
      'Choose this when you want built-in orchestration, retries, alerting, and cost tracking inside Databricks without managing an external Airflow server.',
    codeLanguage: 'databricks.yml (Databricks Asset Bundle)',
    codeSnippet: `# Deploy production pipelines from Git/CLI without manual UI clicking:
resources:
  jobs:
    daily_finance_pipeline:
      name: "prod-daily-finance-etl"
      schedule:
        quartz_cron_expression: "0 0 6 * * ?"
        timezone_id: "UTC"
      git_source:
        git_url: "https://github.com/acme-corp/data-pipelines.git"
        git_provider: "gitHub"
        git_branch: "main"
      tasks:
        - task_key: "ingest_raw_orders"
          sql_task:
            warehouse_id: "99a88b77c66d"
            file:
              path: "sql/01_copy_into_orders.sql"
        - task_key: "transform_gold_ledger"
          depends_on:
            - task_key: "ingest_raw_orders"
          dbt_task:
            project_directory: "dbt_finance/"
            commands: ["dbt build --select tag:daily"]`
  },
  {
    id: 'declarative-dlt',
    title: 'Pattern C: Declarative Streaming Tables & Materialized Views',
    subtitle: 'Define target freshness in pure SQL and let the engine orchestrate incremental loads',
    snowflakeEquivalent: 'Snowflake Dynamic Tables (`TARGET_LAG = \'15 minutes\'`) + Snowpipe',
    doYouTouchWorkspaceUi:
      'No manual folder management needed. Write pure DDL in SQL Editor or dbt, and Databricks manages the underlying Delta Live Tables pipeline.',
    whenToChoose:
      'Choose this when you want continuous or scheduled Bronze -> Silver -> Gold incremental refreshes without writing MERGE / watermark boilerplate.',
    codeLanguage: 'Databricks SQL (Streaming Table & Materialized View)',
    codeSnippet: `-- 1. Bronze: Auto-ingest new files from Unity Catalog Volume (like Snowpipe)
CREATE OR REFRESH STREAMING TABLE prod_finance.bronze.raw_events
  SCHEDULE EVERY 15 MINUTES
AS SELECT * FROM STREAM read_files(
  '/Volumes/prod_finance/raw/landing_zone/events/',
  format => 'json'
);

-- 2. Gold: Declarative incremental aggregation (like Snowflake Dynamic Table)
CREATE OR REFRESH MATERIALIZED VIEW prod_finance.gold.daily_revenue
  SCHEDULE EVERY 1 HOUR
AS SELECT
  DATE_TRUNC('DAY', event_ts) AS revenue_date,
  region,
  SUM(amount) AS total_revenue
FROM prod_finance.bronze.raw_events
GROUP BY ALL;`
  }
];

export const WorkspacePipelinesStep: React.FC<WorkspacePipelinesStepProps> = ({
  onCompleteStep,
  isCompleted
}) => {
  const [selectedPatternId, setSelectedPatternId] = useState<'ide-dbt' | 'workflows-git' | 'declarative-dlt'>('ide-dbt');
  const [selectedObjectId, setSelectedObjectId] = useState<string>('user-folder');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activePattern = PIPELINE_PATTERNS.find(p => p.id === selectedPatternId) || PIPELINE_PATTERNS[0];
  const activeObject = WORKSPACE_OBJECTS.find(o => o.id === selectedObjectId) || WORKSPACE_OBJECTS[0];

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="space-y-8">
      {/* Module Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="text-xs font-medium text-slate-500 mb-1">
              <span>Step 05 of 08</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Workspace UI vs Snowsight</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Production Pipeline Automation</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Workspace vs Snowsight & How to Automate Production Pipelines
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
              {isCompleted ? 'Step 5 Completed — Next: Compute Menu' : 'Mark Step 5 Complete & Continue'}
            </button>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600 leading-relaxed max-w-4xl">
          In Databricks, the **`Workspace`** browser is the direct equivalent of **Snowsight Projects / Worksheets / Notebooks / Dashboards**—it holds your **code files and visual assets**, whereas **`Catalog`** holds your **database tables**. And when you are **automating production pipelines**, you **do not** need to manually work inside your personal `/Users/` workspace folder!
        </p>
      </div>

      {/* Section 1: Interactive Anonymized Workspace Explorer + Direct Q&A */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Interactive Anonymized Workspace UI Replica (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs font-bold text-slate-500">Interactive UI Diagram (Anonymized)</div>
                <h3 className="text-base font-bold text-slate-900">
                  Click Any Workspace Item Below to Inspect Its Role
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">Snowsight Equivalent</span>
            </div>

            {/* Clean Anonymized Replica of the Databricks Workspace Browser */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              {/* Top Search Bar Mock */}
              <div className="bg-slate-50 border-b border-slate-200 px-3.5 py-2 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span>Search data, notebooks, recents, and more...</span>
                </div>
                <span className="font-mono text-[11px] bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded">
                  dev-workspace
                </span>
              </div>

              <div className="grid grid-cols-12 min-h-[270px]">
                {/* Left Tree Sidebar */}
                <div className="col-span-4 border-r border-slate-200 bg-slate-50/60 p-2.5 text-xs space-y-1">
                  <div className="font-bold text-slate-700 px-2 py-1">Workspace</div>
                  <div className="flex items-center gap-2 px-2 py-1 text-slate-600 rounded hover:bg-slate-100">
                    <Home className="w-3.5 h-3.5" />
                    <span>Home</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 text-slate-600 rounded hover:bg-slate-100">
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Shared with me</span>
                  </div>
                  <div className="pt-1">
                    <div className="flex items-center gap-2 px-2 py-1 font-semibold text-slate-900 bg-sky-50/90 rounded">
                      <Folder className="w-3.5 h-3.5 text-sky-600" />
                      <span>Workspace</span>
                    </div>
                    <div className="pl-3 mt-1 space-y-1 border-l border-slate-200 ml-2.5">
                      <button
                        onClick={() => setSelectedObjectId('user-folder')}
                        className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-left cursor-pointer ${
                          selectedObjectId === 'user-folder'
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Users</span>
                      </button>
                      <button
                        onClick={() => setSelectedObjectId('repos')}
                        className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-left cursor-pointer ${
                          selectedObjectId === 'repos'
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <FolderGit2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span className="truncate">Repos (Git)</span>
                      </button>
                      <div className="flex items-center gap-1.5 px-2 py-1 text-slate-500">
                        <Folder className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Shared</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 text-slate-500">
                    <Star className="w-3.5 h-3.5" />
                    <span>Favorites</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 text-slate-500">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Trash</span>
                  </div>
                </div>

                {/* Right Folder Contents Table */}
                <div className="col-span-8 p-3.5 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] text-sky-700 font-medium">
                      Workspace &gt; Users &gt;
                    </div>
                    <div className="flex items-center justify-between mt-0.5 pb-2.5 border-b border-slate-200">
                      <button
                        onClick={() => setSelectedObjectId('user-folder')}
                        className="text-sm font-bold text-slate-900 hover:underline cursor-pointer"
                      >
                        developer@company.com
                      </button>
                      <span className="px-2.5 py-1 bg-sky-700 text-white text-[11px] font-semibold rounded">
                        Create ▾
                      </span>
                    </div>

                    <div className="mt-2">
                      <div className="grid grid-cols-12 text-[11px] font-bold text-slate-500 py-1.5 px-2 border-b border-slate-100">
                        <div className="col-span-7">Name</div>
                        <div className="col-span-5">Type</div>
                      </div>

                      <div className="divide-y divide-slate-100 text-xs mt-1">
                        <button
                          onClick={() => setSelectedObjectId('genie-space')}
                          className={`w-full grid grid-cols-12 items-center py-2 px-2 rounded text-left transition-colors cursor-pointer ${
                            selectedObjectId === 'genie-space'
                              ? 'bg-slate-900 text-white font-semibold'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="col-span-7 flex items-center gap-2 truncate pr-2">
                            <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                            <span className="truncate">Bakehouse Sales Starter Space</span>
                          </div>
                          <div className="col-span-5 text-[11px] opacity-80">Genie agent</div>
                        </button>

                        <button
                          onClick={() => setSelectedObjectId('notebook')}
                          className={`w-full grid grid-cols-12 items-center py-2 px-2 rounded text-left transition-colors cursor-pointer ${
                            selectedObjectId === 'notebook'
                              ? 'bg-slate-900 text-white font-semibold'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="col-span-7 flex items-center gap-2 truncate pr-2">
                            <FileCode2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                            <span className="truncate">Untitled Notebook</span>
                          </div>
                          <div className="col-span-5 text-[11px] opacity-80">Notebook</div>
                        </button>

                        <button
                          onClick={() => setSelectedObjectId('dashboard')}
                          className={`w-full grid grid-cols-12 items-center py-2 px-2 rounded text-left transition-colors cursor-pointer ${
                            selectedObjectId === 'dashboard'
                              ? 'bg-slate-900 text-white font-semibold'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="col-span-7 flex items-center gap-2 truncate pr-2">
                            <LayoutDashboard className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="truncate">Workspace Usage Dashboard</span>
                          </div>
                          <div className="col-span-5 text-[11px] opacity-80">Dashboard</div>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Click any row or sidebar folder above to inspect</span>
                    <span className="font-mono">owner: developer@company.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Object Inspector */}
          <div className="mt-4 bg-slate-900 text-slate-100 rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300">Selected: {activeObject.objectName}</span>
              <span className="font-mono text-[11px] text-sky-300">
                Snowflake: {activeObject.snowflakeEquivalent}
              </span>
            </div>
            <p className="text-slate-200 leading-relaxed">{activeObject.whatItDoes}</p>
            <div className="pt-2 border-t border-slate-800 text-emerald-300">
              <strong>Role in Automated Pipelines: </strong>
              {activeObject.usedInAutomatedPipelines}
            </div>
          </div>
        </div>

        {/* Right: Direct Answers to Your Questions (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                1. Direct Answers: Workspace vs Snowsight & Automating Pipelines
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                How the Workspace folder browser compares to Snowsight and why production pipelines don't live in `/Users/`:
              </p>
            </div>

            <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4">
              <div className="text-xs font-bold text-sky-900">
                Q1: "Is this the Snowflake version of Snowsight? Can I create documents & folders here?"
              </div>
              <p className="text-xs text-slate-700 leading-relaxed mt-1.5">
                <strong>Yes!</strong> In Databricks, the UI separates <strong>Code Assets (`Workspace`)</strong> from <strong>Data Objects (`Catalog`)</strong>:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-slate-700">
                <li>
                  • <strong>Workspace (Shown on left):</strong> Equivalent to <strong>Snowsight Projects / Worksheets / Notebooks / Dashboards</strong>. You can create nested folders, SQL queries, Python notebooks, AI/BI Dashboards, and Genie spaces here.
                </li>
                <li>
                  • <strong>Catalog:</strong> Equivalent to <strong>Snowsight Data &rarr; Databases</strong>. Holds your actual Unity Catalog tables, views, volumes, and models.
                </li>
              </ul>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
              <div className="text-xs font-bold text-emerald-900">
                Q2: "If I am automating pipelines, do I need to work from here?"
              </div>
              <p className="text-xs text-slate-700 leading-relaxed mt-1.5">
                <strong>No—you do NOT need to manually work inside `/Users/developer@company.com` to automate pipelines!</strong>
              </p>
              <p className="text-xs text-slate-700 leading-relaxed mt-1.5">
                Your personal `/Users/` folder is strictly for ad-hoc exploration and prototyping (just like personal Worksheets in Snowsight). When automating production pipelines, engineers use one of the <strong>3 headless / Git-backed patterns</strong> in Section 2 below:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-slate-700 font-medium">
                <li>1. External IDE (VS Code / Cursor) + <code className="font-mono">dbt-databricks</code> / Airflow (Zero UI)</li>
                <li>2. Native <strong>Databricks Workflows</strong> pulling directly from <strong>Git (`Repos`)</strong></li>
                <li>3. Declarative SQL (<code className="font-mono">STREAMING TABLE</code> & <code className="font-mono">MATERIALIZED VIEW</code> with <code className="font-mono">SCHEDULE</code>)</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <strong>Pro Tip:</strong> Even if you prototype a Notebook in your personal folder, always commit it to <strong>Repos (Git Folders)</strong> before scheduling it in a production Workflow.
          </div>
        </div>
      </div>

      {/* Section 2: Interactive 3 Production Pipeline Automation Patterns */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Workflow className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-bold text-slate-900">
              2. How to Automate Production Pipelines Without Working in `/Users/` Folders
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Select any of the 3 production pipeline architectures below to compare it with Snowflake and view the exact configuration or SQL syntax:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            {PIPELINE_PATTERNS.map(pat => {
              const isSelected = pat.id === selectedPatternId;
              return (
                <button
                  key={pat.id}
                  onClick={() => setSelectedPatternId(pat.id)}
                  className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-bold leading-snug">{pat.title}</div>
                  <div className={`text-[11px] mt-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {pat.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Pattern Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5">
          <div className="lg:col-span-5 space-y-3.5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-bold text-sky-800">Snowflake Equivalent</div>
              <p className="text-xs text-slate-800 font-mono mt-1">{activePattern.snowflakeEquivalent}</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-bold text-emerald-800">Do You Need the Workspace UI?</div>
              <p className="text-xs text-slate-700 leading-relaxed mt-1">{activePattern.doYouTouchWorkspaceUi}</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-bold text-slate-900">When to Choose This Pattern</div>
              <p className="text-xs text-slate-700 leading-relaxed mt-1">{activePattern.whenToChoose}</p>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-mono font-bold text-orange-300">
                    {activePattern.codeLanguage}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(activePattern.codeSnippet, activePattern.id)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === activePattern.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedId === activePattern.id ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="text-xs font-mono text-slate-100 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                {activePattern.codeSnippet}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Complete Reference Table of All Workspace Items */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          3. Complete Reference: Every Item in the Databricks Workspace Browser
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Quick lookup comparing Databricks Workspace objects to Snowsight and how each fits into automated pipelines:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                <th className="py-3 px-4">Databricks Workspace Object</th>
                <th className="py-3 px-4 text-sky-800">Snowflake / Snowsight Equivalent</th>
                <th className="py-3 px-4">Purpose & Role in Automated Pipelines</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {WORKSPACE_OBJECTS.map(obj => (
                <tr key={obj.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{obj.objectName}</div>
                    <div className="font-mono text-[11px] text-slate-500 mt-0.5">{obj.exampleInWorkspace}</div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-sky-900">{obj.snowflakeEquivalent}</td>
                  <td className="py-3.5 px-4 space-y-1">
                    <div>{obj.whatItDoes}</div>
                    <div className="text-[11px] text-slate-600">
                      <strong className="text-slate-900">Pipeline Automation:</strong> {obj.usedInAutomatedPipelines}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
