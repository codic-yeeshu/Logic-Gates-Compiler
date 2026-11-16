import { useState } from "react";
export function TruthTable({
  data,
}: {
  data: { columns: string[]; rows: number[][]; row_count: number };
}) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(data.rows.length / 32));
  const current = Math.max(0, Math.min(page, pages - 1));
  return (
    <>
      <div className="table-tools">
        <span>{data.row_count.toLocaleString()} combinations</span>
        <div>
          <button disabled={current === 0} onClick={() => setPage(current - 1)}>
            Previous
          </button>
          <span>
            {" "}
            {current + 1} / {pages}{" "}
          </span>
          <button
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
          >
            Next
          </button>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            {data.columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.slice(current * 32, current * 32 + 32).map((row, i) => (
            <tr key={i}>
              {row.map((v, j) => (
                <td key={j}>
                  <span className={"bit bit-" + v}>{v}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
