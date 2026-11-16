import itertools
import random
import pytest
from compiler.pipeline import compile_source
from compiler.simulation import evaluate


# Independent AST evaluator: intentionally does not use the compiler's gate evaluator.
def ast_value(node, values):
    kind, op = node["kind"], node["value"]
    if kind == "constant":
        return int(op)
    if kind == "reference":
        return values[op]
    args = [ast_value(c, values) for c in node["children"]]
    a = bool(args[0])
    if op == "NOT":
        return int(not a)
    b = bool(args[1])
    if op == "AND":
        return int(a and b)
    if op == "NAND":
        return int(not (a and b))
    if op == "OR":
        return int(a or b)
    if op == "NOR":
        return int(not (a or b))
    if op == "XOR":
        return int(a != b)
    return int(a == b)


@pytest.mark.parametrize(
    "expr,rule",
    [
        ("1 AND 0", "constant folding"),
        ("NOT NOT a", "double negation"),
        ("a AND a", "idempotence / self XOR"),
        ("a XOR a", "idempotence / self XOR"),
        ("a AND 0", "AND annihilator"),
        ("a OR 1", "OR annihilator"),
        ("1 AND a", "AND identity"),
        ("0 OR a", "zero identity"),
        ("a XOR 0", "zero identity"),
        ("(a AND b) OR (b AND a)", "common subexpression elimination"),
    ],
)
def test_rewrites(expr, rule):
    result = compile_source(f"INPUT a,b;OUTPUT o;o={expr};")
    assert result["success"]
    assert rule in [
        c["rule"] for c in result["phases"]["optimization"]["output"]["changes"]
    ]


@pytest.mark.parametrize(
    "expr,expected,rule",
    [
        ("a NAND 0", 1, "NAND annihilator"),
        ("0 NAND a", 1, "NAND annihilator"),
        ("a NOR 1", 0, "NOR annihilator"),
        ("1 NOR a", 0, "NOR annihilator"),
        ("a XNOR a", 1, "self XNOR"),
    ],
)
def test_constant_identities_remove_gates(expr, expected, rule):
    source = f"INPUT a;OUTPUT o;o={expr};"
    optimized = compile_source(source)
    unoptimized = compile_source(source, optimization=False)
    assert optimized["success"] and unoptimized["success"]
    output = optimized["phases"]["optimization"]["output"]
    assert [(i["dest"], i["op"], i["args"]) for i in output["instructions"]] == [
        ("o", "COPY", [str(expected)])
    ]
    assert rule in [c["rule"] for c in output["changes"]]
    expected_rows = [[0, expected], [1, expected]]
    for result in (optimized, unoptimized):
        assert result["phases"]["simulation"]["output"]["rows"] == expected_rows


def test_constant_identities_resolve_aliases_and_preserve_output_ports():
    source = (
        "INPUT a;WIRE same;OUTPUT first,second,third,copy;"
        "same=a;first=same NAND 0;second=1 NOR same;"
        "third=a XNOR same;copy=third;"
    )
    optimized = compile_source(source)
    unoptimized = compile_source(source, optimization=False)
    assert optimized["success"] and unoptimized["success"]
    output = optimized["phases"]["optimization"]["output"]
    assert output["outputs"] == ["first", "second", "third", "copy"]
    assert [(i["dest"], i["op"], i["args"]) for i in output["instructions"]] == [
        ("first", "COPY", ["1"]),
        ("second", "COPY", ["0"]),
        ("third", "COPY", ["1"]),
        ("copy", "COPY", ["1"]),
    ]
    for result in (optimized, unoptimized):
        simulation = result["phases"]["simulation"]["output"]
        assert simulation["columns"] == ["a", "first", "second", "third", "copy"]
        assert simulation["rows"] == [[0, 1, 0, 1, 1], [1, 1, 0, 1, 1]]


def test_dead_code():
    result = compile_source("INPUT a,b;WIRE w;OUTPUT o;w=a AND b;o=a;")
    optimized = result["phases"]["optimization"]["output"]
    assert all(i["op"] != "AND" for i in optimized["instructions"])
    assert any(c["rule"] == "dead-code elimination" for c in optimized["changes"])


def test_generated_program_equivalence():
    rng = random.Random(1729)

    def expr(depth):
        if depth == 0 or rng.random() < 0.25:
            return rng.choice(["a", "b", "c", "0", "1"])
        if rng.random() < 0.2:
            return "NOT (" + expr(depth - 1) + ")"
        return (
            "("
            + expr(depth - 1)
            + " "
            + rng.choice(["AND", "OR", "XOR", "NAND", "NOR", "XNOR"])
            + " "
            + expr(depth - 1)
            + ")"
        )

    for _ in range(150):
        result = compile_source(
            "INPUT a,b,c;OUTPUT o,p;o=" + expr(4) + ";p=" + expr(3) + ";"
        )
        assert result["success"]
        phases = result["phases"]
        for bits in itertools.product([0, 1], repeat=3):
            inputs = dict(zip(["a", "b", "c"], bits))
            expected = dict(inputs)
            for assignment in phases["semantic"]["output"]["assignments"]:
                expected[assignment["name"]] = ast_value(
                    assignment["expression"], expected
                )
            for instructions in [
                phases["ir"]["output"]["instructions"],
                phases["optimization"]["output"]["instructions"],
                phases["codegen"]["output"]["netlist"]["gates"],
            ]:
                actual = evaluate(instructions, inputs)
                assert [actual["o"], actual["p"]] == [expected["o"], expected["p"]]
