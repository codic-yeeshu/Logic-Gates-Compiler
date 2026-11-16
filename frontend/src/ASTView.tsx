import type { ASTAssignment, ASTData, ASTNode, SymbolRecord } from "./types";
export function Tree({ node }: { node: ASTNode }) {
  return node.children?.length ? (
    <details className="tree" open>
      <summary>
        <span className="tag">{node.kind}</span> <strong>{node.value}</strong>
      </summary>
      {node.children.map((child, i) => (
        <Tree node={child} key={i} />
      ))}
    </details>
  ) : (
    <div className="tree leaf">
      <span className="tag">{node.kind}</span> <code>{node.value}</code>
    </div>
  );
}
export function ASTView({ data }: { data: ASTData }) {
  return (
    <>
      <div className="declarations">
        {data.ast.declarations.map((s: SymbolRecord, i: number) => (
          <span className="tag" key={`${s.name}-${i}`}>
            {s.kind} {s.name}
          </span>
        ))}
      </div>
      {data.ast.assignments.map((a: ASTAssignment, i: number) => (
        <section className="ast-assignment" key={`${a.name}-${i}`}>
          <h3>{a.name} =</h3>
          <Tree node={a.expression} />
        </section>
      ))}
      <details>
        <summary>Parser trace</summary>
        <ol>
          {data.trace.map((s: string, i: number) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </details>
    </>
  );
}
