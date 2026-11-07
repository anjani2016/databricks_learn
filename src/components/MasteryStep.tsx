import React, { useState } from 'react';
import { QUIZ_QUESTIONS } from '../data/curriculumData';
import { CheckCircle2, HelpCircle, RotateCcw, Search, CheckSquare, Square } from 'lucide-react';

interface MasteryStepProps {
  onCompleteStep: () => void;
  isCompleted: boolean;
}

interface CheatSheetItem {
  category: string;
  task: string;
  snowflakeCmd: string;
  databricksCmd: string;
}

const CHEAT_SHEET_ITEMS: CheatSheetItem[] = [
  {
    category: 'Context & Catalog',
    task: 'Switch active database / catalog',
    snowflakeCmd: 'USE DATABASE prod_analytics;',
    databricksCmd: 'USE CATALOG prod_analytics;'
  },
  {
    category: 'Context & Catalog',
    task: 'Switch active schema',
    snowflakeCmd: 'USE SCHEMA core;',
    databricksCmd: 'USE SCHEMA core;'
  },
  {
    category: 'DDL & Clustering',
    task: 'Define multi-column clustering',
    snowflakeCmd: 'ALTER TABLE events CLUSTER BY (dt, org_id);',
    databricksCmd: 'ALTER TABLE events CLUSTER BY (dt, org_id);'
  },
  {
    category: 'DDL & Clustering',
    task: 'Inspect table metadata & columns',
    snowflakeCmd: 'DESCRIBE TABLE core.events;',
    databricksCmd: 'DESCRIBE TABLE EXTENDED core.events;'
  },
  {
    category: 'DDL & Clustering',
    task: 'View commit / transaction history',
    snowflakeCmd: 'SELECT * FROM TABLE(INFORMATION_SCHEMA.QUERY_HISTORY());',
    databricksCmd: 'DESCRIBE HISTORY core.events;'
  },
  {
    category: 'Time Travel & Clone',
    task: 'Query table at historical point',
    snowflakeCmd: "SELECT * FROM tbl AT(TIMESTAMP => '2026-11-01'::TIMESTAMP);",
    databricksCmd: "SELECT * FROM tbl TIMESTAMP AS OF '2026-11-01';"
  },
  {
    category: 'Time Travel & Clone',
    task: 'Instant metadata zero-copy clone',
    snowflakeCmd: 'CREATE TABLE dev.tbl CLONE prod.tbl;',
    databricksCmd: 'CREATE TABLE dev.tbl SHALLOW CLONE prod.tbl;'
  },
  {
    category: 'Semi-Structured & Arrays',
    task: 'Extract nested JSON string key',
    snowflakeCmd: 'SELECT col:user.id::STRING FROM tbl;',
    databricksCmd: 'SELECT col:user.id::STRING FROM tbl;'
  },
  {
    category: 'Semi-Structured & Arrays',
    task: 'Unnest array into rows',
    snowflakeCmd: 'FROM tbl, LATERAL FLATTEN(INPUT => tbl.arr) f',
    databricksCmd: 'FROM tbl, LATERAL EXPLODE(tbl.arr) f(value)'
  },
  {
    category: 'Ingestion & Files',
    task: 'Load files from stage / volume',
    snowflakeCmd: 'COPY INTO tbl FROM @my_stage/path/ FILE_FORMAT=(TYPE=PARQUET);',
    databricksCmd: "COPY INTO tbl FROM '/Volumes/cat/sch/vol/path/' FILEFORMAT = PARQUET;"
  }
];

export const MasteryStep: React.FC<MasteryStepProps> = ({
  onCompleteStep,
  isCompleted
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [checklist, setChecklist] = useState<Record<number, boolean>>({
    0: true,
    1: false,
    2: false,
    3: false,
    4: false
  });

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const correctCount = QUIZ_QUESTIONS.filter(q => {
    const picked = selectedAnswers[q.id];
    const opt = q.options.find(o => o.id === picked);
    return opt?.isCorrect;
  }).length;

  const filteredCheatSheet = CHEAT_SHEET_ITEMS.filter(
    item =>
      item.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.snowflakeCmd.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.databricksCmd.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const checklistItems = [
    'Use Serverless SQL Warehouses (not All-Purpose Spark clusters) for BI, dbt, and SQL workloads',
    'Create all new tables in Unity Catalog (catalog.schema.table), never legacy hive_metastore',
    'Use Liquid Clustering (CLUSTER BY) instead of legacy Hive PARTITIONED BY or manual ZORDER',
    'Use Unity Catalog Volumes (/Volumes/catalog/schema/vol) wherever you used Snowflake @Stages',
    'Keep using QUALIFY, IFF, NVL, DATEADD, and col:json_path::TYPE—they work natively in Databricks SQL'
  ];

  return (
    <div className="space-y-8">
      {/* Module Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="text-xs font-medium text-slate-500 mb-1">
              <span>Step 08 of 08</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Verification & Quick Reference</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Day-1 Readiness</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Architecture & SQL Mastery Check + Day-1 Cheat Sheet
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
              {isCompleted ? 'All 8 Steps Completed!' : 'Complete Step 8'}
            </button>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600 leading-relaxed max-w-4xl">
          Test your intuition across 4 real-world architectural scenarios below, and use the searchable command cheat sheet whenever you write queries or DDL in Databricks.
        </p>
      </div>

      {/* Section 1: Interactive Scenario Quiz */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              1. Interactive Scenario Diagnostic (4 Questions)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select the best Databricks design decision for each Snowflake scenario.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-slate-800 tabular-nums">
              Score: {correctCount} / {QUIZ_QUESTIONS.length} Correct
            </span>
            <button
              onClick={() => setSelectedAnswers({})}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Quiz
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {QUIZ_QUESTIONS.map((q, index) => {
            const pickedId = selectedAnswers[q.id];
            const pickedOption = q.options.find(o => o.id === pickedId);

            return (
              <div
                key={q.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-semibold text-slate-700">
                      0{index + 1}. {q.scenario}
                    </span>
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                  </div>

                  <div className="bg-sky-50 border border-sky-200/80 rounded-lg p-3 text-xs text-sky-950 mb-3">
                    <strong className="font-semibold text-sky-800">Snowflake Baseline: </strong>
                    {q.snowflakeContext}
                  </div>

                  <p className="text-sm font-bold text-slate-900 mb-3">{q.question}</p>

                  <div className="space-y-2">
                    {q.options.map(opt => {
                      const isSelected = pickedId === opt.id;
                      let btnStyle = 'bg-white border-slate-200 text-slate-800 hover:border-slate-300';
                      if (isSelected) {
                        btnStyle = opt.isCorrect
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold'
                          : 'bg-rose-50 border-rose-400 text-rose-950 font-semibold';
                      }

                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelectOption(q.id, opt.id)}
                          className={`w-full text-left p-3 rounded-lg border text-xs transition-all cursor-pointer ${btnStyle}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span>{opt.label}</span>
                            {isSelected && (
                              <span className="font-mono text-[11px] shrink-0">
                                {opt.isCorrect ? '✓ CORRECT' : '✕ RETRY'}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {pickedOption && (
                  <div
                    className={`mt-4 p-3 rounded-lg text-xs leading-relaxed border ${
                      pickedOption.isCorrect
                        ? 'bg-emerald-100/60 border-emerald-200 text-emerald-950'
                        : 'bg-amber-50 border-amber-200 text-amber-950'
                    }`}
                  >
                    <strong>Explanation: </strong>
                    {pickedOption.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Day-1 Golden Rules Checklist & Command Cheat Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Golden Rules Checklist (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-base font-bold text-slate-900">
            2. Your Day-1 Databricks Golden Rules
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Check off these 5 modern best practices to avoid outdated 2019 Spark tutorials:
          </p>

          <div className="space-y-2.5">
            {checklistItems.map((item, idx) => {
              const checked = !!checklist[idx];
              return (
                <button
                  key={idx}
                  onClick={() => setChecklist(prev => ({ ...prev, [idx]: !prev[idx] }))}
                  className={`w-full text-left p-3 rounded-xl border text-xs flex items-start gap-3 transition-colors cursor-pointer ${
                    checked
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {checked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{item}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Searchable Side-by-Side Command Reference (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                3. Side-by-Side CLI & SQL Command Reference
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Filter common administrative and query commands across both platforms.
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter commands (e.g. clone, history)..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 w-full sm:w-56"
              />
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 bg-slate-50">
                  <th className="py-2.5 px-3 font-semibold">Operation</th>
                  <th className="py-2.5 px-3 font-semibold text-sky-800">Snowflake Command</th>
                  <th className="py-2.5 px-3 font-semibold text-orange-800">Databricks Command</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCheatSheet.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-medium text-slate-900">{row.task}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">{row.snowflakeCmd}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-900 font-semibold">{row.databricksCmd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
