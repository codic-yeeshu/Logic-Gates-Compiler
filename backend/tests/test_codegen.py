from pathlib import Path
import shutil
import subprocess
import pytest
from compiler.pipeline import compile_source


@pytest.mark.parametrize(
    "op,expected",
    [
        ("AND", [0, 0, 0, 1]),
        ("NAND", [1, 1, 1, 0]),
        ("OR", [0, 1, 1, 1]),
        ("NOR", [1, 0, 0, 0]),
        ("XOR", [0, 1, 1, 0]),
        ("XNOR", [1, 0, 0, 1]),
    ],
)
def test_gate_tables(op, expected):
    result = compile_source(f"INPUT a,b;OUTPUT o;o=a {op} b;")
    assert [r[-1] for r in result["phases"]["simulation"]["output"]["rows"]] == expected


def test_not_and_constant():
    assert compile_source("INPUT a;OUTPUT o;o=NOT a;")["phases"]["simulation"][
        "output"
    ]["rows"] == [[0, 1], [1, 0]]
    assert compile_source("OUTPUT o;o=1;")["phases"]["simulation"]["output"][
        "rows"
    ] == [[1]]


def test_examples():
    root = Path(__file__).resolve().parents[2] / "examples"
    failing = {
        "semantic-error": "semantic",
        "cycle-error": "semantic",
        "lexical-error": "lexical",
        "syntax-error": "syntax",
    }
    for file in root.glob("*.logic"):
        result = compile_source(file.read_text())
        assert result["success"] == (file.stem not in failing), file.name
        if file.stem in failing:
            assert result["diagnostics"][0]["phase"] == failing[file.stem], file.name
    rows = compile_source((root / "full-adder.logic").read_text())["phases"][
        "simulation"
    ]["output"]["rows"]
    for a, b, c, s, carry in rows:
        assert a + b + c == s + 2 * carry
    for a, b, s, c in compile_source((root / "half-adder.logic").read_text())["phases"][
        "simulation"
    ]["output"]["rows"]:
        assert a + b == s + 2 * c
    for a, b, select, out in compile_source((root / "multiplexer.logic").read_text())[
        "phases"
    ]["simulation"]["output"]["rows"]:
        assert out == (b if select else a)


def test_verilog_safe_names():
    result = compile_source("INPUT module;OUTPUT wire;wire=NOT module;")
    code = result["phases"]["codegen"]["output"]
    assert "input s0;" in code["verilog"]
    assert code["port_map"] == {"module": "s0", "wire": "s1"}


def test_maximum_table():
    source = "INPUT " + ",".join("a" + str(i) for i in range(12)) + ";OUTPUT o;o=a0;"
    assert compile_source(source)["phases"]["simulation"]["output"]["row_count"] == 4096


@pytest.mark.skipif(
    not shutil.which("iverilog") or not shutil.which("vvp"),
    reason="Icarus Verilog is not installed",
)
@pytest.mark.parametrize("optimized", [True, False])
def test_verilog_simulator(tmp_path, optimized):
    for source in [
        "INPUT a,b;OUTPUT o;o=a XNOR b;",
        "OUTPUT o;o=1;",
        "INPUT a,b,c;OUTPUT o,p;o=(a NAND b) NOR c;p=NOT a XOR b;",
    ]:
        result = compile_source(source, optimized)
        generated = result["phases"]["codegen"]["output"]
        net = generated["netlist"]
        mapping = generated["port_map"]
        body = ["module tb;"]
        if net["inputs"]:
            body += ["reg " + ",".join(mapping[n] for n in net["inputs"]) + ";"]
        body += [
            "wire " + ",".join(mapping[n] for n in net["outputs"]) + ";",
            "logic_circuit dut("
            + ",".join(
                "." + mapping[n] + "(" + mapping[n] + ")"
                for n in net["inputs"] + net["outputs"]
            )
            + ");",
            "initial begin",
        ]
        rows = result["phases"]["simulation"]["output"]["rows"]
        for row in rows:
            body += [
                mapping[n] + " = 1'b" + str(row[i]) + ";"
                for i, n in enumerate(net["inputs"])
            ]
            body += ["#1;"]
            for i, n in enumerate(net["outputs"]):
                body += [
                    f'if ({mapping[n]} !== 1\'b{row[len(net["inputs"])+i]}) $fatal(1, "mismatch");'
                ]
        body += ["$finish; end endmodule"]
        (tmp_path / "c.v").write_text(generated["verilog"] + "\n" + "\n".join(body))
        subprocess.run(
            ["iverilog", "-o", str(tmp_path / "out"), str(tmp_path / "c.v")],
            check=True,
            capture_output=True,
        )
        subprocess.run(["vvp", str(tmp_path / "out")], check=True, capture_output=True)


@pytest.mark.parametrize("optimization", [True, False])
def test_public_output_aliases_and_forward_chains(optimization):
    result = compile_source(
        "INPUT a;WIRE x;OUTPUT first,second,third;first=second;second=x;third=first OR 0;x=NOT a;",
        optimization,
    )
    assert result["success"]
    assert result["phases"]["simulation"]["output"]["rows"] == [
        [0, 1, 1, 1],
        [1, 0, 0, 0],
    ]
