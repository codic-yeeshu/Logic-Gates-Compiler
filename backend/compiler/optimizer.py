"""Local Boolean rewrites, value numbering, and output-rooted liveness."""


def operate(op, args):
    a = args[0]
    if op == "COPY":
        return a
    if op == "NOT":
        return 1 - a
    b = args[1]
    return {
        "AND": a & b,
        "NAND": 1 - (a & b),
        "OR": a | b,
        "NOR": 1 - (a | b),
        "XOR": a ^ b,
        "XNOR": 1 - (a ^ b),
    }[op]


def optimize(ir):
    aliases, definitions, common, instructions, changes = {}, {}, {}, [], []

    def resolve(value):
        while value in aliases:
            value = aliases[value]
        return value

    for original in ir["instructions"]:
        op, dest = original["op"], original["dest"]
        args = [resolve(a) for a in original["args"]]
        replacement, rule = None, None
        if op == "COPY":
            replacement, rule = args[0], "copy propagation"
        elif all(a in ("0", "1") for a in args):
            replacement, rule = (
                str(operate(op, list(map(int, args)))),
                "constant folding",
            )
        elif (
            op == "NOT"
            and args[0] in definitions
            and definitions[args[0]]["op"] == "NOT"
        ):
            replacement, rule = definitions[args[0]]["args"][0], "double negation"
        elif op == "NAND" and "0" in args:
            replacement, rule = "1", "NAND annihilator"
        elif op == "NOR" and "1" in args:
            replacement, rule = "0", "NOR annihilator"
        elif op == "XNOR" and args[0] == args[1]:
            replacement, rule = "1", "self XNOR"
        elif op in ("AND", "OR", "XOR"):
            a, b = args
            if a == b:
                replacement, rule = (
                    "0" if op == "XOR" else a
                ), "idempotence / self XOR"
            elif op == "AND" and "0" in args:
                replacement, rule = "0", "AND annihilator"
            elif op == "OR" and "1" in args:
                replacement, rule = "1", "OR annihilator"
            elif op == "AND" and "1" in args:
                replacement, rule = (b if a == "1" else a), "AND identity"
            elif op in ("OR", "XOR") and "0" in args:
                replacement, rule = (b if a == "0" else a), "zero identity"
        key = (op, tuple(sorted(args)) if len(args) == 2 else tuple(args))
        if replacement is None and key in common:
            replacement, rule = common[key], "common subexpression elimination"
        if replacement is not None:
            aliases[dest] = resolve(replacement)
            changes.append(dict(rule=rule, before=original, after=aliases[dest]))
        else:
            item = dict(original, args=args)
            instructions.append(item)
            definitions[dest] = item
            common[key] = dest
    # Public output names remain stable even when their internal expressions disappear.
    for output in ir["outputs"]:
        value = resolve(output)
        if value != output:
            instructions.append(
                dict(
                    dest=output,
                    op="COPY",
                    args=[value],
                    span=next(
                        i["span"] for i in ir["instructions"] if i["dest"] == output
                    ),
                )
            )
    live = set(ir["outputs"])
    kept = []
    for item in reversed(instructions):
        if item["dest"] in live:
            kept.append(item)
            live.update(item["args"])
        else:
            changes.append(dict(rule="dead-code elimination", before=item, after=None))
    return dict(
        instructions=list(reversed(kept)),
        inputs=ir["inputs"],
        outputs=ir["outputs"],
        changes=changes,
    )
