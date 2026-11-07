import React, { useState } from 'react';
import { CheckCircle2, Play, RotateCcw, FileText, Database, History, Sparkles, Layers } from 'lucide-react';

interface TableFormatsStepProps {
  onCompleteStep: () => void;
  isCompleted: boolean;
}

interface OperationSnapshot {
  version: number;
  operationName: string;
  sqlCommand: {
    snowflake: string;
    databricks: string;
  };
  snowflakeState: {
    activePartitions: { id: string; rows: number; minMaxId: string; status: 'ACTIVE' | 'NEW' }[];
    retiredPartitions: { id: string; rows: number; reason: string }[];
    cloudServicesNote: string;
  };
  deltaState: {
    logFile: string;
    parquetFiles: { name: string; rows: number; minMaxId: string; status: 'ACTIVE' | 'ADDED' | 'TOMBSTONED'; dvFile?: string }[];
    deltaLogJson: string;
    engineNote: string;
  };
}

const SIMULATION_SNAPSHOTS: OperationSnapshot[] = [
  {
    version: 0,
    operationName: 'v0: CREATE & INSERT (100K Rows)',
    sqlCommand: {
      snowflake: `CREATE TABLE orders (order_id INT, region STRING, amount NUMBER);\nINSERT INTO orders SELECT ... -- 100,000 rows`,
      databricks: `CREATE TABLE orders (order_id INT, region STRING, amount DECIMAL(10,2));\nINSERT INTO orders SELECT ... -- 100,000 rows`
    },
    snowflakeState: {
      activePartitions: [
        { id: 'mp_001.fdn', rows: 50000, minMaxId: '1 .. 50,000', status: 'NEW' },
        { id: 'mp_002.fdn', rows: 50000, minMaxId: '50,001 .. 100,000', status: 'NEW' }
      ],
      retiredPartitions: [],
      cloudServicesNote:
        'Snowflake writes two immutable 16MB micro-partitions to internal storage and records column min/max statistics in Cloud Services FoundationDB.'
    },
    deltaState: {
      logFile: '_delta_log/00000000000000000000.json',
      parquetFiles: [
        { name: 'part-00000-a1b2.snappy.parquet', rows: 50000, minMaxId: '1 .. 50,000', status: 'ADDED' },
        { name: 'part-00001-c3d4.snappy.parquet', rows: 50000, minMaxId: '50,001 .. 100,000', status: 'ADDED' }
      ],
      deltaLogJson: `{
  "commitInfo": { "version": 0, "operation": "WRITE", "isolationLevel": "WriteSerializable" },
  "add": {
    "path": "part-00000-a1b2.snappy.parquet",
    "size": 4129400,
    "stats": "{\\"numRecords\\":50000,\\"minValues\\":{\\"order_id\\":1},\\"maxValues\\":{\\"order_id\\":50000}}"
  },
  "add": {
    "path": "part-00001-c3d4.snappy.parquet",
    "size": 4180210,
    "stats": "{\\"numRecords\\":50000,\\"minValues\\":{\\"order_id\\":50001},\\"maxValues\\":{\\"order_id\\":100000}}"
  }
}`,
      engineNote:
        'Databricks writes two standard Apache Parquet files and commits 000000.json inside _delta_log/ containing the exact min/max stats for data skipping.'
    }
  },
  {
    version: 1,
    operationName: 'v1: UPDATE 50 Rows (Copy-on-Write vs Deletion Vectors)',
    sqlCommand: {
      snowflake: `UPDATE orders SET amount = amount * 1.10\nWHERE order_id BETWEEN 100 AND 149;`,
      databricks: `UPDATE orders SET amount = amount * 1.10\nWHERE order_id BETWEEN 100 AND 149;`
    },
    snowflakeState: {
      activePartitions: [
        { id: 'mp_002.fdn', rows: 50000, minMaxId: '50,001 .. 100,000', status: 'ACTIVE' },
        { id: 'mp_003.fdn', rows: 50000, minMaxId: '1 .. 50,000', status: 'NEW' }
      ],
      retiredPartitions: [
        { id: 'mp_001.fdn', rows: 50000, reason: 'Retained for Time Travel (Copy-on-Write replaced entire partition)' }
      ],
      cloudServicesNote:
        'Because Snowflake micro-partitions are immutable (Copy-on-Write), updating 50 rows rewrites all 50,000 rows of mp_001.fdn into a brand-new micro-partition mp_003.fdn.'
    },
    deltaState: {
      logFile: '_delta_log/00000000000000000001.json',
      parquetFiles: [
        {
          name: 'part-00000-a1b2.snappy.parquet',
          rows: 50000,
          minMaxId: '1 .. 50,000',
          status: 'ACTIVE',
          dvFile: 'deletion_vector_d8f1.bin (marks 50 row indices invalidated)'
        },
        { name: 'part-00001-c3d4.snappy.parquet', rows: 50000, minMaxId: '50,001 .. 100,000', status: 'ACTIVE' },
        { name: 'part-00002-e5f6.snappy.parquet', rows: 50, minMaxId: '100 .. 149', status: 'ADDED' }
      ],
      deltaLogJson: `{
  "commitInfo": { "version": 1, "operation": "UPDATE", "enableDeletionVectors": true },
  "remove": { "path": "part-00000-a1b2.snappy.parquet", "deletionTimestamp": 1762481000 },
  "add": {
    "path": "part-00000-a1b2.snappy.parquet",
    "deletionVector": { "storageType": "u", "pathOrInlineDv": "deletion_vector_d8f1.bin", "cardinality": 50 }
  },
  "add": {
    "path": "part-00002-e5f6.snappy.parquet",
    "stats": "{\\"numRecords\\":50,\\"minValues\\":{\\"order_id\\":100},\\"maxValues\\":{\\"order_id\\":149}}"
  }
}`,
      engineNote:
        'Merge-on-Read Advantage: Instead of rewriting a 50,000-row Parquet file for 50 changed rows, Delta Lake writes a tiny Roaring Bitmap Deletion Vector + a small 50-row Parquet file! Updates/Deletes run 10x faster.'
    }
  },
  {
    version: 2,
    operationName: 'v2: OPTIMIZE & Compaction (Liquid Clustering)',
    sqlCommand: {
      snowflake: `-- Handled automatically in background by Snowflake\n-- Or via ALTER TABLE orders CLUSTER BY (order_id);`,
      databricks: `-- Handled automatically by Predictive Optimization\n-- Or manual: OPTIMIZE orders;`
    },
    snowflakeState: {
      activePartitions: [
        { id: 'mp_002.fdn', rows: 50000, minMaxId: '50,001 .. 100,000', status: 'ACTIVE' },
        { id: 'mp_003.fdn', rows: 50000, minMaxId: '1 .. 50,000', status: 'ACTIVE' }
      ],
      retiredPartitions: [
        { id: 'mp_001.fdn', rows: 50000, reason: 'Retained in Time Travel window (1–90 days), then moves to Fail-Safe' }
      ],
      cloudServicesNote:
        'Snowflake Automatic Clustering runs serverless background credits to re-sort micro-partitions when clustering depth degrades.'
    },
    deltaState: {
      logFile: '_delta_log/00000000000000000002.json',
      parquetFiles: [
        { name: 'part-00001-c3d4.snappy.parquet', rows: 50000, minMaxId: '50,001 .. 100,000', status: 'ACTIVE' },
        { name: 'part-00003-compacted.snappy.parquet', rows: 50000, minMaxId: '1 .. 50,000', status: 'ADDED' },
        { name: 'part-00000-a1b2.snappy.parquet', rows: 50000, minMaxId: '1 .. 50,000', status: 'TOMBSTONED' },
        { name: 'part-00002-e5f6.snappy.parquet', rows: 50, minMaxId: '100 .. 149', status: 'TOMBSTONED' }
      ],
      deltaLogJson: `{
  "commitInfo": { "version": 2, "operation": "OPTIMIZE", "clusterBy": ["order_id"] },
  "remove": { "path": "part-00000-a1b2.snappy.parquet", "dataChange": false },
  "remove": { "path": "part-00002-e5f6.snappy.parquet", "dataChange": false },
  "add": {
    "path": "part-00003-compacted.snappy.parquet",
    "size": 4131000,
    "stats": "{\\"numRecords\\":50000,\\"minValues\\":{\\"order_id\\":1},\\"maxValues\\":{\\"order_id\\":50000}}"
  }
}`,
      engineNote:
        'OPTIMIZE compacts small files and merges Deletion Vectors into a clean Parquet file. Notice the old files are only logically tombstoned ("remove") in _delta_log so Time Travel to VERSION AS OF 0 or 1 still works!'
    }
  },
  {
    version: 3,
    operationName: 'v3: Time Travel & Storage Cleanup (VACUUM vs Retention)',
    sqlCommand: {
      snowflake: `SELECT * FROM orders AT(OFFSET => -600);\n-- Storage purged automatically after DATA_RETENTION_TIME_IN_DAYS + 7d Fail-Safe`,
      databricks: `SELECT * FROM orders VERSION AS OF 1;\n-- Physical purge of tombstoned files older than 7 days:\nVACUUM orders RETAIN 168 HOURS;`
    },
    snowflakeState: {
      activePartitions: [
        { id: 'mp_002.fdn', rows: 50000, minMaxId: '50,001 .. 100,000', status: 'ACTIVE' },
        { id: 'mp_003.fdn', rows: 50000, minMaxId: '1 .. 50,000', status: 'ACTIVE' }
      ],
      retiredPartitions: [],
      cloudServicesNote:
        'After DATA_RETENTION_TIME_IN_DAYS (up to 90 days on Enterprise) plus 7 days of non-queryable Fail-Safe, Snowflake garbage-collects mp_001.fdn.'
    },
    deltaState: {
      logFile: '_delta_log/00000000000000000003.checkpoint.parquet',
      parquetFiles: [
        { name: 'part-00001-c3d4.snappy.parquet', rows: 50000, minMaxId: '50,001 .. 100,000', status: 'ACTIVE' },
        { name: 'part-00003-compacted.snappy.parquet', rows: 50000, minMaxId: '1 .. 50,000', status: 'ACTIVE' }
      ],
      deltaLogJson: `// VACUUM deletes unreferenced Parquet files older than retention threshold (default 7 days)
// Delta also writes periodic Parquet Checkpoint files in _delta_log/ so readers don't have
// to replay thousands of individual JSON log files from version 0.`,
      engineNote:
        'Default Delta retention is 30 days for log history and 7 days for deleted data files (`delta.deletedFileRetentionDuration`). With Unity Catalog Managed Tables, Predictive Optimization runs VACUUM automatically.'
    }
  }
];

export const TableFormatsStep: React.FC<TableFormatsStepProps> = ({
  onCompleteStep,
  isCompleted
}) => {
  const [stepIdx, setStepIdx] = useState<number>(0);
  const currentSnapshot = SIMULATION_SNAPSHOTS[stepIdx];

  return (
    <div className="space-y-8">
      {/* Module Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="text-xs font-medium text-slate-500 mb-1">
              <span>Step 02 of 04</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Storage Internals</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Micro-partitions vs Delta Lake</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Table Formats Under the Hood: Micro-Partitions vs Delta Lake
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
              {isCompleted ? 'Step 2 Completed — Next: SQL Translator' : 'Mark Step 2 Complete & Continue'}
            </button>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600 leading-relaxed max-w-4xl">
          In Snowflake, storage is a black box: you run DML, and Snowflake manages **immutable 16MB micro-partitions** behind the scenes. In Databricks, tables default to **Delta Lake**—an open format built on standard **Apache Parquet files** paired with a transactional **`_delta_log/`** folder. Step through the interactive simulator below to see how both engines handle `INSERT`, `UPDATE`, `OPTIMIZE`, and `Time Travel`.
        </p>
      </div>

      {/* Interactive Transaction Log & Micro-Partition Simulator */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              1. Interactive Transaction & File Layout Simulator
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click through commits <code className="font-mono text-slate-700">v0</code> to <code className="font-mono text-slate-700">v3</code> to inspect physical files and transaction metadata side by side.
            </p>
          </div>

          {/* Step Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {SIMULATION_SNAPSHOTS.map((snap, idx) => (
              <button
                key={snap.version}
                onClick={() => setStepIdx(idx)}
                className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  stepIdx === idx
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Commit v{snap.version}
              </button>
            ))}
            <button
              onClick={() => setStepIdx(prev => (prev + 1) % SIMULATION_SNAPSHOTS.length)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              Next Commit
            </button>
            <button
              onClick={() => setStepIdx(0)}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              title="Reset Simulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Active Operation Banner */}
        <div className="mt-5 bg-slate-900 text-white rounded-xl p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-sky-400" />
              <span className="text-sm font-bold">{currentSnapshot.operationName}</span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Active Log File: {currentSnapshot.deltaState.logFile}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
            <div>
              <div className="text-[11px] font-mono text-sky-300 mb-1">Snowflake SQL Trigger</div>
              <pre className="text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap">
                {currentSnapshot.sqlCommand.snowflake}
              </pre>
            </div>
            <div>
              <div className="text-[11px] font-mono text-orange-300 mb-1">Databricks Delta SQL Trigger</div>
              <pre className="text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap">
                {currentSnapshot.sqlCommand.databricks}
              </pre>
            </div>
          </div>
        </div>

        {/* Side-by-Side Storage Visualizers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Left: Snowflake Physical Layout */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-xs font-bold text-sky-700">Snowflake Storage Engine</span>
                  <h4 className="text-base font-bold text-slate-900">
                    Proprietary FDN Micro-Partitions (Copy-on-Write)
                  </h4>
                </div>
                <Database className="w-5 h-5 text-sky-700" />
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-700 mb-2">
                  Active Micro-Partitions in Current Snapshot (v{currentSnapshot.version})
                </div>
                <div className="space-y-2">
                  {currentSnapshot.snowflakeState.activePartitions.map(mp => (
                    <div
                      key={mp.id}
                      className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                        <div>
                          <div className="text-xs font-mono font-bold text-slate-900">{mp.id}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            order_id min/max: [{mp.minMaxId}]
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-xs font-bold text-slate-900 tabular-nums">
                          {mp.rows.toLocaleString()} rows
                        </div>
                        <div className="text-[11px] text-emerald-700 font-semibold">
                          ● {mp.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {currentSnapshot.snowflakeState.retiredPartitions.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs font-semibold text-slate-500 mb-2">
                      Unreferenced Micro-Partitions (Retained for Time Travel)
                    </div>
                    {currentSnapshot.snowflakeState.retiredPartitions.map(retired => (
                      <div
                        key={retired.id}
                        className="bg-slate-100 border border-dashed border-slate-300 rounded-lg p-3 opacity-80"
                      >
                        <div className="flex items-center justify-between text-xs font-mono text-slate-600">
                          <span className="line-through">{retired.id}</span>
                          <span className="tabular-nums">{retired.rows.toLocaleString()} rows</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">{retired.reason}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200 text-xs text-slate-700 leading-relaxed">
              <strong className="text-slate-900">How Snowflake Handles This: </strong>
              {currentSnapshot.snowflakeState.cloudServicesNote}
            </div>
          </div>

          {/* Right: Databricks Delta Lake Layout */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-xs font-bold text-orange-700">Databricks Storage Engine</span>
                  <h4 className="text-base font-bold text-slate-900">
                    Delta Lake (Parquet + _delta_log + Deletion Vectors)
                  </h4>
                </div>
                <Layers className="w-5 h-5 text-orange-700" />
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-700 mb-2">
                  Physical Files in Table Directory
                </div>
                <div className="space-y-2">
                  {currentSnapshot.deltaState.parquetFiles.map(file => (
                    <div
                      key={file.name + file.status}
                      className={`rounded-lg p-3 border ${
                        file.status === 'TOMBSTONED'
                          ? 'bg-slate-100 border-dashed border-slate-300 opacity-75'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText
                            className={`w-4 h-4 shrink-0 ${
                              file.status === 'TOMBSTONED' ? 'text-slate-400' : 'text-orange-600'
                            }`}
                          />
                          <div>
                            <div
                              className={`text-xs font-mono font-bold ${
                                file.status === 'TOMBSTONED'
                                  ? 'line-through text-slate-500'
                                  : 'text-slate-900'
                              }`}
                            >
                              {file.name}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              stats min/max: [{file.minMaxId}]
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="text-xs font-bold text-slate-900 tabular-nums">
                            {file.rows.toLocaleString()} rows
                          </div>
                          <div
                            className={`text-[11px] font-semibold ${
                              file.status === 'TOMBSTONED'
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            {file.status === 'TOMBSTONED' ? '▲ TOMBSTONED' : `● ${file.status}`}
                          </div>
                        </div>
                      </div>
                      {file.dvFile && (
                        <div className="mt-2 bg-amber-50 border border-amber-200 rounded px-2.5 py-1 text-[11px] font-mono text-amber-900">
                          + Attached Deletion Vector: {file.dvFile}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Live _delta_log JSON inspector */}
                <div className="mt-4">
                  <div className="text-xs font-mono font-semibold text-slate-700 mb-1.5">
                    Inside {currentSnapshot.deltaState.logFile}:
                  </div>
                  <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 text-[11px] font-mono overflow-x-auto leading-relaxed">
                    {currentSnapshot.deltaState.deltaLogJson}
                  </pre>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200 text-xs text-slate-700 leading-relaxed">
              <strong className="text-slate-900">How Delta Lake Handles This: </strong>
              {currentSnapshot.deltaState.engineNote}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Comprehensive Feature Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-900">
            2. Side-by-Side Storage & Table Format Reference Matrix
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct technical comparison between Snowflake Native Storage and Databricks Delta Lake.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-600 bg-slate-50">
                <th className="py-3 px-4">Storage Dimension</th>
                <th className="py-3 px-4 text-sky-800">Snowflake (Micro-Partitions)</th>
                <th className="py-3 px-4 text-orange-800">Databricks (Delta Lake + Liquid)</th>
                <th className="py-3 px-4">What Changes for You?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
              <tr className="hover:bg-slate-50/80">
                <td className="py-3.5 px-4 font-semibold text-slate-900">Underlying File Format</td>
                <td className="py-3.5 px-4 font-mono">Proprietary PAX / FDN (~16MB uncompressed)</td>
                <td className="py-3.5 px-4 font-mono">Open Apache Parquet (128MB – 1GB target)</td>
                <td className="py-3.5 px-4">Delta files live in your cloud bucket and can be read directly by non-Databricks engines.</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-3.5 px-4 font-semibold text-slate-900">Transaction & Stats Metadata</td>
                <td className="py-3.5 px-4">Stored in Snowflake Cloud Services (FoundationDB)</td>
                <td className="py-3.5 px-4">Stored alongside data in <code className="font-mono">_delta_log/*.json</code> & Parquet checkpoints</td>
                <td className="py-3.5 px-4">Delta is self-describing; first 32 columns have min/max stats collected by default.</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-3.5 px-4 font-semibold text-slate-900">UPDATE / DELETE / MERGE Strategy</td>
                <td className="py-3.5 px-4">Copy-on-Write (rewrites entire touched micro-partitions)</td>
                <td className="py-3.5 px-4">Merge-on-Read via <strong>Deletion Vectors</strong> (bitmap marks deleted rows)</td>
                <td className="py-3.5 px-4">Point updates and deletes do not rewrite huge Parquet files on execution—compacted later in background.</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-3.5 px-4 font-semibold text-slate-900">Data Pruning & Clustering</td>
                <td className="py-3.5 px-4"><code className="font-mono">CLUSTER BY (col1, col2)</code> + Automatic Clustering service</td>
                <td className="py-3.5 px-4"><code className="font-mono">CLUSTER BY (col1, col2)</code> (Liquid Clustering) + Predictive Optimization</td>
                <td className="py-3.5 px-4">Identical DDL! Never use legacy <code className="font-mono">PARTITIONED BY</code> or manual <code className="font-mono">ZORDER</code> on new tables.</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-3.5 px-4 font-semibold text-slate-900">Time Travel Retention</td>
                <td className="py-3.5 px-4">1 to 90 days (<code className="font-mono">DATA_RETENTION_TIME_IN_DAYS</code>) + 7d Fail-Safe</td>
                <td className="py-3.5 px-4">Default 30 days log / 7 days deleted file retention (<code className="font-mono">VACUUM</code>)</td>
                <td className="py-3.5 px-4">In Databricks, you can query by integer commit version (<code className="font-mono">VERSION AS OF 12</code>) as well as timestamp.</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="py-3.5 px-4 font-semibold text-slate-900">Apache Iceberg Compatibility</td>
                <td className="py-3.5 px-4">Snowflake Iceberg Tables (External or Managed Iceberg catalog)</td>
                <td className="py-3.5 px-4"><strong>Delta UniForm</strong> (Universal Format) auto-generates Iceberg metadata</td>
                <td className="py-3.5 px-4">Enabling <code className="font-mono">UniversalFormat = iceberg</code> lets Snowflake read Databricks Delta tables natively!</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
