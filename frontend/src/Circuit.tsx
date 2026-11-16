import { useRef, useState } from "react";
import type { Netlist } from "./types";
export function download(name: string, content: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function operate(op: string, a: number, b = 0): number {
  switch (op) {
    case "COPY":
      return a;
    case "NOT":
      return 1 - a;
    case "AND":
      return a & b;
    case "NAND":
      return 1 - (a & b);
    case "OR":
      return a | b;
    case "NOR":
      return 1 - (a | b);
    case "XOR":
      return a ^ b;
    case "XNOR":
      return 1 - (a ^ b);
    default:
      throw Error("Unknown gate");
  }
}

/** Conventional gate outlines; COPY is wiring, not an extra Boolean operation. */
function GateSymbol({ op, high }: { op: string; high: boolean }) {
  const style = {
    fill: high ? "#e1f2e7" : "#ffffff",
    stroke: high ? "#167358" : "#667b6a",
    strokeWidth: 2,
  };
  const inverted = ["NAND", "NOR", "XNOR", "NOT"].includes(op);
  const orGate = ["OR", "NOR", "XOR", "XNOR"].includes(op);
  return (
    <g>
      {op === "COPY" ? (
        <path
          d="M 0 32 H 110"
          fill="none"
          stroke={style.stroke}
          strokeWidth="2"
        />
      ) : op === "NOT" ? (
        <path d="M 18 4 L 18 60 L 88 32 Z" {...style} />
      ) : orGate ? (
        <path d="M 16 4 Q 65 4 88 32 Q 65 60 16 60 Q 42 32 16 4 Z" {...style} />
      ) : (
        <path d="M 20 4 H 56 A 28 28 0 0 1 56 60 H 20 Z" {...style} />
      )}
      {["XOR", "XNOR"].includes(op) && (
        <path
          d="M 8 4 Q 34 32 8 60"
          fill="none"
          stroke={style.stroke}
          strokeWidth="2"
        />
      )}
      {op === "NAND" && <path d="M 84 32 H 88" stroke={style.stroke} />}
      {inverted && <circle cx="94" cy="32" r="6" {...style} />}
      {op !== "COPY" && (
        <>
          {op === "NOT" ? (
            <path d="M 0 32 H 18" stroke={style.stroke} />
          ) : (
            <path
              d={orGate ? "M 0 19 H 25 M 0 45 H 25" : "M 0 19 H 20 M 0 45 H 20"}
              stroke={style.stroke}
            />
          )}
          <path
            d={`M ${inverted ? 100 : orGate ? 88 : 84} 32 H 110`}
            stroke={style.stroke}
          />
        </>
      )}
    </g>
  );
}

export function Circuit({ netlist }: { netlist: Netlist }) {
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const [fit, setFit] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  const values: Record<string, number> = { "0": 0, "1": 1 };
  const levels: Record<string, number> = { "0": 0, "1": 0 };
  netlist.inputs.forEach((name) => {
    values[name] = inputs[name] || 0;
    levels[name] = 0;
  });
  netlist.gates.forEach((g) => {
    values[g.dest] = operate(
      g.op,
      ...(g.args.map((a) => values[a]) as [number, number]),
    );
    levels[g.dest] = 1 + Math.max(...g.args.map((a) => levels[a]));
  });
  const nodes = [
    ...netlist.inputs.map((name) => ({ name, op: "INPUT" })),
    ...["0", "1"]
      .filter((name) => netlist.gates.some((g) => g.args.includes(name)))
      .map((name) => ({ name, op: "CONST" })),
    ...netlist.gates.map((g) => ({ name: g.dest, op: g.op })),
  ];
  const counts: Record<number, number> = {},
    positions: Record<string, { x: number; y: number }> = {};
  nodes.forEach((n) => {
    const level = levels[n.name];
    const row = counts[level] || 0;
    counts[level] = row + 1;
    positions[n.name] = { x: 35 + level * 190, y: 45 + row * 120 };
  });
  const width = Math.max(
    480,
    ...Object.values(positions).map((p) => p.x + 150),
  );
  const height = Math.max(
    230,
    ...Object.values(positions).map((p) => p.y + 110),
  );
  return (
    <>
      <div className="circuit-caption">
        <span>
          {netlist.inputs.length} inputs ·{" "}
          {netlist.gates.filter((g) => g.op !== "COPY").length} logic gates ·{" "}
          {netlist.outputs.length} outputs
        </span>
        <span>Generated from compiled netlist</span>
      </div>
      <div className="input-switches">
        {netlist.inputs.map((name) => (
          <button
            key={name}
            className={values[name] ? "on" : ""}
            aria-pressed={!!values[name]}
            onClick={() => setInputs({ ...inputs, [name]: 1 - values[name] })}
          >
            {name} <b>{values[name]}</b>
          </button>
        ))}
        <button onClick={() => setFit(!fit)}>
          {fit ? "Actual size" : "Fit circuit"}
        </button>
        <button
          onClick={() => {
            if (svgRef.current) {
              const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
              clone.setAttribute("width", String(width));
              clone.setAttribute("height", String(height));
              clone.removeAttribute("style");
              download(
                "circuit.svg",
                new XMLSerializer().serializeToString(clone),
                "image/svg+xml",
              );
            }
          }}
        >
          Export SVG
        </button>
      </div>
      <div className="circuit-scroll schematic">
        <svg
          ref={svgRef}
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 ${width} ${height}`}
          width={fit ? "100%" : width}
          height={fit ? undefined : height}
          style={
            fit ? { display: "block", minHeight: 200 } : { display: "block" }
          }
          role="img"
          aria-label="Generated logic gate circuit"
        >
          <rect width={width} height={height} fill="#fafbf8" />
          {netlist.gates.flatMap((g) =>
            g.args.map((arg, i) => {
              const a = positions[arg],
                b = positions[g.dest];
              const targetY =
                b.y + (g.args.length === 1 ? 32 : i === 0 ? 19 : 45);
              return (
                <path
                  key={g.id + "-" + i}
                  d={`M ${a.x + 110} ${a.y + 32} H ${b.x - 40 - i * 12} V ${targetY} H ${b.x}`}
                  fill="none"
                  stroke={values[arg] ? "#167358" : "#b7c3b4"}
                  strokeWidth={values[arg] ? 3 : 1.5}
                />
              );
            }),
          )}
          {nodes.map((n) => {
            const p = positions[n.name];
            const output = netlist.outputs.includes(n.name);
            const port = ["INPUT", "CONST"].includes(n.op);
            return (
              <g key={n.name} transform={`translate(${p.x},${p.y})`}>
                <title>
                  {n.op}: {n.name} = {values[n.name]}
                  {output ? " (output)" : ""}
                </title>
                {port ? (
                  <>
                    <path
                      d="M 8 15 H 77 L 94 32 L 77 49 H 8 Z"
                      fill={values[n.name] ? "#e1f2e7" : "white"}
                      stroke="#667b6a"
                      strokeWidth="2"
                    />
                    <path d="M 94 32 H 110" stroke="#667b6a" />
                    <text
                      x="48"
                      y="37"
                      textAnchor="middle"
                      fontSize="14"
                      fill="#153f35"
                    >
                      {values[n.name]}
                    </text>
                  </>
                ) : (
                  <GateSymbol op={n.op} high={!!values[n.name]} />
                )}
                <text
                  x="52"
                  y="-10"
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontSize="12"
                  fill="#31573a"
                >
                  {output ? "OUTPUT" : n.op === "COPY" ? "WIRE" : n.op}
                </text>
                <text
                  x="52"
                  y="82"
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontSize="12"
                  fill="#213b30"
                >
                  {n.name.length > 18 ? n.name.slice(0, 17) + "…" : n.name}
                  {port ? "" : ` = ${values[n.name]}`}
                </text>
                {output && (
                  <circle
                    cx="110"
                    cy="32"
                    r="5"
                    fill={values[n.name] ? "#167358" : "white"}
                    stroke="#167358"
                    strokeWidth="2"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="output-values">
        {netlist.outputs.map((name) => (
          <span key={name}>
            {name} = <b>{values[name]}</b>
          </span>
        ))}
      </div>
      <p className="hint">
        Toggle an input to see the circuit respond. Green wires carry 1; gray
        wires carry 0. Small circles on gates mean NOT. COPY instructions appear
        as wires.
      </p>
    </>
  );
}
