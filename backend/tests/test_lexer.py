import pytest
from compiler.lexer import tokenize
from compiler.models import CompileError


def test_positions_comments_and_eof():
    tokens = tokenize("// comment\nINPUT a;\n")
    assert [(t["kind"], t["lexeme"]) for t in tokens] == [
        ("INPUT", "INPUT"),
        ("IDENT", "a"),
        ("SEMI", ";"),
        ("EOF", ""),
    ]
    assert tokens[0]["span"] == dict(start=11, end=16, line=2, column=1)
    assert tokens[1]["span"]["column"] == 7
    assert tokens[-1]["span"]["line"] == 3


@pytest.mark.parametrize("source", ["@", "2", "a & b", "é"])
def test_invalid_character(source):
    with pytest.raises(CompileError):
        tokenize(source)


def test_keyword_boundaries():
    assert [t["kind"] for t in tokenize("AND android ANDY")] == [
        "AND",
        "IDENT",
        "IDENT",
        "EOF",
    ]


def test_byte_limit():
    with pytest.raises(CompileError, match="20 KB"):
        tokenize(" " * 20481)
