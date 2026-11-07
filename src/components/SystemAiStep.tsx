import React, { useState } from 'react';
import { CheckCircle2, Cpu, Sparkles, Copy, Check, Terminal } from 'lucide-react';

interface SystemAiStepProps {
  onCompleteStep: () => void;
  isCompleted: boolean;
}

interface ModelGroup {
  id: 'pay-per-token' | 'embeddings' | 'open-weights';
  badge: string;
  title: string;
  examplesInScreenshot: string[];
  whatTheyAre: string;
  howToRunOnData: string;
  snowflakeEquivalent: string;
  sqlExample: string;
}

const MODEL_GROUPS: ModelGroup[] = [
  {
    id: 'pay-per-token',
    badge: 'Ready to Query Immediately (Serverless)',
    title: '1. Foundation Model APIs (`databricks-*` prefixed models)',
    examplesInScreenshot: [
      'databricks-kimi-k3',
      'databricks-kimi-k3-1-pro',
      'databricks-muse-spark-1-2',
      'databricks-qwen35-122b-...',
      'databricks-meta-llama-3-3-70b-instruct'
    ],
    whatTheyAre:
      'Models starting with `databricks-...` are tied directly to live, multi-tenant Serverless GPU endpoints managed by Databricks (Pay-Per-Token). You do NOT need to spin up a GPU cluster—you can call them immediately inside a standard SQL SELECT query on your tables!',
    howToRunOnData:
      'Call `ai_query(\'endpoint-name\', prompt)` directly in Databricks SQL, or use built-in task functions like `ai_extract()`, `ai_classify()`, `ai_analyze_sentiment()`, and `ai_summarize()`.',
    snowflakeEquivalent:
      'Direct equivalent of `SNOWFLAKE.CORTEX.COMPLETE(\'llama3.1-70b\', prompt)` and Cortex SQL functions.',
    sqlExample: `-- Run an LLM directly against rows in your Delta table!
SELECT
  ticket_id,
  customer_message,
  ai_query(
    'databricks-kimi-k3',
    CONCAT('Extract root cause and urgency in 1 sentence: ', customer_message)
  ) AS llm_triage_summary
FROM prod_support.core.tickets
LIMIT 100;`
  },
  {
    id: 'embeddings',
    badge: 'Vector Search & Semantic Similarity',
    title: '2. Text Embedding Models (`gte_*` models)',
    examplesInScreenshot: [
      'gte_base_en_v1_5',
      'gte_large_en_v1_5',
      'databricks-gte-large-en',
      'databricks-bge-large-en'
    ],
    whatTheyAre:
      'These are NOT chat/text-generation LLMs. GTE (General Text Embeddings) and BGE models convert text columns into numerical float arrays (vectors like `[0.014, -0.082, ...]`) for semantic search, deduplication, and RAG pipelines.',
    howToRunOnData:
      'Pass them to `ai_query(\'databricks-gte-large-en\', text_col)` in SQL, or select them when creating a Databricks Vector Search Index on a Delta table (which auto-syncs embeddings as rows change!).',
    snowflakeEquivalent:
      'Direct equivalent of `SNOWFLAKE.CORTEX.EMBED_TEXT_1024(\'nv-embed-qa-4\', text_col)` + Cortex Search.',
    sqlExample: `-- Generate 1024-dim vector embeddings in pure SQL
SELECT
  product_id,
  product_description,
  ai_query('databricks-gte-large-en', product_description) AS embedding_vector
FROM catalog.retail.products;`
  },
  {
    id: 'open-weights',
    badge: 'Pre-Loaded Weights for Fine-Tuning / Dedicated GPU',
    title: '3. Registered Open-Weight Base & Instruct Models',
    examplesInScreenshot: [
      'dbrx_base / dbrx_instruct',
      'gemma-3-12b-it',
      'gpt-oss-120b / gpt-oss-20b',
      'llama_v3_2_1b / llama_v3_2_1b_instruct',
      'llama_v3_2_3b'
    ],
    whatTheyAre:
      'Notice these do NOT have the `databricks-` prefix. These are the actual model weights/artifacts pre-staged by Databricks inside the `system.ai` Unity Catalog volume so your team does not have to download 50GB+ files from HuggingFace.',
    howToRunOnData:
      'Click on any of these models in Catalog Explorer -> click "Serve this model" to deploy a Dedicated Provisioned Throughput endpoint, OR load `models:/system.ai.llama_v3_2_3b/1` in a Python notebook to fine-tune it on your private company data.',
    snowflakeEquivalent:
      'Equivalent to Models in the Snowflake Model Registry (`SHOW MODELS`) deployed to Snowpark Container Services (SPCS) GPU compute pools.',
    sqlExample: `-- Once you click "Serve this model" (e.g. as 'my-custom-gemma-endpoint'):
SELECT
  doc_id,
  ai_query(
    'my-custom-gemma-endpoint',
    CONCAT('Classify this contract clause: ', clause_text),
    responseFormat => 'STRUCT<clause_type: STRING, risk_level: STRING>'
  ) AS structured_json
FROM legal.contracts.clauses;`
  }
];

interface AiFunctionCompare {
  task: string;
  snowflakeCortexSql: string;
  databricksAiSql: string;
  notes: string;
}

const AI_SQL_FUNCTIONS: AiFunctionCompare[] = [
  {
    task: 'Custom Prompt / Any LLM Model (`COMPLETE` vs `ai_query`)',
    snowflakeCortexSql: `SELECT SNOWFLAKE.CORTEX.COMPLETE(
  'llama3.1-70b',
  CONCAT('Summarize: ', review_text)
) FROM reviews;`,
    databricksAiSql: `SELECT ai_query(
  'databricks-meta-llama-3-3-70b-instruct',
  CONCAT('Summarize: ', review_text)
) FROM reviews;`,
    notes: 'In both platforms, you pass the model/endpoint name as the first argument and the column expression as the second argument!'
  },
  {
    task: 'Zero-Shot Classification into Categories',
    snowflakeCortexSql: `SELECT SNOWFLAKE.CORTEX.CLASSIFY_TEXT(
  ticket_body,
  ['Billing', 'Technical Bug', 'Feature Request']
):label::STRING FROM support_tickets;`,
    databricksAiSql: `SELECT ai_classify(
  ticket_body,
  ARRAY('Billing', 'Technical Bug', 'Feature Request')
) FROM support_tickets;`,
    notes: 'Task-specific functions (`ai_classify`, `ai_extract`) automatically pick a default serverless foundation model under the hood—you do not even need to specify a model name!'
  },
  {
    task: 'Structured Entity Extraction from Free Text',
    snowflakeCortexSql: `SELECT SNOWFLAKE.CORTEX.EXTRACT_ANSWER(
  email_body,
  'What is the invoice number?'
) FROM vendor_emails;`,
    databricksAiSql: `SELECT ai_extract(
  email_body,
  ARRAY('person_name', 'company', 'invoice_number')
) AS extracted_struct FROM vendor_emails;`,
    notes: '`ai_extract` returns a clean `STRUCT<person_name: STRING, company: STRING, invoice_number: STRING>` in a single pass.'
  },
  {
    task: 'Sentiment Analysis & Summarization',
    snowflakeCortexSql: `SELECT
  SNOWFLAKE.CORTEX.SENTIMENT(comment_text),
  SNOWFLAKE.CORTEX.SUMMARIZE(comment_text)
FROM feedback;`,
    databricksAiSql: `SELECT
  ai_analyze_sentiment(comment_text),
  ai_summarize(comment_text, 50)
FROM feedback;`,
    notes: 'Databricks `ai_analyze_sentiment` returns `\'positive\'`, `\'negative\'`, `\'neutral\'`, or `\'mixed\'`.'
  },
  {
    task: 'Forecasting Time-Series Data in SQL',
    snowflakeCortexSql: `CALL SNOWFLAKE.ML.FORECAST(...);`,
    databricksAiSql: `SELECT * FROM ai_forecast(
  TABLE(daily_sales),
  horizon => '2026-12-31',
  time_col => 'sale_date',
  value_col => 'revenue'
);`,
    notes: '`ai_forecast` is a built-in table-valued function in Databricks SQL Warehouses for zero-code time-series forecasting.'
  }
];

export const SystemAiStep: React.FC<SystemAiStepProps> = ({
  onCompleteStep,
  isCompleted
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<'pay-per-token' | 'embeddings' | 'open-weights'>('pay-per-token');
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null);

  const activeGroup = MODEL_GROUPS.find(g => g.id === selectedGroupId) || MODEL_GROUPS[0];

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(id);
    setTimeout(() => setCopiedIdx(null), 1800);
  };

  return (
    <div className="space-y-8">
      {/* Module Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="text-xs font-medium text-slate-500 mb-1">
              <span>Step 04 of 08</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Catalog Explorer AI Models</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>system.ai.Models vs Snowflake Cortex</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Decoding <code className="font-mono text-xl bg-slate-100 px-2 py-0.5 rounded">system.ai</code> Models & Running LLMs on Your Data
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
              {isCompleted ? 'Step 4 Completed — Next: Workspace & Pipelines' : 'Mark Step 4 Complete & Continue'}
            </button>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600 leading-relaxed max-w-4xl">
          When you navigate to **`system` (Catalog) $\rightarrow$ `ai` (Schema) $\rightarrow$ `Models (110)`** in Catalog Explorer, you are looking at Databricks' built-in library of Foundation Models governed inside Unity Catalog. **Yes—you can run these directly against your SQL tables and data models**, just like **Snowflake Cortex (`SNOWFLAKE.CORTEX.COMPLETE`)**!
        </p>
      </div>

      {/* Visual Breakdown of Catalog Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Annotated View of Catalog Explorer (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 mb-1">Catalog Explorer View</div>
            <h3 className="text-base font-bold text-slate-900 mb-3">
              Inside <code className="font-mono text-sm">system.ai.Models</code>
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2">
              <img
                src="/assets/aistudio/Screenshot_2026-11-06_at_9.41.31_PM_ff9142ae.png"
                alt="Databricks Catalog Explorer showing system.ai Models list"
                referrerPolicy="no-referrer"
                className="w-full max-h-[380px] object-contain rounded-lg mx-auto"
              />
            </div>
          </div>

          <div className="mt-4 bg-slate-900 text-slate-100 rounded-xl p-4 text-xs space-y-2">
            <div className="font-bold text-sky-300">3-Level Unity Catalog Path:</div>
            <div className="font-mono text-[11px] bg-slate-800 px-2.5 py-1.5 rounded text-amber-300">
              system . ai . &lt;model_name&gt;
            </div>
            <p className="text-slate-300 leading-relaxed">
              Just like <code className="font-mono text-white">SNOWFLAKE.ACCOUNT_USAGE</code> is a built-in system database in Snowflake, <code className="font-mono text-white">system</code> is Databricks' built-in catalog for billing, lineage, and pre-registered AI models (<code className="font-mono text-white">system.ai</code>).
            </p>
          </div>
        </div>

        {/* Right: The 3 Distinct Model Types in That List (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                1. Not All 110 Models in <code className="font-mono">system.ai</code> Work the Same Way!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                There are <strong>3 distinct types of models</strong> mixed together alphabetically. Click each tab below to see which ones you can query immediately in SQL vs which ones require deploying an endpoint:
              </p>

              {/* Selector Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
                {MODEL_GROUPS.map(group => {
                  const isSelected = group.id === selectedGroupId;
                  return (
                    <button
                      key={group.id}
                      onClick={() => setSelectedGroupId(group.id)}
                      className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`text-[11px] font-mono font-semibold ${isSelected ? 'text-sky-300' : 'text-sky-700'}`}>
                        {group.id === 'pay-per-token'
                          ? 'Prefix: databricks-*'
                          : group.id === 'embeddings'
                          ? 'Prefix: gte_* / bge_*'
                          : 'No prefix (dbrx, gemma, llama)'}
                      </div>
                      <div className="text-xs font-bold mt-1 leading-snug">
                        {group.title.replace(/^\d+\.\s*/, '')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Group Details */}
            <div className="mt-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-base font-bold text-slate-900">{activeGroup.title}</h4>
                <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                  {activeGroup.badge}
                </span>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500 mb-1.5">
                  Examples in <code className="font-mono">system.ai</code>:
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {activeGroup.examplesInScreenshot.map(ex => (
                    <code
                      key={ex}
                      className="text-xs font-mono bg-slate-100 text-slate-800 px-2.5 py-1 rounded border border-slate-200"
                    >
                      {ex}
                    </code>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="text-xs font-bold text-slate-900 mb-1">What Exactly Is It?</div>
                  <p className="text-xs text-slate-700 leading-relaxed">{activeGroup.whatTheyAre}</p>
                </div>
                <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-4">
                  <div className="text-xs font-bold text-sky-900 mb-1">
                    How You Run It on Your Data Models
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{activeGroup.howToRunOnData}</p>
                  <div className="mt-2 pt-2 border-t border-sky-200/60 text-[11px] text-sky-800">
                    <strong>Snowflake Equivalent:</strong> {activeGroup.snowflakeEquivalent}
                  </div>
                </div>
              </div>

              {/* SQL Example */}
              <div className="bg-slate-900 rounded-xl p-4">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <span className="text-xs font-mono text-orange-300 font-semibold">
                    How to Call in Databricks SQL / dbt Model
                  </span>
                  <button
                    onClick={() => handleCopy(activeGroup.sqlExample, activeGroup.id)}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedIdx === activeGroup.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedIdx === activeGroup.id ? 'Copied' : 'Copy SQL'}</span>
                  </button>
                </div>
                <pre className="text-xs font-mono text-slate-100 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                  {activeGroup.sqlExample}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Snowflake Cortex vs Databricks AI Functions Side-by-Side */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="pb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">
            2. Running LLMs in SQL: Snowflake Cortex vs Databricks <code className="font-mono">ai_query()</code> & AI Functions
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            If you want to enrich your gold/silver dbt tables or run batch inference over millions of rows in SQL, here is the exact 1-to-1 translation from Snowflake Cortex to Databricks SQL AI Functions:
          </p>
        </div>

        <div className="space-y-4 mt-5">
          {AI_SQL_FUNCTIONS.map((item, idx) => (
            <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <h4 className="text-sm font-bold text-slate-900">
                  0{idx + 1}. {item.task}
                </h4>
                <span className="text-xs text-slate-500">{item.notes}</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-slate-900 rounded-lg p-3.5">
                  <div className="text-[11px] font-mono text-sky-300 font-semibold mb-1.5">
                    Snowflake Cortex SQL
                  </div>
                  <pre className="text-xs font-mono text-slate-100 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {item.snowflakeCortexSql}
                  </pre>
                </div>
                <div className="bg-slate-900 rounded-lg p-3.5">
                  <div className="text-[11px] font-mono text-orange-300 font-semibold mb-1.5">
                    Databricks SQL (Serverless SQL Warehouse)
                  </div>
                  <pre className="text-xs font-mono text-slate-100 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {item.databricksAiSql}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Three Ways to Use Those Models Right Now */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          3. Three Ways to Use Those Models Right Now in Databricks
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Depending on whether you are testing prompts, running SQL transformations, or training custom ML, here is where to go in the left sidebar of your Databricks workspace:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-800 mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Option A: Interactive Testing</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-2">
              Click "Playground" in Left Sidebar
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              In the left navigation under <strong>Machine Learning &rarr; Playground</strong>, you can pick any of the active foundation models (<code className="font-mono">databricks-kimi-k3</code>, <code className="font-mono">Claude</code>, <code className="font-mono">Llama</code>) and compare their responses side-by-side before writing SQL.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-800 mb-2">
              <Terminal className="w-4 h-4" />
              <span>Option B: Run on SQL / dbt Data Models</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-2">
              Use <code className="font-mono">ai_query()</code> in SQL Editor
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Open <strong>SQL Editor</strong>, attach a Serverless SQL Warehouse, and run <code className="font-mono">SELECT ai_query('databricks-kimi-k3', prompt) FROM your_table</code>. You can embed this right inside a dbt model or Materialized View!
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-2">
              <Cpu className="w-4 h-4" />
              <span>Option C: Deploy Open-Weight Models</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-2">
              Click Model &rarr; "Serve this Model"
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              For the non-prefixed models (like <code className="font-mono">gemma-3-12b-it</code> or <code className="font-mono">gpt-oss-20b</code>), click on the model in Catalog Explorer and click <strong>Serve this model</strong> to spin up a dedicated GPU endpoint.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
