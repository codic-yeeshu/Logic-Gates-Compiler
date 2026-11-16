"""IR -> gate netlist and portable combinational Verilog."""


def generate(ir):
    names = list(
        dict.fromkeys(
            ir["inputs"] + ir["outputs"] + [i["dest"] for i in ir["instructions"]]
        )
    )
    mapping = {name: f"s{index}" for index, name in enumerate(names)}

    def signal(name):
        return "1'b" + name if name in ("0", "1") else mapping[name]

    ports = ir["inputs"] + ir["outputs"]
    lines = [
        "// Logic Gates Compiler: generated combinational circuit",
        "// Port mapping: " + ", ".join(f"{mapping[p]} = {p}" for p in ports),
        "module logic_circuit(" + ", ".join(mapping[p] for p in ports) + ");",
    ]
    for direction, items in [("input", ir["inputs"]), ("output", ir["outputs"])]:
        if items:
            lines.append(
                "  " + direction + " " + ", ".join(mapping[p] for p in items) + ";"
            )
    internal = [n for n in names if n not in ports]
    if internal:
        lines.append("  wire " + ", ".join(mapping[n] for n in internal) + ";")
    gates = []
    for index, item in enumerate(ir["instructions"]):
        gate = dict(item, id=f"g{index}")
        gates.append(gate)
        if item["op"] == "COPY":
            lines.append(
                f"  assign {mapping[item['dest']]} = {signal(item['args'][0])};"
            )
        else:
            lines.append(
                f"  {item['op'].lower()} g{index} ({', '.join([mapping[item['dest']]]+[signal(a) for a in item['args']])});"
            )
    lines.append("endmodule")
    return dict(
        netlist=dict(inputs=ir["inputs"], outputs=ir["outputs"], gates=gates),
        verilog="\n".join(lines) + "\n",
        port_map={p: mapping[p] for p in ports},
    )
