import pytest
from compiler.pipeline import compile_source


@pytest.mark.parametrize(
    "source,code",
    [
        ("INPUT a;OUTPUT o;o=b;", "UNDEFINED_SIGNAL"),
        ("INPUT a,a;OUTPUT o;o=a;", "DUPLICATE_DECLARATION"),
        ("INPUT a;OUTPUT o;o=a;o=0;", "DUPLICATE_ASSIGNMENT"),
        ("INPUT a;OUTPUT o;a=1;o=a;", "INPUT_ASSIGNMENT"),
        ("WIRE w;OUTPUT o;o=1;", "MISSING_ASSIGNMENT"),
        ("INPUT a;", "NO_OUTPUT"),
        ("WIRE w;OUTPUT o;w=o;o=w;", "CYCLE"),
        ("OUTPUT o;o=o;", "CYCLE"),
        (
            "INPUT " + ",".join("a" + str(i) for i in range(13)) + ";OUTPUT o;o=1;",
            "INPUT_LIMIT",
        ),
        (
            "WIRE " + ",".join("w" + str(i) for i in range(201)) + ";OUTPUT o;o=1;",
            "SIGNAL_LIMIT",
        ),
    ],
)
def test_semantic_errors(source, code):
    result = compile_source(source)
    assert result["diagnostics"][0]["code"] == code
    assert result["phases"]["syntax"]["status"] == "complete"
    assert result["phases"]["ir"]["status"] == "blocked"


def test_forward_reference():
    result = compile_source("INPUT a;WIRE w;OUTPUT o;o=w;w=NOT a;")
    assert result["success"]
    assert result["phases"]["semantic"]["output"]["order"] == ["w", "o"]
    assert result["phases"]["simulation"]["output"]["rows"] == [[0, 1], [1, 0]]


def diagnostic(source):
    return compile_source(source)["diagnostics"][0]


def test_first_undefined_reference_is_leftmost():
    d = diagnostic("INPUT a;OUTPUT o;o = x AND y;")
    assert d["message"] == "x is not declared." and d["span"]["column"] == 22


def test_dependencies_follow_source_order():
    result = compile_source("INPUT a,b,c;OUTPUT o;o = c AND a OR b;")
    assert result["phases"]["semantic"]["output"]["dependencies"] == {
        "o": ["c", "a", "b"]
    }


def test_undeclared_assignment_target():
    d = diagnostic("INPUT a;OUTPUT o;q = a;o = a;")
    assert d["code"] == "UNDEFINED_SIGNAL" and d["span"]["column"] == 18


def test_cycle_message_shows_the_path():
    assert "w -> o -> w" in diagnostic("WIRE w;OUTPUT o;w = o;o = w;")["message"]
    assert "o -> o" in diagnostic("OUTPUT o;o = o;")["message"]


def test_limit_errors_are_positioned():
    inputs = ",".join("a" + str(i) for i in range(13))
    d = diagnostic(f"INPUT {inputs};OUTPUT o;o=1;")
    assert d["code"] == "INPUT_LIMIT" and d["span"]["column"] == 7 + len(inputs) - 3
    wires = ",".join("w" + str(i) for i in range(201))
    assert diagnostic(f"WIRE {wires};OUTPUT o;o=1;")["span"] is not None


def test_longest_forward_chain_does_not_exhaust_recursion():
    n = 198  # a + n wires + o = 200 signals, the maximum
    source = (
        "INPUT a;WIRE " + ",".join(f"w{i}" for i in range(n)) + ";OUTPUT o;o = w0;"
        + "".join(f"w{i} = w{i + 1};" for i in range(n - 1))
        + f"w{n - 1} = a;"
    )
    result = compile_source(source)
    assert result["success"]
    assert result["phases"]["simulation"]["output"]["rows"] == [[0, 0], [1, 1]]
