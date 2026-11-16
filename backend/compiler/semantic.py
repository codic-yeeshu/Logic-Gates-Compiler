"""AST -> symbol table and acyclic, topologically ordered assignments."""

from .models import CompileError


def references(node):
    result = []
    stack = [node]
    while stack:
        item = stack.pop()
        if item["kind"] == "reference":
            result.append(item)
        stack.extend(item["children"])
    return result


def analyze(ast):
    symbols, assignments, dependencies = {}, {}, {}

    def fail(code, message, span=None):
        raise CompileError("semantic", code, message, span)

    for symbol in ast["declarations"]:
        name = symbol["name"]
        if name in symbols:
            fail("DUPLICATE_DECLARATION", f"{name} is declared twice.", symbol["span"])
        symbols[name] = symbol
    if len(symbols) > 200:
        fail("SIGNAL_LIMIT", "At most 200 signals are allowed.")
    inputs = [name for name, s in symbols.items() if s["kind"] == "INPUT"]
    outputs = [name for name, s in symbols.items() if s["kind"] == "OUTPUT"]
    if len(inputs) > 12:
        fail("INPUT_LIMIT", "At most 12 inputs are allowed.")
    if not outputs:
        fail("NO_OUTPUT", "Declare at least one OUTPUT.")
    for assignment in ast["assignments"]:
        name = assignment["name"]
        if name not in symbols:
            fail("UNDEFINED_SIGNAL", f"{name} is not declared.", assignment["span"])
        if symbols[name]["kind"] == "INPUT":
            fail("INPUT_ASSIGNMENT", f"Cannot assign input {name}.", assignment["span"])
        if name in assignments:
            fail(
                "DUPLICATE_ASSIGNMENT", f"{name} is assigned twice.", assignment["span"]
            )
        refs = references(assignment["expression"])
        for ref in refs:
            if ref["value"] not in symbols:
                fail(
                    "UNDEFINED_SIGNAL", f"{ref['value']} is not declared.", ref["span"]
                )
        assignments[name] = assignment
        dependencies[name] = list(dict.fromkeys(ref["value"] for ref in refs))
    for name, symbol in symbols.items():
        if symbol["kind"] != "INPUT" and name not in assignments:
            fail("MISSING_ASSIGNMENT", f"{name} has no assignment.", symbol["span"])
    order, active, done = [], set(), set(inputs)

    def visit(name):
        if name in done:
            return
        if name in active:
            fail(
                "CYCLE", f"Combinational cycle involving {name}.", symbols[name]["span"]
            )
        active.add(name)
        for dependency in dependencies[name]:
            visit(dependency)
        active.remove(name)
        done.add(name)
        order.append(name)

    for name in assignments:
        visit(name)
    return dict(
        symbols=list(symbols.values()),
        dependencies=dependencies,
        order=order,
        inputs=inputs,
        outputs=outputs,
        assignments=[assignments[name] for name in order],
    )
