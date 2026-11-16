import assert from "node:assert/strict";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const server = await createServer({
  root: fileURLToPath(new URL("..", import.meta.url)),
  server: { middlewareMode: true, ws: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
});
after(() => server.close());
const { Circuit } = await server.ssrLoadModule("/src/Circuit.tsx");
const { SymbolView } = await server.ssrLoadModule("/src/SymbolView.tsx");

for (const name of ["constructor", "toString", "__proto__"]) {
  for (const kind of ["INPUT", "WIRE", "OUTPUT"]) {
    test(`renders ${name} as ${kind} with correct values and dependencies`, () => {
      const input = kind === "INPUT" ? name : "a";
      const output = kind === "OUTPUT" ? name : "out";
      const gates = [{ id: "g0", dest: "%0", op: "NOT", args: [input] }];
      if (kind === "WIRE") {
        gates.push(
          { id: "g1", dest: name, op: "COPY", args: ["%0"] },
          { id: "g2", dest: "%2", op: "NOT", args: [name] },
        );
      }
      gates.push({
        id: "g3",
        dest: output,
        op: "COPY",
        args: [kind === "WIRE" ? "%2" : "%0"],
      });
      const circuit = renderToStaticMarkup(
        createElement(Circuit, {
          netlist: { inputs: [input], outputs: [output], gates },
        }),
      );
      assert.doesNotMatch(circuit, /NaN|Infinity|undefined/);
      assert.ok(
        circuit.includes(
          `<span>${output} = <b>${kind === "WIRE" ? 0 : 1}</b></span>`,
        ),
        "output matches the circuit at input 0",
      );

      // API JSON can contain __proto__ as an own key; inputs have no dependency entry.
      const dependencies = Object.fromEntries(
        kind === "WIRE"
          ? [[name, [input]], [output, [name]]]
          : [[output, [input]]],
      );
      const symbols = renderToStaticMarkup(
        createElement(SymbolView, {
          data: {
            symbols: [{ name, kind }],
            dependencies,
            order: kind === "INPUT" ? [output] : [name, output],
          },
        }),
      );
      const expectedDependency = kind === "INPUT" ? "—" : input;
      assert.ok(
        symbols.includes(
          `<code>${name}</code></td><td>${kind}</td><td>${expectedDependency}</td>`,
        ),
        "symbol dependencies use only the signal's own entry",
      );
    });
  }
}
