"""Validated program -> ordered three-address instructions."""


def generate_ir(program):
    instructions = []

    def lower(root):
        # Iterative postorder avoids Python recursion on long left-associative expressions.
        stack, values = [(root, False)], {}
        while stack:
            node, ready = stack.pop()
            if node["kind"] in ("reference", "constant"):
                values[id(node)] = node["value"]
            elif not ready:
                stack.append((node, True))
                stack.extend((child, False) for child in reversed(node["children"]))
            else:
                dest = f"%{len(instructions)}"
                instructions.append(
                    dict(
                        dest=dest,
                        op=node["value"],
                        args=[values[id(c)] for c in node["children"]],
                        span=node["span"],
                    )
                )
                values[id(node)] = dest
        return values[id(root)]

    for assignment in program["assignments"]:
        value = lower(assignment["expression"])
        instructions.append(
            dict(
                dest=assignment["name"],
                op="COPY",
                args=[value],
                span=assignment["span"],
            )
        )
    return dict(
        instructions=instructions, inputs=program["inputs"], outputs=program["outputs"]
    )
