import type { Token } from "./types";
export function TokenView({ tokens }: { tokens: Token[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Token</th>
          <th>Lexeme</th>
          <th>Line : column</th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((token, i) => (
          <tr key={i}>
            <td>
              <span className="tag">{token.kind}</span>
            </td>
            <td>
              <code>{token.lexeme || "∅"}</code>
            </td>
            <td>
              {token.span.line} : {token.span.column}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
