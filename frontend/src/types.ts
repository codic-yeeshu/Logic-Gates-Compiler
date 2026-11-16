export interface Span {
  start: number;
  end: number;
  line: number;
  column: number;
}
export interface Token {
  kind: string;
  lexeme: string;
  span: Span;
}
export interface ASTNode {
  kind: string;
  value: string;
  children: ASTNode[];
  span: Span;
}
export interface SymbolRecord {
  name: string;
  kind: string;
  span: Span;
}
export interface Instruction {
  dest: string;
  op: string;
  args: string[];
  span: Span;
}
export interface Netlist {
  inputs: string[];
  outputs: string[];
  gates: (Instruction & { id: string })[];
}
export interface Diagnostic {
  phase: string;
  code: string;
  message: string;
  severity: string;
  span: Span | null;
}
export type PhaseName =
  | "lexical"
  | "syntax"
  | "semantic"
  | "ir"
  | "optimization"
  | "codegen"
  | "simulation";
export interface Phase {
  status: "blocked" | "running" | "complete" | "error";
  input: unknown;
  output: any;
  explanation: string;
}
export interface Compilation {
  schema_version: string;
  success: boolean;
  phases: Record<PhaseName, Phase>;
  diagnostics: Diagnostic[];
}
