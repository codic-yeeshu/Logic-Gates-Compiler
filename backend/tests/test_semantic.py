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
