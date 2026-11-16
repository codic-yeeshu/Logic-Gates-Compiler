import type { Instruction } from "./types";
export function IRView({ instructions }: { instructions: Instruction[] }) {
  return (
    <div className="ir-list">
      {instructions.map((i, index) => (
        <div className="ir-row" key={i.dest}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <code>
            <b>{i.dest}</b> ← {i.op} {i.args.join(", ")}
          </code>
        </div>
      ))}
    </div>
  );
}
export function OptimizationView({
  data,
  original,
}: {
  data: any;
  original: Instruction[];
}) {
  return (
    <>
      <div className="metrics">
        <div>
          <strong>{original.length}</strong>
          <span>instructions before</span>
        </div>
        <div>
          <strong>{data.instructions.length}</strong>
          <span>instructions after</span>
        </div>
        <div>
          <strong>{data.changes.length}</strong>
          <span>recorded rewrites</span>
        </div>
      </div>
      <IRView instructions={data.instructions} />
      <h3>Rewrite log</h3>
      {data.changes.length ? (
        data.changes.map((c: any, i: number) => (
          <div className="rewrite" key={i}>
            <strong>{c.rule}</strong>
            <code>
              {c.before.dest} ← {c.before.op} {c.before.args.join(", ")} →{" "}
              {c.after ?? "removed"}
            </code>
          </div>
        ))
      ) : (
        <p>
          No rewrites{" "}
          {data.enabled === false ? "(optimization disabled)" : "needed"}.
        </p>
      )}
    </>
  );
}
