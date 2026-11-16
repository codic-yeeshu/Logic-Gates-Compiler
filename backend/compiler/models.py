"""JSON-compatible phase contracts. All positions are one-based except offsets."""

from typing import TypedDict, List, Optional


class Span(TypedDict):
    start: int
    end: int
    line: int
    column: int


class Token(TypedDict):
    kind: str
    lexeme: str
    span: Span


class Node(TypedDict):
    kind: str
    value: str
    children: List["Node"]
    span: Span


class Symbol(TypedDict):
    name: str
    kind: str
    span: Span


class Instruction(TypedDict):
    dest: str
    op: str
    args: List[str]
    span: Span


class Diagnostic(TypedDict):
    phase: str
    code: str
    message: str
    severity: str
    span: Optional[Span]


class CompileError(Exception):
    def __init__(self, phase, code, message, span=None):
        self.diagnostic = dict(
            phase=phase, code=code, message=message, severity="error", span=span
        )
        super().__init__(message)


class Gate(Instruction):
    id: str


class Netlist(TypedDict):
    inputs: List[str]
    outputs: List[str]
    gates: List[Gate]
