import React, { useState } from 'react';
import { SQL_TRANSLATION_PATTERNS, SqlTranslationPattern } from '../data/curriculumData';
import { CheckCircle2, Code2, Wand2, Copy, Check, ArrowRightLeft } from 'lucide-react';

interface SqlSyntaxStepProps {
  onCompleteStep: () => void;
  isCompleted: boolean;
}

function translateSnowflakeToDatabricks(inputSql: string): {
  translated: string;
  appliedRules: string[];
} {
  let out = inputSql;
  const rules: string[] = [];

  // 1. LATERAL FLATTEN(INPUT => x) -> LATERAL EXPLODE(x)
  if (/LATERAL\s+FLATTEN\s*\(\s*INPUT\s*=>\s*([^,)]+)(?:\s*,\s*OUTER\s*=>\s*TRUE)?\s*\)\s*(\w+)?/i.test(out)) {
    const isOuter = /OUTER\s*=>\s*TRUE/i.test(out);
    out = out.replace(
      /LATERAL\s+FLATTEN\s*\(\s*INPUT\s*=>\s*([^,)]+)(?:\s*,\s*OUTER\s*=>\s*TRUE)?\s*\)\s*(\w+)?/gi,
      (_, expr, alias) => {
        const fn = isOuter ? 'LATERAL EXPLODE_OUTER' : 'LATERAL EXPLODE';
        const al = alias || 'f';
        return `${fn}(${expr.trim()}) ${al}(value)`;
      }
    );
    rules.push('Converted LATERAL FLATTEN(INPUT => ...) to LATERAL EXPLODE(...) alias(value)');
  }

  // 2. AT(TIMESTAMP => ...) or AT(OFFSET => ...)
  if (/\bAT\s*\(\s*TIMESTAMP\s*=>\s*([^)]+)\)/i.test(out)) {
    out = out.replace(/\bAT\s*\(\s*TIMESTAMP\s*=>\s*([^)]+)\)/gi, 'TIMESTAMP AS OF $1');
    rules.push('Converted Snowflake AT(TIMESTAMP => ...) to Delta TIMESTAMP AS OF ...');
  }
  if (/\bAT\s*\(\s*OFFSET\s*=>\s*([^)]+)\)/i.test(out)) {
    out = out.replace(
      /\bAT\s*\(\s*OFFSET\s*=>\s*([^)]+)\)/gi,
      'VERSION AS OF /* specify commit version or TIMESTAMP AS OF */'
    );
    rules.push('Converted AT(OFFSET => ...) to Delta VERSION AS OF / TIMESTAMP AS OF');
  }

  // 3. CREATE TABLE ... CLONE -> SHALLOW CLONE
  if (/CREATE\s+(?:OR\s+REPLACE\s+)?TABLE\s+([^\s]+)\s+CLONE\s+([^\s;]+)/i.test(out)) {
    out = out.replace(
      /CREATE\s+(OR\s+REPLACE\s+)?TABLE\s+([^\s]+)\s+CLONE\s+([^\s;]+)/gi,
      'CREATE $1TABLE $2 SHALLOW CLONE $3'
    );
    rules.push('Converted CLONE to Delta SHALLOW CLONE (metadata-only zero-copy clone)');
  }

  // 4. TO_CHAR(ts, 'YYYY-MM-DD...') -> DATE_FORMAT(ts, 'yyyy-MM-dd...')
  if (/\bTO_CHAR\s*\(\s*([^,]+),\s*'([^']+)'\s*\)/i.test(out)) {
    out = out.replace(/\bTO_CHAR\s*\(\s*([^,]+),\s*'([^']+)'\s*\)/gi, (_, col, fmt) => {
      const sparkFmt = fmt
        .replace(/YYYY/g, 'yyyy')
        .replace(/DD/g, 'dd')
        .replace(/HH24/g, 'HH')
        .replace(/MI/g, 'mm')
        .replace(/SS/g, 'ss');
      return `DATE_FORMAT(${col}, '${sparkFmt}')`;
    });
    rules.push('Converted TO_CHAR() date format tokens (YYYY-MM-DD HH24:MI) to DATE_FORMAT() (yyyy-MM-dd HH:mm)');
  }

  // 5. AUTOINCREMENT / IDENTITY(1,1) -> GENERATED ALWAYS AS IDENTITY
  if (/\b(AUTOINCREMENT|IDENTITY\s*\(\s*\d+\s*,\s*\d+\s*\))/i.test(out)) {
    out = out.replace(
      /\b(AUTOINCREMENT|IDENTITY\s*\(\s*\d+\s*,\s*\d+\s*\))/gi,
      'GENERATED ALWAYS AS IDENTITY'
    );
    rules.push('Converted Snowflake AUTOINCREMENT / IDENTITY(1,1) to ANSI GENERATED ALWAYS AS IDENTITY');
  }

  // 6. NUMBER(p,s) or NUMBER -> DECIMAL or BIGINT note
  if (/\bNUMBER\b(?!\s*\()/i.test(out)) {
    out = out.replace(/\bNUMBER\b(?!\s*\()/gi, 'DECIMAL(38, 10)');
    rules.push('Replaced bare Snowflake NUMBER with explicit DECIMAL(38, 10) (or use BIGINT for integers)');
  }

  // 7. Confirm native support for QUALIFY, IFF, NVL, DATEADD, colon JSON
  if (/\bQUALIFY\b/i.test(out)) {
    rules.push('Kept QUALIFY clause as-is (natively supported in Databricks SQL)');
  }
  if (/\b(IFF|NVL)\s*\(/i.test(out)) {
    rules.push('Kept IFF() / NVL() as-is (natively supported in Databricks SQL)');
  }
  if (/\bDATEADD\s*\(/i.test(out)) {
    rules.push('Kept 3-argument DATEADD(unit, val, expr) as-is (natively supported in Databricks SQL)');
  }
  if (/:[a-zA-Z_][\w.]*::/i.test(out)) {
    rules.push('Kept Snowflake colon path extraction col:field::TYPE (natively supported in Databricks SQL)');
  }

  if (rules.length === 0) {
    rules.push('Query is already 100% compatible with Databricks SQL (ANSI + Photon compatibility).');
  }

  return { translated: out, appliedRules: rules };
}

export const SqlSyntaxStep: React.FC<SqlSyntaxStepProps> = ({
  onCompleteStep,
  isCompleted
}) => {
  const [selectedPatternId, setSelectedPatternId] = useState<string>(SQL_TRANSLATION_PATTERNS[0].id);
  const [copiedSide, setCopiedSide] = useState<'sf' | 'dbx' | null>(null);

  const [customSnowflakeSql, setCustomSnowflakeSql] = useState<string>(
    `SELECT
  o.order_id,
  TO_CHAR(o.order_ts, 'YYYY-MM-DD HH24:MI') AS order_time,
  NVL(o.payload:customer.tier::STRING, 'STANDARD') AS tier,
  f.value:sku::STRING AS item_sku
FROM sales_db.core.orders AT(TIMESTAMP => '2026-11-01 00:00:00'::TIMESTAMP) o,
LATERAL FLATTEN(INPUT => o.items, OUTER => TRUE) f
QUALIFY ROW_NUMBER() OVER (PARTITION BY o.order_id ORDER BY o.order_ts DESC) = 1;`
  );

  const selectedPattern: SqlTranslationPattern =
    SQL_TRANSLATION_PATTERNS.find(p => p.id === selectedPatternId) || SQL_TRANSLATION_PATTERNS[0];

  const liveTranslation = translateSnowflakeToDatabricks(customSnowflakeSql);

  const handleCopy = (text: string, side: 'sf' | 'dbx') => {
    navigator.clipboard.writeText(text);
    setCopiedSide(side);
    setTimeout(() => setCopiedSide(null), 1800);
  };

  return (
    <div className="space-y-8">
      {/* Module Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="text-xs font-medium text-slate-500 mb-1">
              <span>Step 03 of 04</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Dialect & Functions</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Snowflake SQL vs Databricks SQL</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              SQL Syntax Comparison & Live Query Translator
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
              {isCompleted ? 'Step 3 Completed — Next: Mastery Check' : 'Mark Step 3 Complete & Continue'}
            </button>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600 leading-relaxed max-w-4xl">
          Here is the biggest surprise for seasoned Snowflake engineers: **roughly 85% of your Snowflake SQL runs in modern Databricks SQL without modification**. Features that used to require Spark SQL workarounds—like `QUALIFY`, `IFF`, `NVL`, `ILIKE`, 3-argument `DATEADD(day, -7, ts)`, and even `col:json_path::STRING` colon notation—are now natively built into Databricks SQL. Below are the exact patterns that stay identical and the few (`LATERAL FLATTEN`, `AT(TIMESTAMP)`, `TO_CHAR`) that require translation.
        </p>
      </div>

      {/* Section 1: Curated Side-by-Side Pattern Explorer */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="pb-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">
            1. Interactive SQL Pattern Cookbook (6 Core Scenarios)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Select a SQL category below to inspect side-by-side Snowflake vs Databricks queries, syntax diffs, and sample result sets.
          </p>

          {/* Pattern Tabs */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {SQL_TRANSLATION_PATTERNS.map(pattern => (
              <button
                key={pattern.id}
                onClick={() => setSelectedPatternId(pattern.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedPatternId === pattern.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {pattern.category}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Pattern Header */}
        <div className="mt-5 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <div className="text-xs text-slate-500">
              <span>{selectedPattern.category}</span>
              <span className="mx-2">·</span>
              <span className="font-semibold text-slate-800">
                Compatibility: {selectedPattern.similarityScore}
              </span>
            </div>
            <h4 className="text-base font-bold text-slate-900 mt-0.5">{selectedPattern.title}</h4>
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">{selectedPattern.summary}</p>

        {/* Side-by-Side Code Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          {/* Snowflake SQL Pane */}
          <div className="bg-slate-900 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-mono font-bold text-sky-300">
                    Snowflake SQL
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(selectedPattern.snowflakeSql, 'sf')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedSide === 'sf' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSide === 'sf' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="text-xs font-mono text-slate-100 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                {selectedPattern.snowflakeSql}
              </pre>
            </div>
          </div>

          {/* Databricks SQL Pane */}
          <div className="bg-slate-900 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-mono font-bold text-orange-300">
                    Databricks SQL (Photon / Unity Catalog)
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(selectedPattern.databricksSql, 'dbx')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedSide === 'dbx' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSide === 'dbx' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="text-xs font-mono text-slate-100 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                {selectedPattern.databricksSql}
              </pre>
            </div>
          </div>
        </div>

        {/* Key Line-by-Line Translation Notes + Sample Output */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          <div className="lg:col-span-7">
            <h5 className="text-xs font-bold text-slate-900 mb-2.5">
              Syntax Breakdown & Nuances
            </h5>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="py-2.5 px-3 font-semibold">Feature</th>
                    <th className="py-2.5 px-3 font-semibold text-sky-800">Snowflake</th>
                    <th className="py-2.5 px-3 font-semibold text-orange-800">Databricks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {selectedPattern.lineNotes.map((note, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{note.aspect}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">{note.snowflakeWay}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">{note.databricksWay}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-5">
            <h5 className="text-xs font-bold text-slate-900 mb-2.5">
              Simulated Query Output Preview
            </h5>
            <div className="border border-slate-200 rounded-xl overflow-x-auto bg-slate-50">
              <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 text-slate-700">
                    {selectedPattern.sampleOutput.columns.map(col => (
                      <th key={col} className="py-2 px-3 font-semibold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {selectedPattern.sampleOutput.rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="py-2 px-3 truncate max-w-[180px]">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Interactive Live Snowflake-to-Databricks SQL Transpiler */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-sky-700" />
              <h3 className="text-lg font-bold text-slate-900">
                2. Interactive Snowflake-to-Databricks SQL Sandbox
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Edit or paste any Snowflake SQL query on the left to test how idioms like <code className="font-mono">LATERAL FLATTEN</code>, <code className="font-mono">TO_CHAR</code>, <code className="font-mono">AT(TIMESTAMP)</code>, and <code className="font-mono">CLONE</code> convert to Databricks SQL.
            </p>
          </div>
          <button
            onClick={() =>
              setCustomSnowflakeSql(`CREATE OR REPLACE TABLE dev_sandbox.orders_backup CLONE prod.core.orders;\n\nSELECT\n  o.order_id,\n  TO_CHAR(o.created_at, 'YYYY-MM-DD HH24:MI') AS created_fmt,\n  f.value:product_id::STRING AS product_id\nFROM prod.core.orders AT(TIMESTAMP => '2026-11-01 00:00:00') o,\nLATERAL FLATTEN(INPUT => o.items, OUTER => TRUE) f\nQUALIFY ROW_NUMBER() OVER (PARTITION BY o.order_id ORDER BY o.created_at DESC) = 1;`)
            }
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Load Multi-Statement Example
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-5">
          {/* Editable Snowflake Input */}
          <div>
            <label className="block text-xs font-bold text-sky-800 mb-2">
              Input: Snowflake SQL (Editable)
            </label>
            <textarea
              value={customSnowflakeSql}
              onChange={e => setCustomSnowflakeSql(e.target.value)}
              rows={9}
              className="w-full bg-slate-900 text-slate-100 font-mono text-xs rounded-xl p-4 border border-slate-700 focus:outline-none focus:border-sky-500 leading-relaxed"
              placeholder="Paste Snowflake SQL here..."
            />
          </div>

          {/* Live Transpiled Databricks Output */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-orange-800 flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Output: Equivalent Databricks SQL
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Real-time rule transpiler
              </span>
            </div>
            <pre className="w-full h-[210px] bg-slate-900 text-emerald-300 font-mono text-xs rounded-xl p-4 border border-slate-800 overflow-y-auto leading-relaxed whitespace-pre-wrap">
              {liveTranslation.translated}
            </pre>
          </div>
        </div>

        {/* Transformation Audit Log */}
        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-bold text-slate-800 mb-2">
            Translation Rules & Compatibility Analysis Applied:
          </div>
          <ul className="space-y-1.5 text-xs text-slate-700">
            {liveTranslation.appliedRules.map((rule, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="font-mono text-emerald-700 font-bold">✓</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
