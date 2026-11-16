"""Orchestration only: phases remain usable without FastAPI."""

from .lexer import tokenize
from .parser import parse
from .semantic import analyze
from .ir import generate_ir
from .optimizer import optimize
from .codegen import generate
from .simulation import simulate
from .models import CompileError

PHASES = [
    "lexical",
    "syntax",
    "semantic",
    "ir",
    "optimization",
    "codegen",
    "simulation",
]
EXPLANATIONS = {
    "lexical": "Scan source characters into positioned tokens. Whitespace and comments are skipped.",
    "syntax": "Use recursive descent and precedence climbing to construct an abstract syntax tree.",
    "semantic": "Resolve declarations, validate single assignment, and topologically sort an acyclic dependency graph.",
    "ir": "Lower expression nodes into ordered three-address Boolean instructions and named copies.",
    "optimization": "Propagate copies, fold constants, simplify Boolean identities, share expressions, and remove dead instructions.",
    "codegen": "Translate ordered IR into a structural netlist and Verilog primitives. Map names to safe Verilog identifiers.",
    "simulation": "Evaluate the generated netlist for every input combination to produce the truth table.",
}


def compile_source(source, optimization=True):
    phases = {
        name: dict(
            status="blocked", input=None, output=None, explanation=EXPLANATIONS[name]
        )
        for name in PHASES
    }
    result = dict(schema_version="1.0", success=False, phases=phases, diagnostics=[])

    def run(name, value, function):
        phases[name]["input"] = value
        phases[name]["status"] = "running"
        output = function(value)
        phases[name]["output"] = output
        phases[name]["status"] = "complete"
        return output

    try:
        tokens = run("lexical", source, tokenize)
        parsed = run("syntax", tokens, parse)
        semantic = run("semantic", parsed["ast"], analyze)
        ir = run("ir", semantic, generate_ir)
        optimized = run(
            "optimization",
            ir,
            optimize if optimization else lambda x: dict(x, changes=[], enabled=False),
        )
        generated = run("codegen", optimized, generate)
        run("simulation", generated["netlist"], simulate)
        result["success"] = True
    except CompileError as error:
        result["diagnostics"].append(error.diagnostic)
        phases[error.diagnostic["phase"]]["status"] = "error"
    return result
