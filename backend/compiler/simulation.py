"""Evaluate an ordered netlist; enumerate input vectors lexicographically."""

from itertools import product
from .optimizer import operate


def evaluate(instructions, inputs):
    values = {"0": 0, "1": 1, **inputs}
    for item in instructions:
        values[item["dest"]] = operate(item["op"], [values[a] for a in item["args"]])
    return values


def simulate(netlist):
    columns = netlist["inputs"] + netlist["outputs"]
    rows = []
    for bits in product((0, 1), repeat=len(netlist["inputs"])):
        values = evaluate(netlist["gates"], dict(zip(netlist["inputs"], bits)))
        rows.append([values[name] for name in columns])
    return dict(columns=columns, rows=rows, row_count=len(rows))
