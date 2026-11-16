import type { SymbolRecord } from "./types";
export function SymbolView({ data }: { data: any }) {
  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Signal</th>
            <th>Type</th>
            <th>Dependencies</th>
          </tr>
        </thead>
        <tbody>
          {data.symbols.map((s: SymbolRecord) => (
            <tr key={s.name}>
              <td>
                <code>{s.name}</code>
              </td>
              <td>{s.kind}</td>
              <td>
                {Object.hasOwn(data.dependencies, s.name)
                  ? data.dependencies[s.name].join(", ") || "—"
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="note">Evaluation order: {data.order.join(" → ")}</div>
    </>
  );
}
