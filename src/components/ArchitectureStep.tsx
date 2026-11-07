import React, { useState } from 'react';
import { CONCEPT_EQUIVALENCES, ConceptEquivalence } from '../data/curriculumData';
import { ArrowRight, CheckCircle2, Layers, Cpu, HardDrive, ShieldCheck, Info } from 'lucide-react';

interface ArchitectureStepProps {
  onCompleteStep: () => void;
  isCompleted: boolean;
}

type LayerKey = 'governance' | 'compute' | 'storage';

interface LayerDetail {
  title: string;
  snowflakeTitle: string;
  snowflakeArchitecture: string[];
  databricksTitle: string;
  databricksArchitecture: string[];
  bridgeTakeaway: string;
}

const LAYER_DETAILS: Record<LayerKey, LayerDetail> = {
  governance: {
    title: 'Layer 1: Control Plane, Catalog & Governance',
    snowflakeTitle: 'Cloud Services Layer (ANSI RBAC + FoundationDB)',
    snowflakeArchitecture: [
      'Account > Database > Schema > Table/View hierarchy',
      'Centralized query optimizer, authentication, and transaction manager',
      'Proprietary metadata dictionary locked inside Snowflake Cloud Services',
      'Row Access Policies & Dynamic Data Masking tied to Snowflake Roles'
    ],
    databricksTitle: 'Control Plane + Unity Catalog',
    databricksArchitecture: [
      'Metastore > Catalog > Schema > Table/Volume/Model (identical 3-level namespace!)',
      'Centralized governance across Tables, Files (Volumes), and ML Models',
      'Automated column-level lineage across SQL queries, notebooks, and workflows',
      'Row Filters & Column Masks written in standard SQL functions'
    ],
    bridgeTakeaway:
      'Mental Translation: A Databricks "Catalog" in Unity Catalog is your Snowflake "Database". Both use exact 3-part dot notation: catalog.schema.table.'
  },
  compute: {
    title: 'Layer 2: Compute & Execution Engine',
    snowflakeTitle: 'Virtual Warehouses (Stateless SQL MPP)',
    snowflakeArchitecture: [
      'T-shirt sized (XS to 6XL) isolated compute clusters',
      'Vectorized C++ execution engine with local NVMe SSD caching',
      'Multi-cluster auto-scaling for concurrent BI query spikes',
      'Snowpark container services / sandbox for Python execution'
    ],
    databricksTitle: 'Serverless SQL Warehouses (Photon) + Spark Clusters',
    databricksArchitecture: [
      'Serverless SQL Warehouses: T-shirt sized (2X-Small to 4X-Large), instant 2s startup',
      'Photon Engine: Native vectorized C++ engine engineered specifically for SQL & DataFrame speed',
      'Local NVMe SSD Delta Cache accelerates repeated reads just like Snowflake Warehouse cache',
      'All-Purpose / Job Compute: Dedicated clusters when you need distributed PySpark or GPUs'
    ],
    bridgeTakeaway:
      'Mental Translation: When doing SQL, BI, or dbt in Databricks, ALWAYS pick a "Serverless SQL Warehouse". It behaves identically to a Snowflake Virtual Warehouse.'
  },
  storage: {
    title: 'Layer 3: Physical Cloud Storage & File Access',
    snowflakeTitle: 'Snowflake Managed Internal Storage',
    snowflakeArchitecture: [
      'Data stored in Snowflake-owned S3 / Azure Blob / GCS buckets',
      'Proprietary PAX hybrid columnar micro-partitions (~16MB uncompressed)',
      'Accessible only through Snowflake compute endpoints (or Iceberg tables)',
      'Internal/External Stages (@stage) used for raw file landing'
    ],
    databricksTitle: 'Customer Cloud Object Storage (Delta Lake / Iceberg)',
    databricksArchitecture: [
      'Data stored in YOUR cloud bucket in open Apache Parquet format + _delta_log',
      'Unity Catalog Managed Tables automate file layout, compaction, and vacuuming',
      'Zero vendor lock-in: readable by Spark, Trino, DuckDB, Polars, or Snowflake via UniForm',
      'Unity Catalog Volumes (/Volumes/cat/sch/vol/) replace Snowflake @Stages for raw files'
    ],
    bridgeTakeaway:
      'Mental Translation: You do not need to manage S3 paths manually in Databricks anymore. Create standard Managed Tables (`CREATE TABLE cat.sch.tbl`) and let Unity Catalog manage paths automatically.'
  }
};

export const ArchitectureStep: React.FC<ArchitectureStepProps> = ({
  onCompleteStep,
  isCompleted
}) => {
  const [activeLayer, setActiveLayer] = useState<LayerKey>('compute');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeCardId, setActiveCardId] = useState<string>('compute');

  const categories = ['All', 'Architecture', 'Governance', 'Ingestion & Pipelines', 'Storage & Pruning'];

  const filteredConcepts = selectedCategory === 'All'
    ? CONCEPT_EQUIVALENCES
    : CONCEPT_EQUIVALENCES.filter(c => c.category === selectedCategory);

  const selectedConcept: ConceptEquivalence =
    CONCEPT_EQUIVALENCES.find(c => c.id === activeCardId) || CONCEPT_EQUIVALENCES[0];

  const currentLayer = LAYER_DETAILS[activeLayer];

  return (
    <div className="space-y-8">
      {/* Module Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="text-xs font-medium text-slate-500 mb-1">
              <span>Step 01 of 04</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Mental Model Mapping</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Cloud Data Warehouse vs Lakehouse</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Architecture: Mapping Your Snowflake Mental Model to Databricks
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
              {isCompleted ? 'Step 1 Completed — Next: Table Formats' : 'Mark Step 1 Complete & Continue'}
            </button>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600 leading-relaxed max-w-4xl">
          Because you already know Snowflake well, you already understand **decoupled storage and compute**, **3-level namespaces**, and **vectorized execution**. Historically, Databricks required configuring Spark JVM clusters and S3 bucket paths manually. Modern Databricks (with **Unity Catalog** and **Serverless SQL Warehouses**) converges on the exact same frictionless experience while keeping your data in open formats.
        </p>
      </div>

      {/* Interactive 3-Layer Stack Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Interactive Architectural Stack Selector (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">
                1. Click an Architectural Layer to Compare
              </h3>
              <span className="text-xs text-slate-500">3 Decoupled Tiers</span>
            </div>

            <div className="space-y-3">
              {/* Layer 1 Button */}
              <button
                onClick={() => setActiveLayer('governance')}
                className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  activeLayer === 'governance'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className={`w-5 h-5 ${activeLayer === 'governance' ? 'text-sky-400' : 'text-slate-600'}`} />
                    <span className="font-semibold text-sm">1. Governance & Metadata Plane</span>
                  </div>
                  <span className={`text-xs font-mono ${activeLayer === 'governance' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Catalog & RBAC
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/20">
                  <div>
                    <span className={activeLayer === 'governance' ? 'text-sky-300' : 'text-sky-700 font-medium'}>
                      Snowflake:
                    </span>{' '}
                    Cloud Services
                  </div>
                  <div>
                    <span className={activeLayer === 'governance' ? 'text-orange-300' : 'text-orange-700 font-medium'}>
                      Databricks:
                    </span>{' '}
                    Unity Catalog
                  </div>
                </div>
              </button>

              {/* Layer 2 Button */}
              <button
                onClick={() => setActiveLayer('compute')}
                className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  activeLayer === 'compute'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Cpu className={`w-5 h-5 ${activeLayer === 'compute' ? 'text-sky-400' : 'text-slate-600'}`} />
                    <span className="font-semibold text-sm">2. Compute & Execution Layer</span>
                  </div>
                  <span className={`text-xs font-mono ${activeLayer === 'compute' ? 'text-slate-300' : 'text-slate-500'}`}>
                    MPP vs Photon
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/20">
                  <div>
                    <span className={activeLayer === 'compute' ? 'text-sky-300' : 'text-sky-700 font-medium'}>
                      Snowflake:
                    </span>{' '}
                    Virtual Warehouse
                  </div>
                  <div>
                    <span className={activeLayer === 'compute' ? 'text-orange-300' : 'text-orange-700 font-medium'}>
                      Databricks:
                    </span>{' '}
                    SQL Warehouse
                  </div>
                </div>
              </button>

              {/* Layer 3 Button */}
              <button
                onClick={() => setActiveLayer('storage')}
                className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  activeLayer === 'storage'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <HardDrive className={`w-5 h-5 ${activeLayer === 'storage' ? 'text-sky-400' : 'text-slate-600'}`} />
                    <span className="font-semibold text-sm">3. Cloud Storage Layer</span>
                  </div>
                  <span className={`text-xs font-mono ${activeLayer === 'storage' ? 'text-slate-300' : 'text-slate-500'}`}>
                    S3 / ADLS / GCS
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/20">
                  <div>
                    <span className={activeLayer === 'storage' ? 'text-sky-300' : 'text-sky-700 font-medium'}>
                      Snowflake:
                    </span>{' '}
                    Micro-partitions
                  </div>
                  <div>
                    <span className={activeLayer === 'storage' ? 'text-orange-300' : 'text-orange-700 font-medium'}>
                      Databricks:
                    </span>{' '}
                    Delta Lake (Parquet)
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-600 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span>
              <strong>Key Convergence Note:</strong> Both platforms now support Apache Iceberg metadata (Snowflake Iceberg Tables & Databricks Delta UniForm), meaning both engines can read the same underlying Parquet files without copying data.
            </span>
          </div>
        </div>

        {/* Right Column: Side-by-Side Layer Inspection (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <span className="text-xs font-medium text-slate-500">Selected Architecture Tier</span>
                <h3 className="text-lg font-bold text-slate-900">{currentLayer.title}</h3>
              </div>
              <Layers className="w-5 h-5 text-slate-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Snowflake Box */}
              <div className="bg-sky-50/50 border border-sky-200/80 rounded-xl p-4">
                <div className="text-xs font-bold text-sky-800 mb-1">
                  Snowflake (What You Know)
                </div>
                <div className="text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-sky-200/60">
                  {currentLayer.snowflakeTitle}
                </div>
                <ul className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
                  {currentLayer.snowflakeArchitecture.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="font-mono text-sky-700 font-bold">0{i + 1}.</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Databricks Box */}
              <div className="bg-orange-50/50 border border-orange-200/80 rounded-xl p-4">
                <div className="text-xs font-bold text-orange-800 mb-1">
                  Databricks (Your New Equivalent)
                </div>
                <div className="text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-orange-200/60">
                  {currentLayer.databricksTitle}
                </div>
                <ul className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
                  {currentLayer.databricksArchitecture.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="font-mono text-orange-700 font-bold">0{i + 1}.</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-slate-900 text-slate-100 rounded-xl p-4">
            <div className="text-xs font-semibold text-amber-300 mb-1">
              Snowflake Engineer Takeaway
            </div>
            <p className="text-xs leading-relaxed text-slate-200">
              {currentLayer.bridgeTakeaway}
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Interactive Rosetta Stone Concept Mapper */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              2. Snowflake-to-Databricks Rosetta Stone (Concept & Object Dictionary)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any Snowflake object below to see its exact Databricks counterpart, architectural nuance, and code comparison.
            </p>
          </div>

          {/* Interactive Filter Controls */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCategory === category
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Concept List Table (6 cols) */}
          <div className="lg:col-span-6 space-y-2.5">
            {filteredConcepts.map(concept => {
              const isSelected = concept.id === selectedConcept.id;
              return (
                <button
                  key={concept.id}
                  onClick={() => setActiveCardId(concept.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="text-xs text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>{concept.category}</span>
                    <span className="font-mono text-[11px]">Click to inspect</span>
                  </div>
                  <div className="grid grid-cols-11 items-center gap-2">
                    <div className="col-span-5">
                      <div className={`text-xs font-semibold ${isSelected ? 'text-sky-300' : 'text-sky-700'}`}>
                        Snowflake
                      </div>
                      <div className="text-sm font-bold leading-snug mt-0.5">
                        {concept.snowflakeTerm}
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`} />
                    </div>
                    <div className="col-span-5">
                      <div className={`text-xs font-semibold ${isSelected ? 'text-orange-300' : 'text-orange-700'}`}>
                        Databricks
                      </div>
                      <div className="text-sm font-bold leading-snug mt-0.5">
                        {concept.databricksTerm}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Concept Deep-Dive Inspector (6 cols) */}
          <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="text-xs text-slate-500 mb-2">
                <span>Selected Equivalence</span>
                <span className="mx-2">·</span>
                <span>{selectedConcept.category}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 border-b border-slate-200">
                <div>
                  <span className="text-xs font-bold text-sky-700">Snowflake Term</span>
                  <h4 className="text-base font-bold text-slate-900 mt-0.5">{selectedConcept.snowflakeTerm}</h4>
                  <p className="text-xs text-slate-600 mt-1">{selectedConcept.snowflakeSub}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-orange-700">Databricks Equivalent</span>
                  <h4 className="text-base font-bold text-slate-900 mt-0.5">{selectedConcept.databricksTerm}</h4>
                  <p className="text-xs text-slate-600 mt-1">{selectedConcept.databricksSub}</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <h5 className="text-xs font-bold text-slate-900">
                    How to Shift Your Mental Model
                  </h5>
                  <p className="text-sm text-slate-700 leading-relaxed mt-1">
                    {selectedConcept.mentalShift}
                  </p>
                </div>

                <div className="bg-amber-50/90 border border-amber-200 rounded-lg p-3.5">
                  <h5 className="text-xs font-bold text-amber-900">
                    Important Architectural Gotcha
                  </h5>
                  <p className="text-xs text-amber-800 leading-relaxed mt-1">
                    {selectedConcept.gotcha}
                  </p>
                </div>

                {selectedConcept.codeExample && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-900 rounded-lg p-3">
                      <div className="text-[11px] font-mono text-sky-300 mb-1.5">Snowflake SQL</div>
                      <pre className="text-xs font-mono text-slate-100 overflow-x-auto whitespace-pre-wrap">
                        {selectedConcept.codeExample.snowflake}
                      </pre>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-3">
                      <div className="text-[11px] font-mono text-orange-300 mb-1.5">Databricks SQL</div>
                      <pre className="text-xs font-mono text-slate-100 overflow-x-auto whitespace-pre-wrap">
                        {selectedConcept.codeExample.databricks}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
