import { useState } from "react";
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
export function Circuit({ netlist }: { netlist: Netlist }) {
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const values: Record<string, number> = { "0": 0, "1": 1 };
  netlist.inputs.forEach((n) => (values[n] = inputs[n] || 0));
  const levels: Record<string, number> = { "0": 0, "1": 0 };
  netlist.inputs.forEach((n) => (levels[n] = 0));
  netlist.gates.forEach((g) => {
    values[g.dest] = operate(
      g.op,
      ...(g.args.map((a) => values[a]) as [number, number]),
    );
    levels[g.dest] = 1 + Math.max(...g.args.map((a) => levels[a]));
  });
  const nodes = [
    ...netlist.inputs.map((n) => ({ name: n, label: "INPUT" })),
    ...["0", "1"]
      .filter((n) => netlist.gates.some((g) => g.args.includes(n)))
      .map((n) => ({ name: n, label: "CONST" })),
    ...netlist.gates.map((g) => ({
      name: g.dest,
      label: g.op === "COPY" ? "BUFFER" : g.op,
    })),
  ];
  const counts: Record<number, number> = {},
    positions: Record<string, { x: number; y: number }> = {};
  nodes.forEach((n) => {
    const level = levels[n.name];
    const row = counts[level] || 0;
    counts[level] = row + 1;
    positions[n.name] = { x: 30 + level * 180, y: 30 + row * 92 };
  });
  const width = Math.max(
    600,
    ...Object.values(positions).map((p) => p.x + 150),
  );
  const height = Math.max(
    220,
    ...Object.values(positions).map((p) => p.y + 85),
  );
  return (
    <>
      <div className="input-switches">
        {netlist.inputs.map((n) => (
          <button
            key={n}
            className={values[n] ? "on" : ""}
            aria-pressed={!!values[n]}
            onClick={() => setInputs({ ...inputs, [n]: 1 - values[n] })}
          >
            {n} <b>{values[n]}</b>
          </button>
        ))}
        <button
          onClick={() => {
            const svg = document.getElementById("circuit-svg");
            if (svg)
              download(
                "circuit.svg",
                new XMLSerializer().serializeToString(svg),
                "image/svg+xml",
              );
          }}
        >
          Export SVG
        </button>
      </div>
      <div className="circuit-scroll">
        <svg
          id="circuit-svg"
          xmlns="http://www.w3.org/2000/svg"
          width={width}
          height={height}
          role="img"
          aria-label="Generated logic gate circuit"
        >
          <rect width="100%" height="100%" fill="#fafbf8" />
          {netlist.gates.flatMap((g) =>
            g.args.map((arg, i) => {
              const a = positions[arg],
                b = positions[g.dest];
              return (
                <path
                  key={g.id + "-" + i}
                  d={`M${a.x + 120},${a.y + 26} C${a.x + 150},${a.y + 26} ${b.x - 30},${b.y + 18 + i * 16} ${b.x},${b.y + 18 + i * 16}`}
                  fill="none"
                  stroke={values[arg] ? "#167358" : "#bac3b7"}
                  strokeWidth={values[arg] ? 3 : 1.5}
                />
              );
            }),
          )}
          {nodes.map((n) => {
            const p = positions[n.name];
            return (
              <g key={n.name}>
                <rect
                  x={p.x}
                  y={p.y}
                  width="120"
                  height="52"
                  rx="8"
                  fill={values[n.name] ? "#e1f2e7" : "#fff"}
                  stroke={values[n.name] ? "#167358" : "#a9b4a5"}
                />
                <text
                  x={p.x + 12}
                  y={p.y + 21}
                  fontFamily="monospace"
                  fontSize="12"
                  fill="#153f35"
                >
                  {n.label}
                </text>
                <text
                  x={p.x + 12}
                  y={p.y + 40}
                  fontFamily="monospace"
                  fontSize="12"
                  fill="#24382b"
                >
                  {n.name.length > 12 ? n.name.slice(0, 11) + "…" : n.name}
                </text>
                <text
                  x={p.x + 99}
                  y={p.y + 31}
                  fontFamily="monospace"
                  fontSize="18"
                  fill="#153f35"
                >
                  {values[n.name]}
                </text>
                <title>
                  {n.name} = {values[n.name]}
                  {netlist.outputs.includes(n.name) ? " (OUTPUT)" : ""}
                </title>
                {netlist.outputs.includes(n.name) && (
                  <text
                    x={p.x}
                    y={p.y + 69}
                    fontFamily="monospace"
                    fontSize="10"
                    fill="#167358"
                  >
                    OUTPUT
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="output-values">
        {netlist.outputs.map((n) => (
          <span key={n}>
            {n} = <b>{values[n]}</b>
          </span>
        ))}
      </div>
      <p className="hint">
        Rectangles are labeled logic gates. Green connections carry 1. Toggle
        inputs to simulate the generated netlist.
      </p>
    </>
  );
}
