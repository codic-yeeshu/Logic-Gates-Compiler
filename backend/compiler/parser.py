"""Recursive descent with precedence climbing -> AST and trace."""

from .models import CompileError

PRECEDENCE = {"OR": 1, "NOR": 1, "XOR": 2, "XNOR": 2, "AND": 3, "NAND": 3}


class Parser:
    def __init__(self, tokens):
        self.tokens, self.index, self.trace = tokens, 0, []
        self.heights = {}

    @property
    def current(self):
        return self.tokens[self.index]

    def take(self, kind):
        token = self.current
        if token["kind"] != kind:
            raise CompileError(
                "syntax",
                "EXPECTED_TOKEN",
                f"Expected {kind}, found {token['lexeme'] or 'end of source'}.",
                token["span"],
            )
        self.index += 1
        return token

    def expression(self, minimum=1, depth=0):
        if depth > 64:
            raise CompileError(
                "syntax",
                "NESTING_LIMIT",
                "Expression nesting exceeds 64.",
                self.current["span"],
            )
        token = self.current
        kind = token["kind"]
        if kind == "NOT":
            self.take(kind)
            node = dict(
                kind="unary",
                value="NOT",
                children=[self.expression(4, depth + 1)],
                span=token["span"],
            )
        elif kind == "LPAREN":
            self.take(kind)
            node = self.expression(1, depth + 1)
            self.take("RPAREN")
        elif kind in ("IDENT", "BIT"):
            self.take(kind)
            node = dict(
                kind="reference" if kind == "IDENT" else "constant",
                value=token["lexeme"],
                children=[],
                span=token["span"],
            )
        else:
            raise CompileError(
                "syntax",
                "EXPECTED_EXPRESSION",
                "Expected a signal, bit, NOT, or parenthesized expression.",
                token["span"],
            )
        self.check_height(node)
        while PRECEDENCE.get(self.current["kind"], 0) >= minimum:
            operator = self.current
            self.take(operator["kind"])
            right = self.expression(PRECEDENCE[operator["kind"]] + 1, depth + 1)
            node = dict(
                kind="binary",
                value=operator["kind"],
                children=[node, right],
                span=operator["span"],
            )
            self.check_height(node)
        return node

    def check_height(self, node):
        height = 1 + max((self.heights[id(c)] for c in node["children"]), default=0)
        self.heights[id(node)] = height
        if height > 64:
            raise CompileError(
                "syntax",
                "NESTING_LIMIT",
                "Expression tree depth exceeds 64.",
                node["span"],
            )

    def parse(self):
        declarations, assignments = [], []
        while self.current["kind"] != "EOF":
            token = self.current
            if token["kind"] in ("INPUT", "WIRE", "OUTPUT"):
                if assignments:
                    raise CompileError(
                        "syntax",
                        "DECLARATION_ORDER",
                        "Declarations must precede assignments.",
                        token["span"],
                    )
                self.take(token["kind"])
                while True:
                    name = self.take("IDENT")
                    declarations.append(
                        dict(name=name["lexeme"], kind=token["kind"], span=name["span"])
                    )
                    if self.current["kind"] != "COMMA":
                        break
                    self.take("COMMA")
                self.take("SEMI")
                self.trace.append(f"Parsed {token['kind']} declaration")
            else:
                name = self.take("IDENT")
                self.take("EQUAL")
                expression = self.expression()
                self.take("SEMI")
                assignments.append(
                    dict(name=name["lexeme"], expression=expression, span=name["span"])
                )
                self.trace.append(f"Parsed assignment to {name['lexeme']}")
        return dict(declarations=declarations, assignments=assignments)


def parse(tokens):
    parser = Parser(tokens)
    ast = parser.parse()
    return dict(ast=ast, trace=parser.trace)
