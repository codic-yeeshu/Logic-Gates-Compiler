"""Source -> positioned tokens; no parsing or semantic decisions."""

import re
from .models import CompileError

KEYWORDS = set("INPUT WIRE OUTPUT AND OR NOT NAND NOR XOR XNOR".split())
PATTERN = re.compile(r"//[^\r\n]*|\s+|[A-Za-z_][A-Za-z_0-9]*|[01]|[=;,()]")
PUNCT = {"=": "EQUAL", ";": "SEMI", ",": "COMMA", "(": "LPAREN", ")": "RPAREN"}


def tokenize(source):
    if len(source.encode("utf-8")) > 20480:
        raise CompileError("lexical", "SOURCE_LIMIT", "Source exceeds 20 KB.")
    tokens = []
    pos, line, col = 0, 1, 1
    while pos < len(source):
        match = PATTERN.match(source, pos)
        span = dict(start=pos, end=pos + 1, line=line, column=col)
        if not match:
            raise CompileError(
                "lexical",
                "INVALID_CHARACTER",
                f"Invalid character {source[pos]!r}.",
                span,
            )
        value = match.group()
        span["end"] = match.end()
        if not value.isspace() and not value.startswith("//"):
            kind = (
                value
                if value in KEYWORDS
                else PUNCT.get(value, "BIT" if value in ("0", "1") else "IDENT")
            )
            tokens.append(dict(kind=kind, lexeme=value, span=span))
        if "\n" in value or "\r" in value:
            # CRLF, LF, and a lone CR each end one line; offsets are unaffected.
            text = value.replace("\r\n", "\n").replace("\r", "\n")
            line += text.count("\n")
            col = len(text.rsplit("\n", 1)[1]) + 1
        else:
            col += len(value)
        pos = match.end()
    tokens.append(
        dict(
            kind="EOF", lexeme="", span=dict(start=pos, end=pos, line=line, column=col)
        )
    )
    return tokens
