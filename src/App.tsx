/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArchitectureStep } from './components/ArchitectureStep';
import { TableFormatsStep } from './components/TableFormatsStep';
import { SqlSyntaxStep } from './components/SqlSyntaxStep';
import { SystemAiStep } from './components/SystemAiStep';
import { WorkspacePipelinesStep } from './components/WorkspacePipelinesStep';
import { ComputeDeepDiveStep } from './components/ComputeDeepDiveStep';
import { SidebarNavigationStep } from './components/SidebarNavigationStep';
import { MasteryStep } from './components/MasteryStep';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

type StepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface StepMeta {
  num: StepNumber;
  shortLabel: string;
  fullTitle: string;
  subtitle: string;
}

const STEPS: StepMeta[] = [
  {
    num: 1,
    shortLabel: '01. Architecture',
    fullTitle: 'Architecture & Mental Model',
    subtitle: 'Virtual Warehouses vs SQL Warehouses & Unity Catalog'
  },
  {
    num: 2,
    shortLabel: '02. Table Formats',
    fullTitle: 'Table Formats & Internals',
    subtitle: 'Micro-Partitions vs Delta Lake, _delta_log & Liquid Clustering'
  },
  {
    num: 3,
    shortLabel: '03. SQL Syntax',
    fullTitle: 'SQL Dialect & Live Translator',
    subtitle: 'FLATTEN vs EXPLODE, QUALIFY, JSON Paths & Time Travel'
  },
  {
    num: 4,
    shortLabel: '04. system.ai Models',
    fullTitle: 'system.ai & SQL AI Functions',
    subtitle: 'Catalog Foundation Models vs Snowflake Cortex'
  },
  {
    num: 5,
    shortLabel: '05. Workspace & Pipelines',
    fullTitle: 'Workspace UI vs Snowsight & Pipelines',
    subtitle: 'Folders, Genie, Notebooks & Automating Production Jobs'
  },
  {
    num: 6,
    shortLabel: '06. Compute & Lakebase',
    fullTitle: 'Compute: Lakebase, AI Search & Apps',
    subtitle: 'OLTP Postgres (Lakebase), Vector Endpoints & Apps'
  },
  {
    num: 7,
    shortLabel: '07. Sidebar Map',
    fullTitle: 'Sidebar Map: Discover, SQL & AI/ML',
    subtitle: 'Discover vs Marketplace, Genie vs Agents & Shortcuts'
  },
  {
    num: 8,
    shortLabel: '08. Mastery Check',
    fullTitle: 'Scenario Quiz & Cheat Sheet',
    subtitle: 'Architecture Diagnostics & Day-1 Command Reference'
  }
];

export default function App() {
  const [activeStep, setActiveStep] = useState<StepNumber>(7);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const handleCompleteStep = (step: StepNumber) => {
    setCompletedSteps(prev => ({ ...prev, [step]: true }));
    if (step < 8) {
      setActiveStep((step + 1) as StepNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={e => {
            e.preventDefault();
            setActiveStep(1);
          }}
          className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          Snowflake → Databricks Bridge
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-600">
          {[STEPS[0], STEPS[1], STEPS[2], STEPS[5], STEPS[6]].map(s => (
            <button
              key={s.num}
              onClick={() => setActiveStep(s.num)}
              className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
                activeStep === s.num
                  ? 'text-slate-900 font-bold underline underline-offset-8 decoration-2 decoration-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              {s.shortLabel}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveStep(activeStep < 8 ? ((activeStep + 1) as StepNumber) : 1)}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {activeStep < 8 ? `Next: Step 0${activeStep + 1}` : 'Review Step 01'}
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Interactive Step Progression Deck */}
        <section className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
            <div className="text-xs text-slate-500">
              <span className="font-semibold text-slate-800">Guided Step-by-Step Transition Path</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Designed for Experienced Snowflake Engineers</span>
            </div>
            <div className="text-xs font-mono text-slate-600 tabular-nums">
              Progress: {completedCount} of 8 Modules Completed
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {STEPS.map(step => {
              const isCurrent = activeStep === step.num;
              const isDone = !!completedSteps[step.num];

              return (
                <button
                  key={step.num}
                  onClick={() => setActiveStep(step.num)}
                  className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : isDone
                      ? 'bg-emerald-50/50 text-slate-900 border-emerald-200 hover:bg-emerald-50'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={`font-mono font-bold ${isCurrent ? 'text-sky-300' : 'text-slate-500'}`}>
                      STEP 0{step.num}
                    </span>
                    {isDone && (
                      <span className={`flex items-center gap-1 text-[11px] font-semibold ${isCurrent ? 'text-emerald-300' : 'text-emerald-700'}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Done
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold truncate">{step.fullTitle}</div>
                  <div className={`text-[11px] mt-0.5 line-clamp-1 ${isCurrent ? 'text-slate-300' : 'text-slate-500'}`}>
                    {step.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Active Step View */}
        {activeStep === 1 && (
          <ArchitectureStep
            isCompleted={!!completedSteps[1]}
            onCompleteStep={() => handleCompleteStep(1)}
          />
        )}
        {activeStep === 2 && (
          <TableFormatsStep
            isCompleted={!!completedSteps[2]}
            onCompleteStep={() => handleCompleteStep(2)}
          />
        )}
        {activeStep === 3 && (
          <SqlSyntaxStep
            isCompleted={!!completedSteps[3]}
            onCompleteStep={() => handleCompleteStep(3)}
          />
        )}
        {activeStep === 4 && (
          <SystemAiStep
            isCompleted={!!completedSteps[4]}
            onCompleteStep={() => handleCompleteStep(4)}
          />
        )}
        {activeStep === 5 && (
          <WorkspacePipelinesStep
            isCompleted={!!completedSteps[5]}
            onCompleteStep={() => handleCompleteStep(5)}
          />
        )}
        {activeStep === 6 && (
          <ComputeDeepDiveStep
            isCompleted={!!completedSteps[6]}
            onCompleteStep={() => handleCompleteStep(6)}
          />
        )}
        {activeStep === 7 && (
          <SidebarNavigationStep
            isCompleted={!!completedSteps[7]}
            onCompleteStep={() => handleCompleteStep(7)}
          />
        )}
        {activeStep === 8 && (
          <MasteryStep
            isCompleted={!!completedSteps[8]}
            onCompleteStep={() => handleCompleteStep(8)}
          />
        )}

        {/* Bottom Step-by-Step Navigation Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
          <button
            onClick={() => {
              if (activeStep > 1) {
                setActiveStep((activeStep - 1) as StepNumber);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            disabled={activeStep === 1}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
              activeStep === 1
                ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                : 'border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Previous Step
          </button>

          <div className="text-xs text-slate-500 hidden sm:block">
            Currently viewing <strong className="text-slate-900">Step 0{activeStep}: {STEPS[activeStep - 1].fullTitle}</strong>
          </div>

          <button
            onClick={() => {
              if (activeStep < 8) {
                setActiveStep((activeStep + 1) as StepNumber);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                handleCompleteStep(8);
              }
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>
              {activeStep < 8
                ? `Continue to Step 0${activeStep + 1}: ${STEPS[activeStep].fullTitle}`
                : 'Finish & Mark All Complete'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 px-6 mt-12">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Snowflake to Databricks Interactive Field Guide · Architecture, Delta Lake, SQL, system.ai, Pipelines & Compute
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {STEPS.map((s, idx) => (
              <React.Fragment key={s.num}>
                {idx > 0 && <span>·</span>}
                <button onClick={() => setActiveStep(s.num)} className="hover:text-slate-900 cursor-pointer">
                  {s.shortLabel}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
