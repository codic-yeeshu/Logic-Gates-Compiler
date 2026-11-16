import pytest
from compiler.lexer import tokenize
from compiler.parser import parse
from compiler.models import CompileError


def expression(text):
    return parse(tokenize("OUTPUT out;out = " + text + ";"))["ast"]["assignments"][0][
        "expression"
    ]


def test_precedence():
    tree = expression("a OR b XOR c AND NOT d")
    assert tree["value"] == "OR"
    assert tree["children"][1]["value"] == "XOR"
    assert tree["children"][1]["children"][1]["value"] == "AND"
    assert tree["children"][1]["children"][1]["children"][1]["value"] == "NOT"


def test_associativity():
    tree = expression("a NAND b NAND c")
    assert tree["children"][0]["value"] == "NAND"


def test_parentheses():
    assert expression("(a OR b) AND c")["children"][0]["value"] == "OR"


@pytest.mark.parametrize(
    "source",
    [
        "OUTPUT out out=1;",
        "OUTPUT out;out=;",
        "OUTPUT out;out=(1;",
        "OUTPUT out;out=1;INPUT a;",
        "OUTPUT out;out=NOT;",
    ],
)
def test_invalid_syntax(source):
    with pytest.raises(CompileError):
        parse(tokenize(source))


@pytest.mark.parametrize(
    "text", ["NOT " * 65 + "a", "(" * 65 + "a" + ")" * 65, " AND ".join(["a"] * 1000)]
)
def test_depth_limit(text):
    with pytest.raises(CompileError, match="64"):
        expression(text)


def test_readable_expected_token_messages():
    from compiler.pipeline import compile_source

    def message(source):
        return compile_source(source)["diagnostics"][0]["message"]

    assert message("INPUT a;OUTPUT o;o a;") == "Expected '=', found 'a'."
    assert message("INPUT a;OUTPUT o;o = (a;") == "Expected ')', found ';'."
    assert message("INPUT a;OUTPUT o;o = a") == "Expected ';', found end of source."
    assert message("INPUT ;") == "Expected a signal name, found ';'."
