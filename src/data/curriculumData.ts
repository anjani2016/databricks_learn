export interface ConceptEquivalence {
  id: string;
  category: 'Architecture' | 'Governance' | 'Ingestion & Pipelines' | 'Storage & Pruning';
  snowflakeTerm: string;
  snowflakeSub: string;
  databricksTerm: string;
  databricksSub: string;
  mentalShift: string;
  gotcha: string;
  codeExample?: {
    snowflake: string;
    databricks: string;
  };
}

export const CONCEPT_EQUIVALENCES: ConceptEquivalence[] = [
  {
    id: 'compute',
    category: 'Architecture',
    snowflakeTerm: 'Virtual Warehouse (XS to 6XL)',
    snowflakeSub: 'T-shirt sized stateless SQL MPP compute clusters',
    databricksTerm: 'SQL Warehouse (Serverless) & All-Purpose Compute',
    databricksSub: 'Photon-accelerated SQL endpoints vs Spark driver/worker clusters',
    mentalShift:
      'In Snowflake, one Virtual Warehouse type handles everything. In Databricks, ALWAYS use Serverless SQL Warehouses (with Photon) for BI/SQL queries—they feel identical to Snowflake Virtual Warehouses with instant startup. Use All-Purpose or Job Compute only when running PySpark, Scala, or ML training.',
    gotcha:
      'Do not run BI dashboards or pure SQL workloads on All-Purpose clusters; Serverless SQL Warehouses automatically manage Photon vectorization, predictive I/O, and intelligent workload management.',
    codeExample: {
      snowflake: `USE WAREHOUSE ANALYTICS_WH_LARGE;\nALTER WAREHOUSE ANALYTICS_WH_LARGE SET AUTO_SUSPEND = 60;`,
      databricks: `-- Selected in connection URI or UI selector\n-- Photon & Serverless scale automatically in seconds`
    }
  },
  {
    id: 'namespace',
    category: 'Governance',
    snowflakeTerm: 'Database.Schema.Table',
    snowflakeSub: 'Account-level RBAC with Database > Schema > Object hierarchy',
    databricksTerm: 'Catalog.Schema.Table (Unity Catalog)',
    databricksSub: '3-level ANSI namespace across workspaces with centralized metastore',
    mentalShift:
      'Unity Catalog uses the exact same 3-part dot notation you already know (`catalog.schema.table`). A "Catalog" in Databricks is the direct mental equivalent of a "Database" in Snowflake, while "Schema" and "Database" are aliases in Databricks SQL.',
    gotcha:
      'Avoid the legacy `hive_metastore` catalog—it is workspace-local. Always create and query objects inside Unity Catalog for column-level lineage, row filters, and column masks.',
    codeExample: {
      snowflake: `USE ROLE DATA_ENG;\nUSE DATABASE PROD_FINANCE;\nUSE SCHEMA CORE;\nSELECT * FROM PROD_FINANCE.CORE.LEDGER;`,
      databricks: `USE CATALOG prod_finance;\nUSE SCHEMA core;\nSELECT * FROM prod_finance.core.ledger;`
    }
  },
  {
    id: 'storage-location',
    category: 'Storage & Pruning',
    snowflakeTerm: 'Internal Stage & Managed Storage',
    snowflakeSub: 'Snowflake-owned S3/Blob bucket hidden behind proprietary layer',
    databricksTerm: 'Unity Catalog Managed Table & Volumes',
    databricksSub: 'Open Parquet + Delta Log stored in your cloud account bucket',
    mentalShift:
      'Snowflake hides the underlying cloud storage completely. Databricks stores tables in your cloud account (S3/ADLS/GCS), but with Unity Catalog Managed Tables + Predictive Optimization, you never have to specify file paths or manage buckets manually unless you choose External Tables.',
    gotcha:
      'In Snowflake, Stages hold raw files (CSV/JSON). In Databricks Unity Catalog, use "Volumes" (`/Volumes/catalog/schema/volume_name/file.csv`) as the exact equivalent of Snowflake Stages.',
    codeExample: {
      snowflake: `CREATE STAGE raw_stage URL='s3://bucket/raw/';\nLIST @raw_stage;`,
      databricks: `CREATE EXTERNAL VOLUME prod.raw.landing_vol\n  LOCATION 's3://bucket/raw/';\nLIST '/Volumes/prod/raw/landing_vol/';`
    }
  },
  {
    id: 'ingestion',
    category: 'Ingestion & Pipelines',
    snowflakeTerm: 'COPY INTO + Snowpipe',
    snowflakeSub: 'SQS/SNS queue-backed continuous micro-batch file ingestion',
    databricksTerm: 'COPY INTO + Auto Loader (read_files)',
    databricksSub: 'CloudFiles incremental file discovery with schema evolution',
    mentalShift:
      'Databricks supports a nearly identical SQL `COPY INTO` command for idempotent file loads! For streaming or continuous ingestion (Snowpipe equivalent), Databricks uses Auto Loader via `read_files()` in Streaming Tables.',
    gotcha:
      'Databricks `COPY INTO` tracks processed files in the Delta transaction log so re-running it skips already-loaded files automatically, just like Snowflake.',
    codeExample: {
      snowflake: `COPY INTO core.events\nFROM @raw_stage/events/\nFILE_FORMAT = (TYPE = JSON);`,
      databricks: `COPY INTO core.events\nFROM '/Volumes/prod/raw/landing_vol/events/'\nFILEFORMAT = JSON\nFORMAT_OPTIONS ('mergeSchema' = 'true');`
    }
  },
  {
    id: 'cdc-pipelines',
    category: 'Ingestion & Pipelines',
    snowflakeTerm: 'Streams & Tasks / Dynamic Tables',
    snowflakeSub: 'Offset-based change tracking and declarative target lag tables',
    databricksTerm: 'Change Data Feed (CDF) & Delta Live Tables (DLT)',
    databricksSub: 'Declarative Streaming Tables and Materialized Views',
    mentalShift:
      'If you love Snowflake Dynamic Tables (`TARGET_LAG = \'5 minutes\'`), Databricks Streaming Tables and Materialized Views in Databricks SQL / DLT use the exact same declarative mindset—you write the SQL query, and the engine handles incremental refreshes.',
    gotcha:
      'To read row-level `INSERT`/`UPDATE_PREIMAGE`/`UPDATE_POSTIMAGE`/`DELETE` changes like a Snowflake Stream, enable `delta.enableChangeDataFeed = true` on the table and query `table_changes(\'table\', start_version)`.',
    codeExample: {
      snowflake: `CREATE DYNAMIC TABLE clean_orders\n  TARGET_LAG = '15 minutes'\n  WAREHOUSE = ETL_WH\nAS SELECT * FROM raw_orders WHERE valid = TRUE;`,
      databricks: `CREATE OR REFRESH STREAMING TABLE clean_orders\n  SCHEDULE EVERY 15 MINUTES\nAS SELECT * FROM STREAM raw_orders WHERE valid = TRUE;`
    }
  },
  {
    id: 'clustering',
    category: 'Storage & Pruning',
    snowflakeTerm: 'Micro-partitions & Clustering Keys',
    snowflakeSub: '16MB uncompressed proprietary PAX files with automatic background reclustering',
    databricksTerm: 'Parquet Files & Liquid Clustering (CLUSTER BY)',
    databricksSub: '128MB–1GB Parquet files + _delta_log JSON/Checkpoints with Hilbert curve clustering',
    mentalShift:
      'Forget legacy Hive `PARTITION BY` and manual `ZORDER BY`! Modern Databricks uses `CLUSTER BY (col1, col2)` (Liquid Clustering), which works almost identically to Snowflake `CLUSTER BY`—incremental, skew-resistant, and allows changing clustering keys without rewriting the table.',
    gotcha:
      'With Unity Catalog Managed Tables, Databricks "Predictive Optimization" automatically runs `OPTIMIZE` (compaction) and `VACUUM` in the background, mirroring Snowflake Automatic Clustering.',
    codeExample: {
      snowflake: `CREATE TABLE sales (\n  sale_date DATE, region STRING, amount NUMBER\n) CLUSTER BY (sale_date, region);`,
      databricks: `CREATE TABLE sales (\n  sale_date DATE, region STRING, amount DECIMAL(18,2)\n) CLUSTER BY (sale_date, region);`
    }
  }
];

export interface SqlTranslationPattern {
  id: string;
  category: 'Semi-Structured JSON' | 'Dates & Timestamps' | 'Arrays & Unnesting' | 'DDL & Time Travel' | 'Merge & Upserts' | 'Window & Qualify';
  title: string;
  similarityScore: 'Identical (100%)' | 'Minor Tweak (85%)' | 'Different Idiom';
  summary: string;
  snowflakeSql: string;
  databricksSql: string;
  lineNotes: {
    aspect: string;
    snowflakeWay: string;
    databricksWay: string;
  }[];
  sampleOutput: {
    columns: string[];
    rows: string[][];
  };
}

export const SQL_TRANSLATION_PATTERNS: SqlTranslationPattern[] = [
  {
    id: 'json-traversal',
    category: 'Semi-Structured JSON',
    title: 'Querying Semi-Structured JSON (VARIANT vs Colon & Structs)',
    similarityScore: 'Minor Tweak (85%)',
    summary:
      'Good news: Databricks natively supports Snowflake-style `col:path.subpath::TYPE` colon extraction syntax on JSON strings and VARIANT columns (introduced in Databricks Runtime 15.3+).',
    snowflakeSql: `SELECT
  payload:event_id::STRING AS event_id,
  payload:user.profile.email::STRING AS user_email,
  payload:metrics.latency_ms::INT AS latency_ms,
  PARSE_JSON(raw_json_str) AS parsed_variant
FROM raw_telemetry
WHERE payload:status::STRING = 'COMPLETED';`,
    databricksSql: `SELECT
  raw_json_str:event_id::STRING AS event_id,
  raw_json_str:user.profile.email::STRING AS user_email,
  raw_json_str:metrics.latency_ms::INT AS latency_ms,
  PARSE_JSON(raw_json_str) AS parsed_variant
FROM raw_telemetry
WHERE raw_json_str:status::STRING = 'COMPLETED';`,
    lineNotes: [
      {
        aspect: 'Colon Path Syntax',
        snowflakeWay: 'payload:user.profile.email::STRING (case-sensitive key path)',
        databricksWay: 'raw_json_str:user.profile.email::STRING (works directly on STRING or VARIANT!)'
      },
      {
        aspect: 'Column Data Type',
        snowflakeWay: 'VARIANT type stores schema-less binary JSON',
        databricksWay: 'VARIANT type (DBR 15.3+) or native STRUCT / STRING with colon operator'
      },
      {
        aspect: 'Type Casting',
        snowflakeWay: '::STRING or ::INT double-colon cast',
        databricksWay: '::STRING or ::INT double-colon cast works identically'
      }
    ],
    sampleOutput: {
      columns: ['event_id', 'user_email', 'latency_ms', 'parsed_variant'],
      rows: [
        ['evt_9941a', 'alex.chen@acme.io', '42', '{"event_id":"evt_9941a","status":"COMPLETED"}'],
        ['evt_9942b', 'priya.nair@acme.io', '18', '{"event_id":"evt_9942b","status":"COMPLETED"}']
      ]
    }
  },
  {
    id: 'flatten-explode',
    category: 'Arrays & Unnesting',
    title: 'Unnesting Arrays (LATERAL FLATTEN vs LATERAL VIEW EXPLODE)',
    similarityScore: 'Different Idiom',
    summary:
      'This is the #1 daily SQL translation adjustment for Snowflake engineers. Instead of `LATERAL FLATTEN(INPUT => col)`, Databricks uses `LATERAL VIEW EXPLODE(col)` or the table-valued function `LATERAL EXPLODE(col)`.',
    snowflakeSql: `SELECT
  o.order_id,
  o.customer_id,
  f.index AS item_position,
  f.value:sku::STRING AS sku_code,
  f.value:qty::INT AS quantity
FROM orders o,
LATERAL FLATTEN(INPUT => o.line_items, OUTER => TRUE) f;`,
    databricksSql: `SELECT
  o.order_id,
  o.customer_id,
  f.pos AS item_position,
  f.col:sku::STRING AS sku_code,
  f.col:qty::INT AS quantity
FROM orders o,
LATERAL POSEXPLODE_OUTER(o.line_items) f(pos, col);`,
    lineNotes: [
      {
        aspect: 'Standard Array Unnest',
        snowflakeWay: 'LATERAL FLATTEN(INPUT => arr) f -> yields f.value',
        databricksWay: 'LATERAL EXPLODE(arr) f(val) -> yields f.val'
      },
      {
        aspect: 'Preserve Empty/NULL Arrays',
        snowflakeWay: 'OUTER => TRUE parameter inside FLATTEN',
        databricksWay: 'Use EXPLODE_OUTER(arr) or POSEXPLODE_OUTER(arr)'
      },
      {
        aspect: 'Array Element Index',
        snowflakeWay: 'f.index automatically returned by FLATTEN',
        databricksWay: 'Use POSEXPLODE(arr) f(pos, col) to get 0-based index + value'
      }
    ],
    sampleOutput: {
      columns: ['order_id', 'customer_id', 'item_position', 'sku_code', 'quantity'],
      rows: [
        ['ORD-701', 'CUST-12', '0', 'SKU-NVMe-2TB', '2'],
        ['ORD-701', 'CUST-12', '1', 'SKU-DDR5-64G', '4'],
        ['ORD-702', 'CUST-88', 'NULL', 'NULL', 'NULL']
      ]
    }
  },
  {
    id: 'dates-timestamps',
    category: 'Dates & Timestamps',
    title: 'Date Arithmetic, DATEADD, DATEDIFF & Truncation',
    similarityScore: 'Identical (100%)',
    summary:
      'Historically Spark SQL had different argument orders for `DATEADD` and `DATEDIFF`. Modern Databricks SQL now supports the exact 3-argument Snowflake syntax `DATEADD(unit, value, expr)` and `DATEDIFF(unit, start, end)`.',
    snowflakeSql: `SELECT
  DATE_TRUNC('MONTH', order_ts) AS order_month,
  DATEADD(day, -7, CURRENT_DATE()) AS seven_days_ago,
  DATEDIFF(hour, created_at, fulfilled_at) AS hours_to_fulfill,
  TO_CHAR(order_ts, 'YYYY-MM-DD HH24:MI') AS formatted_ts
FROM shipments;`,
    databricksSql: `SELECT
  DATE_TRUNC('MONTH', order_ts) AS order_month,
  DATEADD(day, -7, CURRENT_DATE()) AS seven_days_ago,
  DATEDIFF(hour, created_at, fulfilled_at) AS hours_to_fulfill,
  DATE_FORMAT(order_ts, 'yyyy-MM-dd HH:mm') AS formatted_ts
FROM shipments;`,
    lineNotes: [
      {
        aspect: 'DATEADD & DATEDIFF',
        snowflakeWay: 'DATEADD(day, -7, ts) / DATEDIFF(hour, start, end)',
        databricksWay: 'Identical! 3-argument DATEADD & DATEDIFF work natively in Databricks SQL'
      },
      {
        aspect: 'DATE_TRUNC',
        snowflakeWay: "DATE_TRUNC('MONTH', order_ts)",
        databricksWay: "DATE_TRUNC('MONTH', order_ts) — identical syntax"
      },
      {
        aspect: 'Timestamp Formatting Tokens',
        snowflakeWay: "TO_CHAR(ts, 'YYYY-MM-DD HH24:MI')",
        databricksWay: "DATE_FORMAT(ts, 'yyyy-MM-dd HH:mm') (Java SimpleDateFormat case rules!)"
      }
    ],
    sampleOutput: {
      columns: ['order_month', 'seven_days_ago', 'hours_to_fulfill', 'formatted_ts'],
      rows: [
        ['2026-11-01 00:00:00', '2026-10-30', '14', '2026-11-04 16:30'],
        ['2026-11-01 00:00:00', '2026-10-30', '6', '2026-11-05 09:15']
      ]
    }
  },
  {
    id: 'qualify-windows',
    category: 'Window & Qualify',
    title: 'Deduplication with QUALIFY & Conditional Aggregations',
    similarityScore: 'Identical (100%)',
    summary:
      'Snowflake power-users rely heavily on `QUALIFY`, `IFF`, `NVL`, and `ZEROIFNULL`. Databricks SQL supports `QUALIFY`, `IFF`, `NVL`, and `ILIKE` out of the box with zero syntax rewrites.',
    snowflakeSql: `SELECT
  customer_id,
  NVL(subscription_tier, 'FREE') AS tier,
  IFF(mrr_amount > 1000, 'Enterprise', 'Self-Serve') AS segment,
  updated_at
FROM customer_snapshots
WHERE email ILIKE '%@enterprise.com'
QUALIFY ROW_NUMBER() OVER (
  PARTITION BY customer_id ORDER BY updated_at DESC
) = 1;`,
    databricksSql: `SELECT
  customer_id,
  NVL(subscription_tier, 'FREE') AS tier,
  IFF(mrr_amount > 1000, 'Enterprise', 'Self-Serve') AS segment,
  updated_at
FROM customer_snapshots
WHERE email ILIKE '%@enterprise.com'
QUALIFY ROW_NUMBER() OVER (
  PARTITION BY customer_id ORDER BY updated_at DESC
) = 1;`,
    lineNotes: [
      {
        aspect: 'QUALIFY Clause',
        snowflakeWay: 'QUALIFY ROW_NUMBER() OVER (...) = 1',
        databricksWay: '100% identical support in Databricks SQL'
      },
      {
        aspect: 'Inline Conditional & Nulls',
        snowflakeWay: 'IFF(cond, a, b), NVL(a, b), COALESCE(a, b)',
        databricksWay: 'IFF(cond, a, b), NVL(a, b), COALESCE(a, b) all work identically'
      },
      {
        aspect: 'Group String Concatenation',
        snowflakeWay: "LISTAGG(col, ', ') WITHIN GROUP (ORDER BY col)",
        databricksWay: "LISTAGG(col, ', ') WITHIN GROUP (ORDER BY col) (or ARRAY_JOIN(COLLECT_LIST(col), ', '))"
      }
    ],
    sampleOutput: {
      columns: ['customer_id', 'tier', 'segment', 'updated_at'],
      rows: [
        ['C-9012', 'PLATINUM', 'Enterprise', '2026-11-06 14:22:01'],
        ['C-9045', 'FREE', 'Self-Serve', '2026-11-06 11:05:49']
      ]
    }
  },
  {
    id: 'time-travel-cloning',
    category: 'DDL & Time Travel',
    title: 'Time Travel, Zero-Copy Cloning & Identity Columns',
    similarityScore: 'Minor Tweak (85%)',
    summary:
      'Both platforms support ACID Time Travel and instant Zero-Copy Cloning. Notice the subtle keyword difference: Snowflake uses `AT(OFFSET => ...)` or `BEFORE(STATEMENT => ...)`, whereas Delta Lake uses `TIMESTAMP AS OF` or `VERSION AS OF`.',
    snowflakeSql: `-- 1. Query historical snapshot
SELECT * FROM core.accounts
AT(TIMESTAMP => '2026-11-01 00:00:00'::TIMESTAMP);

-- 2. Zero-copy clone for dev testing
CREATE TABLE dev.accounts_sandbox
CLONE core.accounts;

-- 3. Rollback table state
CREATE OR REPLACE TABLE core.accounts
CLONE core.accounts AT(OFFSET => -3600);`,
    databricksSql: `-- 1. Query historical snapshot (Timestamp or Version #)
SELECT * FROM core.accounts
TIMESTAMP AS OF '2026-11-01 00:00:00';
-- Or: SELECT * FROM core.accounts VERSION AS OF 42;

-- 2. Zero-copy clone for dev testing (SHALLOW = metadata-only)
CREATE TABLE dev.accounts_sandbox
SHALLOW CLONE core.accounts;

-- 3. In-place atomic rollback!
RESTORE TABLE core.accounts
TO VERSION AS OF 42;`,
    lineNotes: [
      {
        aspect: 'Time Travel Syntax',
        snowflakeWay: 'AT(TIMESTAMP => ...) or BEFORE(STATEMENT => ...)',
        databricksWay: 'TIMESTAMP AS OF ... or VERSION AS OF <int> (every commit has an integer version!)'
      },
      {
        aspect: 'Zero-Copy Clone',
        snowflakeWay: 'CREATE TABLE tgt CLONE src;',
        databricksWay: 'CREATE TABLE tgt SHALLOW CLONE src; (or DEEP CLONE to copy files)'
      },
      {
        aspect: 'Table Rollback',
        snowflakeWay: 'CREATE OR REPLACE TABLE ... CLONE ... AT(...)',
        databricksWay: 'Built-in RESTORE TABLE tbl TO VERSION AS OF <ver> command'
      }
    ],
    sampleOutput: {
      columns: ['version', 'timestamp', 'operation', 'numOutputRows'],
      rows: [
        ['43', '2026-11-06 18:10:00', 'RESTORE', '1,420,000'],
        ['42', '2026-11-01 00:00:00', 'MERGE', '1,420,000']
      ]
    }
  },
  {
    id: 'merge-schema-evolution',
    category: 'Merge & Upserts',
    title: 'MERGE Upserts with Automatic Schema Evolution',
    similarityScore: 'Minor Tweak (85%)',
    summary:
      'Standard ANSI `MERGE INTO` is identical. However, Databricks adds a killer extension (`WITH SCHEMA EVOLUTION`) that automatically adds new columns from the source staging table during a MERGE without manual ALTER TABLE scripts.',
    snowflakeSql: `MERGE INTO target_customers t
USING staging_updates s
ON t.customer_id = s.customer_id
WHEN MATCHED AND s.is_deleted = TRUE THEN DELETE
WHEN MATCHED THEN UPDATE SET
  t.email = s.email,
  t.updated_at = s.updated_at
WHEN NOT MATCHED THEN INSERT (customer_id, email, updated_at)
  VALUES (s.customer_id, s.email, s.updated_at);`,
    databricksSql: `MERGE WITH SCHEMA EVOLUTION INTO target_customers t
USING staging_updates s
ON t.customer_id = s.customer_id
WHEN MATCHED AND s.is_deleted = TRUE THEN DELETE
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *
WHEN NOT MATCHED BY SOURCE THEN DELETE;`,
    lineNotes: [
      {
        aspect: 'Wildcard Update/Insert',
        snowflakeWay: 'Requires listing all columns in UPDATE SET and INSERT',
        databricksWay: 'Supports shorthand UPDATE SET * and INSERT * for all matching columns!'
      },
      {
        aspect: 'Schema Evolution',
        snowflakeWay: 'Requires ALTER TABLE or ENABLE_SCHEMA_EVOLUTION on Copy',
        databricksWay: 'MERGE WITH SCHEMA EVOLUTION automatically appends new source columns'
      },
      {
        aspect: 'Not Matched By Source',
        snowflakeWay: 'Not supported natively in single MERGE clause',
        databricksWay: 'Supports WHEN NOT MATCHED BY SOURCE THEN UPDATE / DELETE'
      }
    ],
    sampleOutput: {
      columns: ['num_affected_rows', 'num_updated_rows', 'num_deleted_rows', 'num_inserted_rows'],
      rows: [['1,250', '980', '20', '250']]
    }
  }
];

export interface QuizQuestion {
  id: string;
  scenario: string;
  snowflakeContext: string;
  question: string;
  options: {
    id: string;
    label: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    scenario: 'Compute Selection for BI Dashboards',
    snowflakeContext: 'In Snowflake, you create an `X-SMALL` or `MEDIUM` Virtual Warehouse with `AUTO_SUSPEND = 60` for Tableau / PowerBI users.',
    question: 'Which Databricks compute resource gives you the closest experience (instant wake-up, query queueing, pure SQL concurrency, and Photon vectorization)?',
    options: [
      {
        id: 'a',
        label: 'All-Purpose Interactive Cluster with 4 Worker Nodes',
        isCorrect: false,
        explanation: 'All-Purpose clusters take 3–4 minutes to spin up VMs and are meant for collaborative Python/Scala notebooks, not pure SQL BI concurrency.'
      },
      {
        id: 'b',
        label: 'Serverless SQL Warehouse',
        isCorrect: true,
        explanation: 'Spot on! Serverless SQL Warehouses wake up in 2–5 seconds, run Photon natively, auto-scale clusters for concurrency, and mirror Snowflake Virtual Warehouses.'
      },
      {
        id: 'c',
        label: 'Job Compute Cluster',
        isCorrect: false,
        explanation: 'Job Compute is ephemeral compute spun up for scheduled workflows/orchestration, not interactive BI endpoints.'
      }
    ]
  },
  {
    id: 'q2',
    scenario: 'Physical Table Layout & Pruning',
    snowflakeContext: 'In Snowflake, tables are automatically split into 16MB micro-partitions, and you optionally define `CLUSTER BY (event_date, tenant_id)` for multi-dimensional pruning.',
    question: 'When creating a new large table in Databricks today, what is the modern recommended clustering syntax?',
    options: [
      {
        id: 'a',
        label: 'PARTITIONED BY (event_date, tenant_id) with Hive directory folders',
        isCorrect: false,
        explanation: 'Legacy Hive partitioning causes the "small file problem" when cardinality is high. Avoid Hive partitioning unless tables are multi-terabyte with coarse partitions.'
      },
      {
        id: 'b',
        label: 'CLUSTER BY (event_date, tenant_id) using Liquid Clustering',
        isCorrect: true,
        explanation: 'Correct! Liquid Clustering (`CLUSTER BY`) uses Hilbert curves to co-locate data across files without physical directory explosions, and works incrementally just like Snowflake.'
      },
      {
        id: 'c',
        label: 'Creating manual indexes with CREATE INDEX idx ON table(event_date)',
        isCorrect: false,
        explanation: 'Like Snowflake, Delta Lake does not use traditional B-Tree row indexes; it relies on min/max file statistics in `_delta_log` and data skipping.'
      }
    ]
  },
  {
    id: 'q3',
    scenario: 'Unnesting JSON Arrays in SQL',
    snowflakeContext: 'You are migrating a Snowflake query that uses `FROM orders o, LATERAL FLATTEN(INPUT => o.items) f` to expand an array of structs.',
    question: 'How do you write this cleanly in Databricks SQL while keeping rows with empty/null arrays?',
    options: [
      {
        id: 'a',
        label: 'FROM orders o, LATERAL EXPLODE_OUTER(o.items) f(item)',
        isCorrect: true,
        explanation: 'Exactly right! `LATERAL EXPLODE_OUTER(o.items)` (or `POSEXPLODE_OUTER` if you also need the 0-based index) is the direct Databricks equivalent of `LATERAL FLATTEN(..., OUTER => TRUE)`.'
      },
      {
        id: 'b',
        label: 'FROM orders o UNNEST(o.items) WITH OFFSET',
        isCorrect: false,
        explanation: 'UNNEST WITH OFFSET is BigQuery syntax. Databricks uses `EXPLODE`, `EXPLODE_OUTER`, or `POSEXPLODE`.'
      },
      {
        id: 'c',
        label: 'You must convert the SQL query to Python Pandas first',
        isCorrect: false,
        explanation: 'No Python needed! Databricks SQL handles complex nested arrays, structs, and JSON paths natively in pure SQL.'
      }
    ]
  },
  {
    id: 'q4',
    scenario: 'Understanding the Transaction Log',
    snowflakeContext: 'In Snowflake, metadata and micro-partition min/max statistics are stored in the proprietary Cloud Services layer (FoundationDB).',
    question: 'Where does Databricks store ACID transaction history and per-file column min/max statistics for a Delta table?',
    options: [
      {
        id: 'a',
        label: 'Inside the `_delta_log/` subdirectory right alongside the Parquet data files in cloud object storage',
        isCorrect: true,
        explanation: 'Correct! Every commit writes an atomic JSON file (`000000.json`, `000001.json`) and periodic Parquet checkpoints inside `_delta_log/` right in your storage bucket.'
      },
      {
        id: 'b',
        label: 'Inside the Spark Driver JVM memory only (lost when cluster stops)',
        isCorrect: false,
        explanation: 'Delta logs are persisted durably in cloud object storage (`_delta_log`), making table state and time travel completely independent of compute lifecycle.'
      },
      {
        id: 'c',
        label: 'Inside the Parquet file footer of the first file only',
        isCorrect: false,
        explanation: 'While each Parquet file has its own footer, the table-wide ACID state and file-level min/max stats live in `_delta_log/` JSON and checkpoint files.'
      }
    ]
  }
];
