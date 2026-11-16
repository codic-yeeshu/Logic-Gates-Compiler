import { useRef, useState } from "react";
import { Editor } from "./Editor";
import {
  TokenView,
  ASTView,
  SymbolView,
  IRView,
  OptimizationView,
  TruthTable,
} from "./PhaseViews";
import { Circuit, download } from "./Circuit";
import { examples } from "./examples";
import type { Compilation, PhaseName, Span } from "./types";
const phases: [PhaseName, string, string][] = [
  ["lexical", "Lexical analysis", "Tokens"],
  ["syntax", "Syntax analysis", "Abstract syntax tree"],
  ["semantic", "Semantic analysis", "Symbols & dependencies"],
  ["ir", "Intermediate code", "Three-address instructions"],
  ["optimization", "Optimization", "Simplification & sharing"],
  ["codegen", "Code generation", "Verilog & gate circuit"],
  ["simulation", "Simulation", "Truth table"],
];
const api = (import.meta as any).env.VITE_API_URL || "http://127.0.0.1:8000";
export default function App() {
  const [source, setSource] = useState(examples.Introduction),
    [optimization, setOptimization] = useState(true),
    [result, setResult] = useState<Compilation | null>(null),
    [active, setActive] = useState<PhaseName>("lexical"),
    [tab, setTab] = useState("Output"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [selection, setSelection] = useState<Span | null>(null),
    [compiled, setCompiled] = useState(""),
    [compiledOpt, setCompiledOpt] = useState(true),
    [editorWidth, setEditorWidth] = useState(40);
  const request = useRef(0);
  const abort = useRef<AbortController | null>(null);
  const stale =
    !!result && (compiled !== source || compiledOpt !== optimization);
  function edit(value: string) {
    request.current++;
    abort.current?.abort();
    setBusy(false);
    setSource(value);
  }
  async function compile() {
    const id = ++request.current;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(api + "/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, optimization }),
        signal: controller.signal,
      });
      if (!response.ok) throw Error("API returned HTTP " + response.status);
      const data: Compilation = await response.json();
      if (id !== request.current) return;
      setResult(data);
      setCompiled(source);
      setCompiledOpt(optimization);
      if (!data.success) {
        setActive(data.diagnostics[0].phase as PhaseName);
        setTab("Output");
      }
    } catch (e) {
      if (
        id === request.current &&
        !(e instanceof DOMException && e.name === "AbortError")
      )
        setError(
          "Could not reach the compiler API. Start the Python server on " +
            api +
            ". " +
            String(e),
        );
    } finally {
      if (id === request.current) setBusy(false);
    }
  }
  const phase = result?.phases[active],
    meta = phases.find((p) => p[0] === active)!;
  function renderOutput() {
    if (!phase?.output)
      return (
        <div className="empty">
          <span className="empty-mark">
            {phase?.status === "error" ? "!" : "→"}
          </span>
          <h3>
            {phase?.status === "blocked"
              ? "Waiting for an earlier phase"
              : phase?.status === "error"
                ? "This phase found an error"
                : "Your compilation starts here"}
          </h3>
          <p>
            {phase?.status === "error"
              ? "Use the diagnostic below to correct the source."
              : "Write a circuit or choose an example, then press Compile."}
          </p>
        </div>
      );
    const data = phase.output;
    switch (active) {
      case "lexical":
        return <TokenView tokens={data} />;
      case "syntax":
        return <ASTView data={data} />;
      case "semantic":
        return <SymbolView data={data} />;
      case "ir":
        return <IRView instructions={data.instructions} />;
      case "optimization":
        return (
          <OptimizationView
            data={data}
            original={result!.phases.ir.output.instructions}
          />
        );
      case "codegen":
        return (
          <>
            <h3>Interactive gate circuit</h3>
            <Circuit
              key={compiled + String(compiledOpt)}
              netlist={data.netlist}
            />
            <h3>Generated Verilog</h3>
            <div className="downloads">
              <button onClick={() => download("logic_circuit.v", data.verilog)}>
                Download .v
              </button>
              <button
                onClick={() =>
                  download(
                    "netlist.json",
                    JSON.stringify(data.netlist, null, 2),
                    "application/json",
                  )
                }
              >
                Netlist JSON
              </button>
            </div>
            <pre>{data.verilog}</pre>
            <details>
              <summary>Source → Verilog port mapping</summary>
              <pre>{JSON.stringify(data.port_map, null, 2)}</pre>
            </details>
          </>
        );
      case "simulation":
        return (
          <>
            <div className="downloads">
              <button
                onClick={() =>
                  download(
                    "truth-table.csv",
                    [
                      data.columns.join(","),
                      ...data.rows.map((r: number[]) => r.join(",")),
                    ].join("\n"),
                    "text/csv",
                  )
                }
              >
                Download CSV
              </button>
            </div>
            <TruthTable key={compiled + String(compiledOpt)} data={data} />
          </>
        );
    }
  }
  return (
    <div className="app">
      <header>
        <div className="brand">
          <span className="logo">
            L<span>·</span>G
          </span>
          <div>
            <strong>Logic Lab</strong>
            <span>COMPILER WORKBENCH</span>
          </div>
        </div>
        <div className="header-note">
          Source to circuit. Every step visible.
        </div>
        <a
          href="https://en.wikipedia.org/wiki/Logic_gate"
          target="_blank"
          rel="noreferrer"
        >
          Logic gates ↗
        </a>
      </header>
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">COMBINATIONAL LOGIC</span>
          <h1>
            Build a circuit.
            <br className="mobile-break" /> Understand the compiler.
          </h1>
        </div>
        <span className="phase-count">7 phases · 1 pipeline</span>
      </div>
      <main
        style={{ "--editor-width": editorWidth + "%" } as React.CSSProperties}
      >
        <section className="source-pane">
          <div className="pane-title">
            <div>
              <span className="section-number">01</span>
              <h2>Source editor</h2>
            </div>
            <span className="file-label">circuit.logic</span>
          </div>
          <div className="source-tools">
            <label>
              Example
              <select
                aria-label="Choose example"
                defaultValue="Introduction"
                onChange={(e) => edit(examples[e.target.value])}
              >
                {Object.keys(examples).map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={optimization}
                onChange={(e) => {
                  request.current++;
                  abort.current?.abort();
                  setBusy(false);
                  setOptimization(e.target.checked);
                }}
              />{" "}
              Optimize
            </label>
          </div>
          <Editor
            value={source}
            onChange={edit}
            onCompile={compile}
            selection={selection}
          />
          <div className="editor-footer">
            <span>
              {source.split("\n").length} lines{" "}
              <span className="separator">/</span> Boolean DSL
            </span>
            <span>⌘ / Ctrl + Enter</span>
          </div>
          <div className="compile-area">
            <button className="primary" onClick={compile} disabled={busy}>
              {busy ? "Compiling…" : "Compile circuit"} <span>→</span>
            </button>
            <span role="status">
              {stale
                ? "Source changed. Recompile to update."
                : result?.success
                  ? "All phases complete"
                  : result
                    ? "Compilation needs a correction"
                    : "Ready when you are"}
            </span>
          </div>
          <details className="language-help">
            <summary>Language quick reference</summary>
            <p>
              Declare INPUT, WIRE, and OUTPUT signals before assignments. End
              each statement with a semicolon.
            </p>
            <code>NOT → AND / NAND → XOR / XNOR → OR / NOR</code>
            <p>
              Operators above are listed from highest to lowest precedence. Use
              parentheses to group expressions. Signals hold 0 or 1.
            </p>
          </details>
        </section>
        <div
          className="resize-handle"
          role="separator"
          aria-label="Resize source editor"
          aria-orientation="vertical"
          aria-valuenow={editorWidth}
          aria-valuemin={25}
          aria-valuemax={60}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              setEditorWidth((w) =>
                Math.max(
                  25,
                  Math.min(60, w + (e.key === "ArrowRight" ? 2 : -2)),
                ),
              );
            }
          }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) {
              const rect =
                e.currentTarget.parentElement!.getBoundingClientRect();
              setEditorWidth(
                Math.max(
                  25,
                  Math.min(60, ((e.clientX - rect.left) / rect.width) * 100),
                ),
              );
            }
          }}
          onPointerUp={(e) =>
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        />
        <section className="results-pane">
          <div className="pane-title">
            <div>
              <span className="section-number">02</span>
              <h2>Compilation pipeline</h2>
            </div>
            <span
              className={
                "status " + (stale ? "stale" : result?.success ? "success" : "")
              }
            >
              {stale
                ? "OUTDATED"
                : result?.success
                  ? "COMPILED"
                  : result
                    ? "ERROR"
                    : "NOT RUN"}
            </span>
          </div>
          <nav className="phase-nav" aria-label="Compiler phases">
            {phases.map(([id, label], index) => (
              <button
                key={id}
                className={active === id ? "active" : ""}
                onClick={() => {
                  setActive(id);
                  setTab("Output");
                }}
                title={label}
                aria-current={active === id ? "step" : undefined}
              >
                <span
                  className={"phase-dot " + (result?.phases[id].status || "")}
                >
                  {result?.phases[id].status === "complete" ? "✓" : index + 1}
                </span>
                {
                  [
                    "Tokens",
                    "AST",
                    "Symbols",
                    "IR",
                    "Optimize",
                    "Generate",
                    "Simulate",
                  ][index]
                }
              </button>
            ))}
          </nav>
          <div className="phase-heading">
            <div>
              <h2>{meta[1]}</h2>
              <p>{meta[2]}</p>
            </div>
            <span className="phase-index">
              {phases.findIndex((p) => p[0] === active) + 1} / 7
            </span>
          </div>
          <div className="view-tabs" role="tablist" aria-label="Phase detail">
            {["Input", "Output", "Explanation", "JSON"].map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="phase-content" role="tabpanel">
            {tab === "Output" ? (
              renderOutput()
            ) : tab === "Explanation" ? (
              <div className="explanation">
                <h3>What happens here?</h3>
                <p>
                  {phase?.explanation ||
                    "Compile an example to inspect this phase and its contract."}
                </p>
                <h3>Module contract</h3>
                <p>
                  The Input tab shows the exact value this phase receives.
                  Output and JSON show its result. A failed phase blocks all
                  dependent phases.
                </p>
              </div>
            ) : (
              <pre>
                {JSON.stringify(
                  tab === "Input" ? phase?.input : phase?.output,
                  null,
                  2,
                ) || "Compile a program to inspect this data."}
              </pre>
            )}
          </div>
          {result?.diagnostics.map((d, i) => (
            <button
              key={i}
              className="diagnostic"
              disabled={stale}
              onClick={() => {
                if (d.span) setSelection({ ...d.span });
              }}
            >
              <strong>
                {d.code}
                {d.span ? ` · ${d.span.line}:${d.span.column}` : ""}
              </strong>
              <span>{d.message}</span>
            </button>
          ))}
          {error && (
            <div className="api-error" role="alert">
              {error}
            </div>
          )}
        </section>
      </main>
      <footer>
        <span>Logic Lab / Compiler Design Project</span>
        <span>Python compiler · React interface · Deterministic results</span>
      </footer>
    </div>
  );
}
