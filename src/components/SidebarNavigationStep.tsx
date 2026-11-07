import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Layers,
  Terminal,
  Workflow,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface SidebarNavigationStepProps {
  onCompleteStep: () => void;
  isCompleted: boolean;
}

type SectionCategory = 'Top Global' | 'SQL' | 'Data Engineering' | 'AI/ML' | 'Account Console';

interface SidebarNavItem {
  id: string;
  section: SectionCategory;
  label: string;
  snowflakeEquivalent: string;
  shortAnswer: string;
  deepDive: string;
  whyDuplicateOrNuance?: string;
}

const SECTION_META: {
  id: SectionCategory;
  stepNum: string;
  title: string;
  count: number;
  subtitle: string;
}[] = [
  {
    id: 'Top Global',
    stepNum: '01',
    title: 'Top Global',
    count: 8,
    subtitle: '+ New, Workspace, Recents, Catalog, Jobs, Compute, Discover, Marketplace'
  },
  {
    id: 'SQL',
    stepNum: '02',
    title: 'SQL',
    count: 7,
    subtitle: 'SQL Editor, Queries, Dashboards, Genie Agents, Alerts, History, Warehouses'
  },
  {
    id: 'Data Engineering',
    stepNum: '03',
    title: 'Data Engineering',
    count: 3,
    subtitle: 'Runs, Data Ingestion (Lakeflow Connect), Visual Data Prep'
  },
  {
    id: 'AI/ML',
    stepNum: '04',
    title: 'AI/ML',
    count: 7,
    subtitle: 'Playground, Agents, AI Gateway, Experiments, Features, Models, Serving'
  },
  {
    id: 'Account Console',
    stepNum: '05',
    title: 'Account Console (Admin)',
    count: 8,
    subtitle: 'Settings (App Connections / LakeTwin), Catalog (Metastores), Workspaces, Usage, Users'
  }
];

const SIDEBAR_ITEMS: SidebarNavItem[] = [
  // ================= 1. TOP GLOBAL =================
  {
    id: 'plus-new',
    section: 'Top Global',
    label: '+ New',
    snowflakeEquivalent: 'Snowsight "+ Create" Button (Worksheet, Notebook, Table, Stage)',
    shortAnswer:
      'Universal quick-action button to create a new Notebook, SQL Query, AI/BI Dashboard, Genie Space, Job, Pipeline, or upload a local CSV/Parquet file into Unity Catalog.',
    deepDive:
      'Clicking "+ New" from anywhere in Databricks gives you a single launcher menu. If you click "+ New -> Add or upload data", you can drop a CSV/JSON file and instantly create a governed Unity Catalog Managed Table or upload files into a Unity Catalog Volume.'
  },
  {
    id: 'workspace',
    section: 'Top Global',
    label: 'Workspace',
    snowflakeEquivalent: 'Snowsight Projects -> Worksheets / Notebooks / Git Folders',
    shortAnswer:
      'Your code and asset file system! Holds folders (`/Users/`, `/Shared/`), Git repositories (`Repos`), Notebooks, SQL Queries, Dashboards, and Genie spaces.',
    deepDive:
      'Remember the golden separation: **Workspace** holds your code files and visual assets (Notebooks, `.sql` files, Git folders, Dashboards), while **Catalog** holds your actual database tables, views, volumes, and models.',
    whyDuplicateOrNuance:
      'Use `/Users/developer@company.com` only as a personal scratchpad. For automated production pipelines, store your code inside `Workspace -> Repos` (Git folders) or deploy via Databricks Asset Bundles.'
  },
  {
    id: 'recents',
    section: 'Top Global',
    label: 'Recents',
    snowflakeEquivalent: 'Snowsight Recents List',
    shortAnswer:
      'Chronological jump-list of the Notebooks, SQL Queries, Tables, Dashboards, and Jobs you recently opened or edited.',
    deepDive:
      'Also accessible anytime via the keyboard shortcut `Cmd + P` (Mac) or `Ctrl + P` (Windows) in the top global search bar to jump between SQL queries and Unity Catalog tables in under a second.'
  },
  {
    id: 'catalog',
    section: 'Top Global',
    label: 'Catalog (Unity Catalog)',
    snowflakeEquivalent: 'Snowsight Data -> Databases (Database.Schema.Table)',
    shortAnswer:
      'Your central data & governance explorer (`catalog.schema.table`). Browse all Catalogs, Schemas, Tables, Views, Volumes (`@Stages`), Functions, and AI Models (`system.ai`).',
    deepDive:
      'In Catalog Explorer, you can inspect table schemas, preview sample rows, view automated **column-level lineage graphs** (showing which Notebooks, Dashboards, and Workflows read/write that table), set RBAC grants, and configure External Locations / Connections.'
  },
  {
    id: 'jobs-pipelines',
    section: 'Top Global',
    label: 'Jobs & Pipelines (Workflows)',
    snowflakeEquivalent: 'Snowflake Tasks (`CREATE TASK` DAGs) + Dynamic Tables',
    shortAnswer:
      'Your central orchestration engine! Create and schedule multi-task DAGs (`Jobs`) that run SQL files, dbt projects, Notebooks, or declarative Delta Live Tables (`Pipelines`).',
    deepDive:
      'In Snowflake, you chain `CREATE TASK` statements or use an external Airflow server. In Databricks, `Jobs & Pipelines` gives you a complete built-in orchestrator with cron schedules, file-arrival triggers, table-update triggers, retries, and Slack/PagerDuty alerts.',
    whyDuplicateOrNuance:
      'Notice how `Jobs & Pipelines` (under Top Global) and `Data Engineering -> Runs` work together: `Jobs & Pipelines` is where you define your workflows and pipelines, while `Runs` shows the historical execution timeline of every triggered run.'
  },
  {
    id: 'compute',
    section: 'Top Global',
    label: 'Compute',
    snowflakeEquivalent: 'Snowsight Admin -> Warehouses & Compute Pools',
    shortAnswer:
      'Central infrastructure hub with 5 tabs: `Serverless`, `SQL warehouses`, `AI Search` (Vector endpoints), `Apps` (container hosting), and `Lakebase` (OLTP Postgres).',
    deepDive:
      'Where you configure T-shirt sizes (`2X-Small` to `4X-Large`) for Serverless SQL Warehouses, inspect Vector Search serving endpoints, manage hosted Streamlit/React Databricks Apps, and launch Lakebase Postgres instances.'
  },
  {
    id: 'discover',
    section: 'Top Global',
    label: 'Discover',
    snowflakeEquivalent: 'Snowflake Horizon Internal Data Catalog / Universal Search',
    shortAnswer:
      'NOT external apps published by others! Discover is your internal data & AI discovery hub for searching curated tables, dashboards, Genie spaces, and certified assets inside YOUR organization.',
    deepDive:
      'Think of Discover as an internal data portal for your company. When your data team marks Unity Catalog tables, metric views, or dashboards as "Certified" or "Popular", business users and analysts go to Discover to browse domains (e.g., Finance, Sales), check data quality tags, and find trusted internal datasets.',
    whyDuplicateOrNuance:
      'Easy to confuse with Marketplace! "Discover" = internal company data discovery (governed by Unity Catalog). "Marketplace" = external 3rd-party vendor data & solution sharing.'
  },
  {
    id: 'marketplace',
    section: 'Top Global',
    label: 'Marketplace',
    snowflakeEquivalent: 'Snowflake Marketplace (Data Sharing & Native Apps)',
    shortAnswer:
      'Marketplace is for external 3rd-party datasets, pre-built AI models, and solution notebooks shared via Delta Sharing (NOT where you configure SaaS ingestion connectors—that lives under "Data Ingestion"!).',
    deepDive:
      'Just like Snowflake Marketplace lets you mount external datasets (weather, financial market ticks, demographics) into your account with zero copying, Databricks Marketplace uses the open Delta Sharing protocol to mount external providers\' datasets, pre-trained models, and accelerator notebooks directly into your Unity Catalog.',
    whyDuplicateOrNuance:
      'If you are looking for database/SaaS connectors (like Salesforce, Workday, SQL Server, S3, or Kafka connections), go to "Data Engineering -> Data Ingestion" (Lakeflow Connect) or "Catalog -> External Data -> Connections".'
  },

  // ================= 2. SQL =================
  {
    id: 'sql-editor',
    section: 'SQL',
    label: 'SQL Editor',
    snowflakeEquivalent: 'Snowsight SQL Worksheets',
    shortAnswer:
      'Your primary multi-tab SQL IDE with autocomplete, AI assistant, schema browser, execution plan profiler, and inline chart builder.',
    deepDive:
      'Unlike Notebooks (which mix Python/SQL/Markdown and attach to either Spark clusters or SQL Warehouses), the SQL Editor is purpose-built for pure SQL analysts and analytics engineers running queries on Serverless SQL Warehouses.'
  },
  {
    id: 'queries',
    section: 'SQL',
    label: 'Queries',
    snowflakeEquivalent: 'Snowsight Saved Worksheets & Shared SQL Queries',
    shortAnswer:
      'Library of saved, parameterized SQL queries that can be shared with teammates, attached to Alerts, or scheduled.',
    deepDive:
      'Every query you save in the SQL Editor appears here so you can version it, add `{{ parameter }}` dropdown widgets, or reuse it across dashboards and alerts.'
  },
  {
    id: 'dashboards',
    section: 'SQL',
    label: 'Dashboards (AI/BI Dashboards)',
    snowflakeEquivalent: 'Snowsight Dashboards',
    shortAnswer:
      'Low-code/no-code interactive BI dashboards powered by Serverless SQL Warehouses and AI assistant prompts.',
    deepDive:
      'Allows you to build filterable visual reports directly on top of Unity Catalog tables and publish them to business stakeholders without needing external Tableau/PowerBI licenses.'
  },
  {
    id: 'genie-agents',
    section: 'SQL',
    label: 'Genie Agents (AI/BI Genie)',
    snowflakeEquivalent: 'Snowflake Cortex Analyst',
    shortAnswer:
      'Domain-specific "Talk to Your Data" BI agents that you customize for specific business departments (e.g., a "Finance Revenue Genie" vs "Supply Chain Genie"), NOT for orchestrating ETL jobs!',
    deepDive:
      'Notice there are TWO "Agent" items in the sidebar: "Genie Agents" under SQL, and "Agents" under AI/ML! A **Genie Agent** is a specialized text-to-SQL analyst room: you pick 5–15 trusted Unity Catalog tables, write plain-English business rules (e.g. "Fiscal year starts Feb 1; churn excludes trial accounts"), and provide verified sample SQL queries so executives can ask questions in Slack/Teams or the UI.',
    whyDuplicateOrNuance:
      'Genie Agents (under SQL) = Business Intelligence / Natural Language to SQL over structured tables. Agents (under AI/ML) = Custom LLM Agents (Mosaic AI Agent Framework) that call Python tools, Vector Search, and external APIs.'
  },
  {
    id: 'alerts',
    section: 'SQL',
    label: 'Alerts',
    snowflakeEquivalent: 'Snowflake Alerts (`CREATE ALERT ... IF (EXISTS ...)`)',
    shortAnswer:
      'Yes! Runs a saved SQL query on a schedule (e.g. every 15 mins) and sends Slack, PagerDuty, Teams, Webhook, or Email notifications when a threshold condition is met.',
    deepDive:
      'For example, you write a query `SELECT COUNT(*) AS failed_rows FROM gold.orders WHERE amount < 0`, set the Alert rule to `failed_rows > 0`, and Databricks automatically notifies your Slack channel.'
  },
  {
    id: 'query-history',
    section: 'SQL',
    label: 'Query History',
    snowflakeEquivalent: 'Snowsight Monitoring -> Query History',
    shortAnswer:
      'Yes! Real-time log of every SQL statement executed across all SQL Warehouses, including execution duration, bytes scanned, Photon spill metrics, and visual Query Profile DAGs.',
    deepDive:
      'If a dashboard or dbt model is slow, click any query here to open the visual Query Profile—it looks almost identical to Snowflake\'s Query Profile tree, showing pruning efficiency, broadcast joins, and cache hits.'
  },
  {
    id: 'sql-warehouses-shortcut',
    section: 'SQL',
    label: 'SQL Warehouses',
    snowflakeEquivalent: 'Snowsight Admin -> Warehouses',
    shortAnswer:
      'Good eye! Yes—this is the EXACT SAME page as `Compute -> SQL warehouses`! It is simply a shortcut placed in the SQL section so SQL analysts don\'t have to leave the SQL menu.',
    deepDive:
      'Historically, Databricks had a separate persona switcher ("Data Science & Engineering" vs "SQL" vs "Machine Learning"). When Databricks unified everything into one single left sidebar, they kept `SQL Warehouses` under the `SQL` header as a direct deep-link to the `SQL warehouses` tab inside `Compute`.'
  },

  // ================= 3. DATA ENGINEERING =================
  {
    id: 'runs',
    section: 'Data Engineering',
    label: 'Runs',
    snowflakeEquivalent: 'Snowsight Monitoring -> Task History & Dynamic Tables Refresh History',
    shortAnswer:
      'Live and historical execution monitor for every scheduled Workflow Job, task run, and Delta Live Tables pipeline across your workspace.',
    deepDive:
      'Shows a timeline matrix of succeeded, running, and failed pipeline runs, execution duration, cluster/warehouse compute cost, and one-click links to error logs or task retries.'
  },
  {
    id: 'data-ingestion',
    section: 'Data Engineering',
    label: 'Data Ingestion (Lakeflow Connect)',
    snowflakeEquivalent: 'Snowflake Openflow / Native Connectors (Salesforce, Workday, SQL Server) + Snowpipe',
    shortAnswer:
      'THIS is where you configure point-and-click data connections to SaaS apps (Salesforce, Workday, ServiceNow, Google Analytics), databases (Postgres, SQL Server, MySQL), or upload files!',
    deepDive:
      'You asked earlier if Marketplace was for data connections—actually, **Data Ingestion** under Data Engineering is where built-in managed ingestion connectors live (powered by Lakeflow Connect / Arcion), while **Marketplace** is for 3rd-party external datasets.'
  },
  {
    id: 'visual-data-prep',
    section: 'Data Engineering',
    label: 'Visual Data Prep',
    snowflakeEquivalent: 'Low-code GUI ETL Builder (similar to Alteryx / Matillion on Snowflake)',
    shortAnswer:
      'Drag-and-drop visual transformation canvas for building joins, filters, aggregations, and clean-up pipelines that compile down to native Spark / Delta Live Tables code.',
    deepDive:
      'Useful when business analysts want to visually build a pipeline step-by-step and then inspect or export the generated SQL/PySpark definition.'
  },

  // ================= 4. AI/ML =================
  {
    id: 'playground',
    section: 'AI/ML',
    label: 'Playground',
    snowflakeEquivalent: 'Snowflake Cortex Playground',
    shortAnswer:
      'Interactive chat sandbox (like Google AI Studio / ChatGPT) where you pick any foundation model from `system.ai`, compare models side-by-side, and test tool-calling.',
    deepDive:
      'You can attach Unity Catalog SQL functions or Vector Search indexes right inside the Playground chat window to test how an LLM answers questions using your tables, then click "Export Code" to turn it into a production Agent!'
  },
  {
    id: 'agents',
    section: 'AI/ML',
    label: 'Agents (Mosaic AI Agent Framework)',
    snowflakeEquivalent: 'Snowflake Cortex Agents (combining Cortex Search + Cortex Analyst)',
    shortAnswer:
      'Build, evaluate, and deploy custom multi-step GenAI agents (like a custom Gemini Agent) that combine unstructured PDFs (Vector Search), structured SQL tables (Genie), and Python/API tools.',
    deepDive:
      'Unlike `SQL -> Genie Agents` (which is strictly no-code text-to-SQL over structured tables), `AI/ML -> Agents` is for building full RAG + tool-calling assistants with built-in LLM Judge evaluation to score accuracy and prevent hallucinations.'
  },
  {
    id: 'ai-gateway',
    section: 'AI/ML',
    label: 'AI Gateway',
    snowflakeEquivalent: 'Cortex Guardrails & Token Usage Governance',
    shortAnswer:
      'Centralized governance proxy for all LLM calls (internal `system.ai` models + external OpenAI / Anthropic / Gemini APIs) with rate limits, PII masking, safety guardrails, and payload logging.',
    deepDive:
      'Every prompt and completion flowing through an AI Gateway endpoint can be automatically logged into a Unity Catalog Delta table so you can audit token usage by user/department and enforce PII/toxicity filters.'
  },
  {
    id: 'experiments',
    section: 'AI/ML',
    label: 'Experiments (MLflow)',
    snowflakeEquivalent: 'Snowflake Experiment Tracking',
    shortAnswer:
      'Tracks every machine learning training run, hyperparameter, evaluation metric, and LLM trace (powered by MLflow).',
    deepDive:
      'When data scientists train classical ML models (XGBoost, PyTorch) or evaluate GenAI agents, `Experiments` records accuracy curves, latency traces, and model artifacts.'
  },
  {
    id: 'features',
    section: 'AI/ML',
    label: 'Features (Feature Store)',
    snowflakeEquivalent: 'Snowflake Feature Store',
    shortAnswer:
      'The **engineered features stay here**! `AI/ML -> Features` is NOT an IDE where you write code—you write your feature engineering SQL/PySpark in Notebooks, SQL Editor, or dbt, and `Features` is the **Feature Store catalog** where those engineered feature tables live, are versioned, and get synced to online serving!',
    deepDive:
      'Here is the exact secret: In Unity Catalog, **any regular Delta table with a Primary Key constraint (`PRIMARY KEY (customer_id)`) automatically appears inside `AI/ML -> Features`!** This tab lets you see which ML models depend on which feature columns, track lineage, and click "Publish to Online Store / Lakebase" so real-time models can look up a customer\'s features in <10ms.',
    whyDuplicateOrNuance:
      'Where do you engineer them? In SQL/PySpark/dbt. Where do they stay & get governed? Right here in `AI/ML -> Features` (and `Catalog`)!'
  },
  {
    id: 'models',
    section: 'AI/ML',
    label: 'Models (Unity Catalog Model Registry)',
    snowflakeEquivalent: 'Snowflake Model Registry (`SHOW MODELS`)',
    shortAnswer:
      'Close! `AI/ML -> Models` is the **Model Registry** (the catalog of stored model files/weights & versions—identical to `Catalog -> system.ai.Models`). To connect to a model as a live API/SQL endpoint, it must be deployed to **`AI/ML -> Serving`** right below it!',
    deepDive:
      'Think of `Models` as the "warehouse shelf" holding the model artifacts (both the 110 foundation LLMs in `system.ai` and any custom XGBoost/PyTorch models your team trains). When you click on a model inside `AI/ML -> Models` and click the **"Serve this model"** button, Databricks spins up a live endpoint in `AI/ML -> Serving`.',
    whyDuplicateOrNuance:
      'Golden Rule: `AI/ML -> Models` = Stored Model Artifacts (Registry). `AI/ML -> Serving` = Live HTTPS REST & `ai_query()` Endpoints!'
  },
  {
    id: 'serving',
    section: 'AI/ML',
    label: 'Serving (Model Serving Endpoints)',
    snowflakeEquivalent: 'Snowpark Container Services (SPCS) Model Serving Endpoints & Cortex REST API',
    shortAnswer:
      'YES—THIS is where your live, connectable LLM & ML endpoints live! Every endpoint in `AI/ML -> Serving` gives you an HTTPS REST URL (OpenAI SDK compatible!) and an endpoint name you can call in SQL via `ai_query(\'endpoint-name\', prompt)`.',
    deepDive:
      'In `AI/ML -> Serving`, you will find 3 kinds of live endpoints you can connect to immediately:\n1. **Built-in Foundation Model Endpoints** (`databricks-kimi-k3`, `databricks-meta-llama-3-3-70b-instruct`, `databricks-claude-3-7-sonnet`) — already running 24/7 (Pay-per-token).\n2. **Custom Deployed Models** — any model from `AI/ML -> Models` where you clicked "Serve this model".\n3. **External Model Endpoints** — secure proxies to your company\'s OpenAI, Anthropic, or Google Gemini API keys governed in one place!'
  },

  // ================= 5. ACCOUNT CONSOLE (ADMIN) =================
  {
    id: 'acct-settings-app-connections',
    section: 'Account Console',
    label: 'Settings -> App connections (LakeTwin)',
    snowflakeEquivalent: 'Snowflake Security Integrations (`CREATE SECURITY INTEGRATION ... TYPE = OAUTH`)',
    shortAnswer:
      'YES—with an important architectural distinction! `Settings -> App connections` ( specifically the **"Custom apps"** tab right next to "Published apps") is where you register your **LakeTwin** app as an **OAuth 2.0 Client** if you want users in LakeTwin to log in with their own Databricks credentials (User-to-Machine SSO) so LakeTwin can query Unity Catalog Data & Model Serving endpoints on their behalf!',
    deepDive:
      'There are **TWO ways** to connect your external **LakeTwin** application to serve Data (Delta Tables / Lakebase) and Models (`AI/ML -> Serving`) from Databricks:\n\n1. **Way 1: `Settings -> App connections -> Custom apps` (User-to-Machine / U2M OAuth — shown in your screenshot):**\n   • **Published apps** lists pre-registered 1st/3rd-party tools (Tableau, Power Platform, Slack, JDBC/ODBC).\n   • Clicking the **"Custom apps"** tab lets you click **"Add connection"**, enter your LakeTwin redirect URL (e.g. `https://laketwin.company.com/oauth/callback`), choose scopes (`sql` for querying data + `all-apis` for invoking ML/LLM endpoints), and generate an OAuth `Client ID`. Every user who logs into LakeTwin is authenticated with their exact Unity Catalog row/column permissions!\n\n2. **Way 2: `User management -> Service principals` (Machine-to-Machine / M2M OAuth — best for automated backend apps):**\n   • If LakeTwin has its own backend server that should fetch data and call ML models automatically *without* prompting every human user to sign into Databricks, go to `User management -> Service principals -> Add service principal -> Generate OAuth secret`.\n   • Grant that Service Principal `SELECT` on your catalog and `EXECUTE` on your models, and your LakeTwin backend calls Databricks directly!',
    whyDuplicateOrNuance:
      'Once authenticated (via Custom App OAuth or Service Principal), how does LakeTwin actually fetch Data and Models? 1) **For Data:** LakeTwin calls your **SQL Warehouse** (via `/api/2.0/sql/statements` REST API, Node/Python SQL SDK, or Lakebase Postgres wire protocol). 2) **For Models/Agents:** LakeTwin calls your **`AI/ML -> Serving`** HTTPS endpoint (`POST /serving-endpoints/<your-model>/invocations`)!'
  },
  {
    id: 'acct-catalog-metastores',
    section: 'Account Console',
    label: 'Catalog (Metastores)',
    snowflakeEquivalent: 'Snowflake ORGADMIN / Account-Level Region Governance',
    shortAnswer:
      'In the Account Console (`accounts.cloud.databricks.com`), `Catalog` shows your **Unity Catalog Metastore** (`metastore_aws_us_east_2`)—the top-level regional container that sits ABOVE all your catalogs, schemas, tables, and models.',
    deepDive:
      'Here is the 2-level governance distinction:\n1. **Account Console -> Catalog (`Metastores`):** You only touch this once during initial cloud setup! A **Metastore** (like `metastore_aws_us_east_2` in `us-east-2`) is the top-level regional Unity Catalog container that you attach to your Dev, Staging, and Prod workspaces so they can all share the same data and governance rules.\n2. **Workspace -> Catalog (`Catalog Explorer`):** Once `metastore_aws_us_east_2` is attached to your workspace, you do **99% of your daily governance** (creating catalogs/schemas/tables, `GRANT SELECT`, row filters, column masks, and viewing lineage) inside your **Workspace\'s `Catalog`** tab—not here in the Account Console!',
    whyDuplicateOrNuance:
      'Why does `metastore_aws_us_east_2` already exist? Because Databricks automatically creates one Unity Catalog Metastore per cloud region (`us-east-2`) for you! You almost never need to click "Create metastore" unless you deploy a new workspace in a completely different AWS region (e.g. `eu-west-1`).'
  },
  {
    id: 'acct-workspaces',
    section: 'Account Console',
    label: 'Workspaces',
    snowflakeEquivalent: 'Snowflake Organization -> Accounts List (`SHOW ORGANIZATION ACCOUNTS`)',
    shortAnswer:
      'Lists all Databricks Workspaces across your organization (e.g., `dev-workspace`, `staging-workspace`, `prod-workspace`) and lets you click "Open workspace" to jump back into your normal engineering UI.',
    deepDive:
      'In Snowflake, an Organization has multiple Accounts (or one Account with `DEV`/`PROD` databases). In Databricks, an Account has one or more **Workspaces** that all share the same regional Unity Catalog Metastore (`metastore_aws_us_east_2`).'
  },
  {
    id: 'acct-usage',
    section: 'Account Console',
    label: 'Usage',
    snowflakeEquivalent: 'Snowsight Admin -> Cost Management & Credit Usage',
    shortAnswer:
      'Account-wide billing and DBU (Databricks Unit) consumption dashboard across all workspaces, SQL Warehouses, Serverless jobs, and Model Serving endpoints.',
    deepDive:
      'Note: You can also query granular billing and usage logs directly using SQL inside your workspace via the built-in table `system.billing.usage` (exact equivalent of `SNOWFLAKE.ACCOUNT_USAGE.METERING_HISTORY`).'
  },
  {
    id: 'acct-user-management',
    section: 'Account Console',
    label: 'User management (Users & Service Principals)',
    snowflakeEquivalent: 'Snowsight Admin -> Users, Roles & Service Accounts',
    shortAnswer:
      'Central identity directory for Users, Groups, and **Service Principals** across your entire Databricks account (synced via Okta, Microsoft Entra ID / Azure AD, or Google Workspace).',
    deepDive:
      'If your **LakeTwin** app needs a backend service account (`CLIENT_ID` + `CLIENT_SECRET`) to query Databricks tables and call Model Serving endpoints automatically, you create a **Service Principal** right here under `User management -> Service principals`!'
  },
  {
    id: 'acct-security',
    section: 'Account Console',
    label: 'Security',
    snowflakeEquivalent: 'Snowsight Admin -> Security (Network Policies, SSO, PrivateLink)',
    shortAnswer:
      'Configure Single Sign-On (SSO), Multi-Factor Authentication (MFA), IP Access Lists, and customer-managed encryption keys.',
    deepDive:
      'Account-level security policies enforced across all workspaces.'
  },
  {
    id: 'acct-cloud-resources',
    section: 'Account Console',
    label: 'Cloud resources',
    snowflakeEquivalent: 'Snowflake Storage Integrations & VPC / PrivateLink Config',
    shortAnswer:
      'Manages AWS IAM Cross-Account Roles, VPC network configurations, and storage credentials linking Databricks to your cloud account.',
    deepDive:
      'Used by cloud platform administrators when provisioning new workspaces or custom VPC networking.'
  },
  {
    id: 'acct-previews-settings',
    section: 'Account Console',
    label: 'Previews',
    snowflakeEquivalent: 'Snowflake Behavior Change Bundles (`SYSTEM$ENABLE_BEHAVIOR_CHANGE_BUNDLE`)',
    shortAnswer:
      'Toggle Public/Private Preview features (like Genie One, Predictive Optimization, or new AI functions) across your account or workspaces.',
    deepDive:
      'Allows administrators to opt into new Databricks capabilities early.'
  }
];

export const SidebarNavigationStep: React.FC<SidebarNavigationStepProps> = ({
  onCompleteStep,
  isCompleted
}) => {
  // Level 1: Top-level Sidebar Section selection
  const [selectedSection, setSelectedSection] = useState<SectionCategory>('Account Console');
  // Level 2: Lowest-level Sub-Menu Item selection
  const [selectedItemId, setSelectedItemId] = useState<string>('acct-settings-app-connections');

  // Filter Level 2 items strictly by the selected Level 1 section
  const currentSectionItems = SIDEBAR_ITEMS.filter(item => item.section === selectedSection);

  // Ensure selectedItemId always belongs to the active section
  const activeItem =
    currentSectionItems.find(item => item.id === selectedItemId) || currentSectionItems[0];

  const handleSelectSection = (sec: SectionCategory) => {
    setSelectedSection(sec);
    const firstItemInSec = SIDEBAR_ITEMS.find(item => item.section === sec);
    if (firstItemInSec) {
      setSelectedItemId(firstItemInSec.id);
    }
  };

  return (
    <div className="space-y-8">
      {/* Module Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="text-xs font-medium text-slate-500 mb-1">
              <span>Step 07 of 08</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Interactive 3-Level Drill-Down Explorer</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Workspace Sidebar + Account Console (Admin)</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Left Sidebar &amp; Account Console Explorer: Section &rarr; Sub-Menu &rarr; Deep-Dive
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
              {isCompleted ? 'Step 7 Completed — Next: Mastery Check' : 'Mark Step 7 Complete & Continue'}
            </button>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600 leading-relaxed max-w-4xl">
          Use the **3-level progressive drill-down** below: **First**, select one of the 5 sidebar headers (`Top Global`, `SQL`, `Data Engineering`, `AI/ML`, or `Account Console (Admin)`). **Second**, click any sub-menu item inside that section to reveal its full explanation and Snowflake equivalent immediately beside it.
        </p>
      </div>

      {/* Main 3-Level Progressive Drill-Down Explorer */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        {/* LEVEL 1: Select Main Sidebar Header */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Level 1: Select Main Sidebar Section Header
            </div>
            <div className="text-xs font-mono text-slate-500">
              Active Path: <strong className="text-slate-900">{selectedSection}</strong> &rarr;{' '}
              <strong className="text-sky-700">{activeItem.label}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {SECTION_META.map(sec => {
              const isSelected = sec.id === selectedSection;
              return (
                <button
                  key={sec.id}
                  onClick={() => handleSelectSection(sec.id)}
                  className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={`font-mono font-bold ${isSelected ? 'text-sky-300' : 'text-slate-500'}`}>
                        HEADER {sec.stepNum}
                      </span>
                      <span className={`font-mono text-[11px] ${isSelected ? 'text-amber-300' : 'text-slate-500'}`}>
                        {sec.count} items
                      </span>
                    </div>
                    <div className="text-base font-bold">{sec.title}</div>
                  </div>
                  <div className={`text-xs mt-2 line-clamp-2 leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {sec.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* LEVEL 2 & LEVEL 3 SPLIT: Sub-Menu List on Left + Live Detail Inspector Right Beside It */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-200 items-stretch">
          {/* LEVEL 2: Sub-Menu Items for the Selected Header (4 cols) */}
          <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="pb-3 mb-3 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono font-bold text-slate-500 uppercase">
                    Level 2: Sub-Menu Items
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                    Inside "{selectedSection}" ({currentSectionItems.length})
                  </h3>
                </div>
              </div>

              <div className="space-y-1.5">
                {currentSectionItems.map(item => {
                  const isItemSelected = item.id === activeItem.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isItemSelected
                          ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-xs'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400 font-medium'
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      <ChevronRight
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isItemSelected ? 'text-sky-400 translate-x-0.5' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500">
              Click any item above to view its full explanation on the right &rarr;
            </div>
          </div>

          {/* LEVEL 3: Immediate Detail Inspector Panel (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900 text-white rounded-xl p-6 flex flex-col justify-between">
            <div className="space-y-5">
              {/* Breadcrumb & Snowflake Equivalent */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="text-xs font-mono text-sky-400 flex items-center gap-1.5">
                    <span>Level 3 Details:</span>
                    <span>{activeItem.section}</span>
                    <span>&rarr;</span>
                    <span className="text-white font-semibold">{activeItem.label}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-1">{activeItem.label}</h3>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 shrink-0">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">
                    Snowflake Equivalent
                  </div>
                  <div className="text-xs font-mono font-bold text-amber-300 mt-0.5">
                    {activeItem.snowflakeEquivalent}
                  </div>
                </div>
              </div>

              {/* Direct Summary */}
              <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-4">
                <div className="text-xs font-bold text-sky-300 mb-1.5">
                  What It Is &amp; Direct Answer
                </div>
                <p className="text-sm text-white leading-relaxed font-medium">
                  {activeItem.shortAnswer}
                </p>
              </div>

              {/* Deep Dive */}
              <div>
                <div className="text-xs font-bold text-slate-300 mb-1.5">
                  How It Works in Practice
                </div>
                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                  {activeItem.deepDive}
                </p>
              </div>

              {/* Nuance / Shortcut Callout */}
              {activeItem.whyDuplicateOrNuance && (
                <div className="bg-amber-950/90 border border-amber-700 rounded-xl p-4 text-xs text-amber-100 leading-relaxed">
                  <strong className="font-bold text-amber-300 block mb-1">
                    Important Distinction / Shortcut Note:
                  </strong>
                  {activeItem.whyDuplicateOrNuance}
                </div>
              )}
            </div>

            {/* Quick Next Item Button inside Current Section */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>
                Viewing item{' '}
                {currentSectionItems.findIndex(i => i.id === activeItem.id) + 1} of{' '}
                {currentSectionItems.length} in <strong>{selectedSection}</strong>
              </span>
              <button
                onClick={() => {
                  const idx = currentSectionItems.findIndex(i => i.id === activeItem.id);
                  const nextItem = currentSectionItems[(idx + 1) % currentSectionItems.length];
                  setSelectedItemId(nextItem.id);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Next Item in {selectedSection}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: "Is the Home Page 'Ask anything / Genie One' box the same as AI/ML Agents?" */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="pb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">
            2. Decoding the 4 "Chat &amp; Agent" Experiences in Databricks (Including Your Home Page!)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Look closely at the <strong>"Welcome to Databricks — Ask anything... (Ask | Search | Code | Try Genie One)"</strong> box on your Home Page: it is actually <strong>NOT</strong> the same as <code className="font-mono">AI/ML &rarr; Agents</code>! Click any of the 4 cards below to jump directly to its sidebar item in the explorer above:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          {/* Card 1: Home Page "Ask anything / Genie One / Assistant" */}
          <div
            onClick={() => {
              setSelectedSection('Top Global');
              setSelectedItemId('discover');
            }}
            className="border-2 border-purple-300 hover:border-purple-500 rounded-xl p-5 bg-purple-50/40 flex flex-col justify-between cursor-pointer transition-all"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-mono font-bold text-purple-900 mb-1">
                <span>1. Home Page: "Ask anything..." &amp; Genie One</span>
                <span className="bg-purple-200/80 text-purple-950 px-2 py-0.5 rounded text-[10px]">
                  Home Page Omnibox
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">
                Workspace-Wide AI Omnibox (Genie One + Databricks Assistant)
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
                <li>
                  • <strong>"Ask" / Try Genie One:</strong> A <em>workspace-wide</em> super-Genie! Automatically routes your question across <em>all</em> tables and Genie spaces you have permission to see in Unity Catalog.
                </li>
                <li>
                  • <strong>"Search":</strong> Semantic search to find tables, notebooks, dashboards, and files across your workspace.
                </li>
                <li>
                  • <strong>"Code" (Databricks Assistant):</strong> Your built-in coding copilot that writes/fixes SQL queries and Python code for you.
                </li>
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-purple-200 text-[11px] font-mono text-purple-950">
              Snowflake Equivalent: Snowflake Copilot + Universal Search + Cortex Intelligence
            </div>
          </div>

          {/* Card 2: SQL -> Genie Agents */}
          <div
            onClick={() => {
              setSelectedSection('SQL');
              setSelectedItemId('genie-agents');
            }}
            className="border border-sky-200 hover:border-sky-400 rounded-xl p-5 bg-sky-50/40 flex flex-col justify-between cursor-pointer transition-all"
          >
            <div>
              <div className="text-xs font-mono font-bold text-sky-800 mb-1">
                2. Sidebar: SQL &rarr; Genie Agents
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">
                Domain-Specific "Chat with Curated SQL Tables" Rooms
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600 leading-relaxed">
                <li>
                  • Under <code className="font-mono">SQL &rarr; Genie Agents</code>, you create <strong>curated, department-specific rooms</strong> (e.g., <em>"Bakehouse Sales Starter Space"</em> or <em>"Q4 Finance Revenue Genie"</em>) pinned to 5–15 specific tables and custom business definitions.
                </li>
                <li>
                  • <strong>Genie One</strong> on the Home Page is the "umbrella" router on top—it can answer from all your tables OR hand off your question to one of these specialized <code className="font-mono">SQL &rarr; Genie Agents</code>!
                </li>
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-sky-200/70 text-[11px] font-mono text-sky-900">
              Snowflake Equivalent: Snowflake Cortex Analyst (Semantic Model Spaces)
            </div>
          </div>

          {/* Card 3: AI/ML -> Agents */}
          <div
            onClick={() => {
              setSelectedSection('AI/ML');
              setSelectedItemId('agents');
            }}
            className="border border-orange-200 hover:border-orange-400 rounded-xl p-5 bg-orange-50/40 flex flex-col justify-between cursor-pointer transition-all"
          >
            <div>
              <div className="text-xs font-mono font-bold text-orange-800 mb-1">
                3. Sidebar: AI/ML &rarr; Agents
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">
                Developer Studio for Building Custom AI Agents (Mosaic AI)
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600 leading-relaxed">
                <li>
                  • The Home Page is a <strong>built-in assistant for YOU</strong> to ask questions about your workspace.
                </li>
                <li>
                  • <code className="font-mono">AI/ML &rarr; Agents</code> is an <strong>engineering builder platform</strong> where you build, evaluate, and deploy <strong>your own custom AI bots</strong> (combining PDFs in Vector Search + SQL functions + external APIs) to serve to your customers or internal apps!
                </li>
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-orange-200/70 text-[11px] font-mono text-orange-950">
              Snowflake Equivalent: Cortex Agents (Cortex Search + Analyst REST API)
            </div>
          </div>

          {/* Card 4: AI/ML -> Playground */}
          <div
            onClick={() => {
              setSelectedSection('AI/ML');
              setSelectedItemId('playground');
            }}
            className="border border-slate-200 hover:border-slate-400 rounded-xl p-5 bg-slate-50 flex flex-col justify-between cursor-pointer transition-all"
          >
            <div>
              <div className="text-xs font-mono font-bold text-slate-600 mb-1">
                4. Sidebar: AI/ML &rarr; Playground
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">
                Raw LLM Chat &amp; Prompt Comparison Sandbox
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600 leading-relaxed">
                <li>
                  • Pick any raw model from <code className="font-mono">system.ai</code> (<code className="font-mono">databricks-kimi-k3</code>, <code className="font-mono">Llama 3.3 70B</code>, <code className="font-mono">Claude</code>, <code className="font-mono">Gemma</code>) and test prompts side-by-side.
                </li>
                <li>
                  • Once you find the best model and prompt in Playground, you export it to <code className="font-mono">AI/ML &rarr; Agents</code> or call it in SQL via <code className="font-mono">ai_query()</code>.
                </li>
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] font-mono text-sky-900">
              Snowflake Equivalent: Cortex Playground
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: How Features, Experiments, Models, Serving & Agents Fit Together (5-Stage Assembly Line) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="pb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">
            3. How <code className="font-mono">Features</code>, <code className="font-mono">Experiments</code>, <code className="font-mono">Models</code>, <code className="font-mono">Serving</code>, and <code className="font-mono">Agents</code> Fit Together (5-Step Assembly Line)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Click any stage in this <strong>5-step AI/ML assembly line</strong> to inspect that exact item in the drill-down explorer above:
          </p>
        </div>

        {/* 5-Step Assembly Line */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-5">
          {/* Stage 1: Features */}
          <button
            onClick={() => {
              setSelectedSection('AI/ML');
              setSelectedItemId('features');
              window.scrollTo({ top: 180, behavior: 'smooth' });
            }}
            className="text-left border-2 border-indigo-300 hover:border-indigo-500 rounded-xl p-4 bg-indigo-50/30 flex flex-col justify-between cursor-pointer transition-all"
          >
            <div>
              <div className="text-xs font-mono font-bold text-indigo-900 mb-1">
                Stage 1: AI/ML &rarr; Features
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">
                Where Engineered Features Stay (Feature Store)
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed mb-2.5">
                <strong>Not a coding IDE—it's the catalog where engineered features live!</strong>
              </p>
              <ul className="space-y-1 text-xs text-slate-600 leading-relaxed">
                <li>• Engineer features in SQL/dbt/PySpark (<code className="font-mono">rolling_30d_spend</code>).</li>
                <li>• Any Delta table with a <strong>Primary Key</strong> registers here automatically!</li>
              </ul>
            </div>
            <div className="mt-3 pt-2.5 border-t border-indigo-200 text-[11px] font-mono text-indigo-950">
              Output: Governed Feature Table (PK-indexed)
            </div>
          </button>

          {/* Stage 2: Experiments */}
          <button
            onClick={() => {
              setSelectedSection('AI/ML');
              setSelectedItemId('experiments');
              window.scrollTo({ top: 180, behavior: 'smooth' });
            }}
            className="text-left border border-slate-200 hover:border-slate-400 rounded-xl p-4 bg-slate-50 flex flex-col justify-between cursor-pointer transition-all"
          >
            <div>
              <div className="text-xs font-mono font-bold text-purple-800 mb-1">
                Stage 2: AI/ML &rarr; Experiments
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">
                The "Lab Notebook" &amp; AutoML Training Tracker
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed mb-2.5">
                <strong>Pulls features from <code className="font-mono">Features</code> and tests 20+ algorithms.</strong>
              </p>
              <ul className="space-y-1 text-xs text-slate-600 leading-relaxed">
                <li>• Click <strong>"Create AutoML Experiment &rarr; Forecasting"</strong> (zero code!).</li>
                <li>• Scores every trial run (MAPE, RMSE) in a leaderboard.</li>
              </ul>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200 text-[11px] font-mono text-slate-600">
              Output: 20 trial runs &rarr; Pick #1 winner
            </div>
          </button>

          {/* Stage 3: Models */}
          <button
            onClick={() => {
              setSelectedSection('AI/ML');
              setSelectedItemId('models');
              window.scrollTo({ top: 180, behavior: 'smooth' });
            }}
            className="text-left border border-slate-200 hover:border-slate-400 rounded-xl p-4 bg-slate-50 flex flex-col justify-between cursor-pointer transition-all"
          >
            <div>
              <div className="text-xs font-mono font-bold text-sky-800 mb-1">
                Stage 3: AI/ML &rarr; Models
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">
                The Model Registry ("The Warehouse Shelf")
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed mb-2.5">
                <strong>Click "Register Model" on the winning Experiment.</strong>
              </p>
              <ul className="space-y-1 text-xs text-slate-600 leading-relaxed">
                <li>• Saves the model artifact in Unity Catalog as <code className="font-mono">prod.ml.revenue_forecaster</code> (v1).</li>
                <li>• Remembers which <code className="font-mono">Features</code> table trained it!</li>
              </ul>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200 text-[11px] font-mono text-sky-900">
              Output: Versioned model in Unity Catalog
            </div>
          </button>

          {/* Stage 4: Serving */}
          <button
            onClick={() => {
              setSelectedSection('AI/ML');
              setSelectedItemId('serving');
              window.scrollTo({ top: 180, behavior: 'smooth' });
            }}
            className="text-left border-2 border-emerald-300 hover:border-emerald-500 rounded-xl p-4 bg-emerald-50/30 flex flex-col justify-between cursor-pointer transition-all"
          >
            <div>
              <div className="text-xs font-mono font-bold text-emerald-900 mb-1">
                Stage 4: AI/ML &rarr; Serving
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">
                The Live API &amp; SQL Endpoint!
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed mb-2.5">
                <strong>Click "Serve this model" inside <code className="font-mono">Models</code> to launch here!</strong>
              </p>
              <ul className="space-y-1 text-xs text-slate-600 leading-relaxed">
                <li>• Foundation LLMs (<code className="font-mono">databricks-kimi-k3</code>) already run here 24/7.</li>
                <li>• Call via REST or SQL <code className="font-mono">ai_query()</code>!</li>
              </ul>
            </div>
            <div className="mt-3 pt-2.5 border-t border-emerald-200 text-[11px] font-mono text-emerald-950">
              Output: Live HTTPS URL &amp; SQL ai_query()
            </div>
          </button>

          {/* Stage 5: Agents */}
          <button
            onClick={() => {
              setSelectedSection('AI/ML');
              setSelectedItemId('agents');
              window.scrollTo({ top: 180, behavior: 'smooth' });
            }}
            className="text-left border border-orange-200 hover:border-orange-400 rounded-xl p-4 bg-orange-50/40 flex flex-col justify-between cursor-pointer transition-all"
          >
            <div>
              <div className="text-xs font-mono font-bold text-orange-800 mb-1">
                Stage 5: AI/ML &rarr; Agents
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">
                The "Brain" That Calls Your Model
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed mb-2.5">
                <strong>Connects an LLM Endpoint (brain) + your Forecasting Endpoint (Tool).</strong>
              </p>
              <ul className="space-y-1 text-xs text-slate-600 leading-relaxed">
                <li>• User asks <em>"What will Q4 revenue be?"</em> &rarr; Agent calls your Forecasting endpoint and explains the result!</li>
              </ul>
            </div>
            <div className="mt-3 pt-2.5 border-t border-orange-200 text-[11px] font-mono text-orange-950">
              Output: Conversational Agent + ML!
            </div>
          </button>
        </div>

        {/* Why Data Engineers Don't Need to Be MLOps / GPU / DevOps Engineers */}
        <div className="mt-5 bg-slate-900 text-white rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-800">
            <div>
              <div className="text-xs font-mono font-bold text-emerald-400 uppercase">
                Zero MLOps &middot; Zero GPU Provisioning &middot; Zero Kubernetes DevOps
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5">
                Why a Data Engineer Can Run This Entire AI/ML Stack Without an MLOps or DevOps Team
              </h4>
            </div>
            <span className="text-[11px] font-mono text-amber-300 shrink-0">
              100% Built-In &amp; Serverless
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
            <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-3.5">
              <div className="font-mono font-bold text-sky-300 mb-1">
                1. No MLflow Server Setup
              </div>
              <p className="text-slate-300 leading-relaxed">
                You never deploy a Postgres backend or S3 artifact bucket for MLflow. Every notebook and AutoML run logs metrics, parameters, and code into <code className="font-mono text-white">AI/ML &rarr; Experiments</code> automatically.
              </p>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-3.5">
              <div className="font-mono font-bold text-purple-300 mb-1">
                2. No CUDA / GPU Driver Hell
              </div>
              <p className="text-slate-300 leading-relaxed">
                With <strong>Serverless GPU Compute</strong> and <strong>Databricks Runtime ML</strong>, PyTorch, XGBoost, LightGBM, Prophet, and CUDA drivers are pre-installed and auto-scaled—zero EC2 or NVIDIA driver setup.
              </p>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-3.5">
              <div className="font-mono font-bold text-amber-300 mb-1">
                3. Glass-Box AutoML Writes the Code
              </div>
              <p className="text-slate-300 leading-relaxed">
                You don't even have to write PyTorch/Scikit-Learn from scratch! Point <code className="font-mono text-white">Experiments &rarr; AutoML</code> at a Delta table, and Databricks generates the editable Python training notebooks for every trial.
              </p>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-3.5">
              <div className="font-mono font-bold text-emerald-300 mb-1">
                4. No Docker / Kubernetes for Serving
              </div>
              <p className="text-slate-300 leading-relaxed">
                Clicking <strong>"Serve this model"</strong> inside <code className="font-mono text-white">Models</code> containerizes your model, scales it to zero when idle, and exposes both a REST URL and SQL <code className="font-mono text-white">ai_query()</code> function in one click.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Account Console Deep Dive — Serving Data & Models to LakeTwin + Unity Catalog Governance */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="pb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">
            4. Serving Data &amp; Models to Your "LakeTwin" App (<code className="font-mono">Settings &rarr; App connections</code>) &amp; Unity Catalog Governance
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            In your last two screenshots, you are inside the <strong>Databricks Account Console</strong> (<code className="font-mono">accounts.cloud.databricks.com</code>). Here is exactly how <code className="font-mono">Settings &rarr; App connections</code> connects your <strong>LakeTwin</strong> app to Databricks data &amp; models, and how <code className="font-mono">Catalog (Metastores)</code> governs everything:
          </p>
        </div>

        {/* Part A: Connecting LakeTwin to Serve Data & Models */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card 1: Auth Method 1 — Settings -> App connections -> Custom apps */}
          <div
            onClick={() => {
              setSelectedSection('Account Console');
              setSelectedItemId('acct-settings-app-connections');
              window.scrollTo({ top: 180, behavior: 'smooth' });
            }}
            className="border-2 border-sky-300 hover:border-sky-500 rounded-xl p-5 bg-sky-50/30 flex flex-col justify-between cursor-pointer transition-all"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-mono font-bold text-sky-900 mb-1">
                <span>Option A: Settings &rarr; App connections &rarr; "Custom apps"</span>
                <span className="text-[10px] bg-sky-200/80 text-sky-950 px-2 py-0.5 rounded">
                  User Sign-In (U2M OAuth)
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">
                When Human Users Sign Into LakeTwin With Their Databricks Identity
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
                <li>
                  • <strong>"Published apps" tab</strong> (shown in your screenshot) lists built-in 1st/3rd-party tools (Tableau, Power Platform, Slack, JDBC/ODBC).
                </li>
                <li>
                  • Click the <strong>"Custom apps" tab</strong> right next to it &rarr; click <strong>"Add connection"</strong> &rarr; register <strong>LakeTwin</strong> with your OAuth Redirect URL (e.g. <code className="font-mono">https://laketwin.example.com/callback</code>) and scopes (<code className="font-mono">sql</code> + <code className="font-mono">all-apis</code>).
                </li>
                <li>
                  • <strong>Why use this?</strong> Each user logging into LakeTwin gets an OAuth token that strictly enforces <em>their personal Unity Catalog row filters and column masks</em> when querying data or calling models!
                </li>
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-sky-200 text-[11px] font-mono text-sky-950">
              Auth Type: OAuth 2.0 User-to-Machine (U2M) Client ID
            </div>
          </div>

          {/* Card 2: Auth Method 2 — User management -> Service principals */}
          <div
            onClick={() => {
              setSelectedSection('Account Console');
              setSelectedItemId('acct-user-management');
              window.scrollTo({ top: 180, behavior: 'smooth' });
            }}
            className="border-2 border-emerald-300 hover:border-emerald-500 rounded-xl p-5 bg-emerald-50/30 flex flex-col justify-between cursor-pointer transition-all"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-900 mb-1">
                <span>Option B: User management &rarr; "Service principals"</span>
                <span className="text-[10px] bg-emerald-200/80 text-emerald-950 px-2 py-0.5 rounded">
                  Backend-to-Backend (M2M OAuth)
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">
                When Your LakeTwin Backend Server Queries Data &amp; Models Automatically
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
                <li>
                  • Most external apps (like <strong>LakeTwin</strong>) have their own login system and need a <strong>headless backend credential</strong> to fetch Databricks tables and run ML predictions 24/7.
                </li>
                <li>
                  • Go to <strong>Account Console &rarr; User management &rarr; Service principals &rarr; Add service principal</strong> (e.g. <code className="font-mono">sp-laketwin-prod</code>) &rarr; generate an <strong>OAuth Client ID &amp; Secret</strong>.
                </li>
                <li>
                  • Then run <code className="font-mono">GRANT SELECT ON CATALOG prod TO `sp-laketwin-prod`</code> and <code className="font-mono">GRANT EXECUTE ON FUNCTION ...</code>!
                </li>
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-200 text-[11px] font-mono text-emerald-950">
              Auth Type: OAuth 2.0 Machine-to-Machine (M2M) Service Principal
            </div>
          </div>
        </div>

        {/* Part B: The Exact Endpoints LakeTwin Calls for Data + Models + Governance */}
        <div className="bg-slate-900 text-white rounded-xl p-5">
          <div className="text-xs font-mono font-bold text-sky-400 uppercase mb-3">
            End-to-End Architecture: How LakeTwin Consumes Your Governed Data &amp; Models
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-4">
              <div className="font-mono font-bold text-amber-300 mb-1">
                1. Governance Layer (Unity Catalog)
              </div>
              <p className="text-slate-300 leading-relaxed">
                • <strong>Account Console &rarr; Catalog (<code className="font-mono">metastore_aws_us_east_2</code>):</strong> Your regional root container shared across workspaces.<br />
                • <strong>Workspace &rarr; Catalog Explorer:</strong> Where you do daily governance (<code className="font-mono">GRANT SELECT</code>, Row Filters, Column Masks, Lineage) on tables &amp; models.
              </p>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-4">
              <div className="font-mono font-bold text-sky-300 mb-1">
                2. Serving DATA to LakeTwin
              </div>
              <p className="text-slate-300 leading-relaxed">
                • <strong>Analytical SQL Queries:</strong> LakeTwin connects to your <strong>SQL Warehouse</strong> via the Databricks SQL SDK / Statement Execution REST API (<code className="font-mono">POST /api/2.0/sql/statements</code>).<br />
                • <strong>Low-Latency App State (&lt;10ms):</strong> Sync Delta tables to <strong>Compute &rarr; Lakebase Postgres</strong> and connect via standard Postgres driver!
              </p>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-4">
              <div className="font-mono font-bold text-emerald-300 mb-1">
                3. Serving MODELS &amp; AGENTS to LakeTwin
              </div>
              <p className="text-slate-300 leading-relaxed">
                • Deploy your forecasting model or GenAI Agent to <strong>Workspace &rarr; AI/ML &rarr; Serving</strong>.<br />
                • LakeTwin calls the live HTTPS REST endpoint:<br />
                <code className="font-mono text-[11px] text-emerald-200">
                  POST https://&lt;workspace-url&gt;/serving-endpoints/&lt;model-name&gt;/invocations
                </code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
