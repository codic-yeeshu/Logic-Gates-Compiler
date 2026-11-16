# Logic Lab — Logic Gates Compiler

An educational compiler for combinational Boolean circuits. A Python compiler exposes every stage through a FastAPI API; a React interface provides a source editor, phase inspection, generated Verilog, an interactive gate diagram, and truth tables.

## Run locally

Prerequisites: Python 3.9+ and Node.js 20.19+ (Node 24 is tested). Run commands from the repository root.

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements-lock.txt
npm --prefix frontend ci
```

Start the backend in terminal 1:

```sh
.venv/bin/uvicorn app:app --app-dir backend --host 127.0.0.1 --port 8000
```

Start the frontend in terminal 2:

```sh
npm --prefix frontend run dev
```

Open http://127.0.0.1:5173. Choose an example, press **Compile circuit**, and navigate the seven phases. The example menu includes working circuits and one program per error class (lexical, syntax, and two semantic errors); the offending text is underlined in the editor. Use Ctrl+Enter / Cmd+Enter to compile. Click a diagnostic to select the source location. Drag the divider, or focus it and use arrow keys, to resize the editor.

The editor automatically saves your current source and Optimize setting in this browser and restores them when you return to the same site address. Compile again to regenerate results. **Reset draft** restores Introduction and enables optimization after confirmation. Choosing an example replaces the saved draft. If browser storage is unavailable, editing and compilation still work and the save status indicates that the draft could not be saved.

## Example

```text
INPUT a, b, c;
WIRE intermediate;
OUTPUT out;
intermediate = a AND b;
out = intermediate OR NOT c;
```

Operators: `NOT`, `AND`, `NAND`, `XOR`, `XNOR`, `OR`, `NOR`. Signals are single bits. Declarations precede assignments. Each wire and output must have exactly one assignment. Forward references are allowed; feedback cycles are rejected.

## Architecture

```text
Source → Lexer → Parser → Semantic analysis → IR → Optimizer → Code generation
         tokens   AST     symbols + order    TAC  optimized IR  Verilog + netlist
                                                                    ↓
                                                          Simulation → Truth table
```

`backend/compiler/` is framework-independent. `backend/app.py` is the HTTP adapter. `frontend/` consumes the compiler response and displays it. Each phase has a recorded input, output, status, and explanation. A failure preserves completed phases and blocks later phases. The compiler never evaluates source as Python.

## Tests and CLI

```sh
.venv/bin/python -m pytest -q
npm --prefix frontend test
npm --prefix frontend run build
PYTHONPATH=backend .venv/bin/python -m compiler examples/full-adder.logic
PYTHONPATH=backend .venv/bin/python -m compiler examples/intro.logic --phase ir
PYTHONPATH=backend .venv/bin/python -m compiler examples/optimization.logic --no-optimize
```

Install Icarus Verilog (`iverilog` and `vvp`, e.g. `brew install icarus-verilog`) to enable the external Verilog equivalence tests; they are explicitly skipped when it is unavailable. See [verification](docs/verification.md) for actual results.

## Static frontend build

```sh
npm --prefix frontend run build
npm --prefix frontend run preview
```

The output is `frontend/dist/`, containing static HTML/JS/CSS; no React server is needed. Compilation still needs the Python API. Before building for another host, set `VITE_API_URL=https://your-python-api.example` in the build environment. Export `CORS_ORIGINS` as a comma-separated list of the allowed frontend origins before starting the backend. Use HTTPS for both services in deployment. Vite embeds the API URL at build time; it is not a secret.

No remote repository or deployment has been created. Commit the source and lockfiles, not `.venv`, `node_modules`, or `dist`. Add a GitHub remote and push only when ready.

## API

`GET /api/health` returns status and schema version. `POST /api/compile` accepts:

```json
{"source":"OUTPUT out; out = 1;", "optimization":true}
```

HTTP 200 includes `schema_version`, `success`, `phases`, and `diagnostics`, including for language errors. Invalid request shapes, and text that is not valid Unicode, return HTTP 422. Each phase contains `status`, `input`, `output`, and `explanation`. Diagnostics contain `phase`, `code`, `message`, `severity`, and optional `span`. Offsets are zero-based, end-exclusive; line and column are one-based. The language uses ASCII identifiers. No authentication or persistence is provided.

## Documentation and submission

Start with [the documentation index](docs/README.md), [language specification](docs/language.md), [walkthrough](docs/walkthrough.md), and [viva guide](docs/viva.md). The [contribution record](docs/contributions.md) distinguishes authorized ownership from confirmed individual work. [AI assistance](docs/ai-assistance.md) is disclosed explicitly. The [IEEE report PDF](docs/report/Logic-Lab-IEEE-Report.pdf), editable LaTeX source, and rubric coverage checklist are in [docs/report/](docs/report/README.md).

## Limits

Maximum 20 KB UTF-8 source, 12 input signals, 200 total declared signals, 64 levels of expression syntax/tree depth. Truth tables have at most 4096 rows. Large netlists scroll horizontally. The circuit uses conventional gate outlines, signal labels, and live wire values. This version has no clocks, flip-flops, buses, arithmetic syntax, sequential logic, parser error recovery, or hardware timing model. Compilation reports the first language error; correct it and recompile. Errors are positioned (line, column, and an editor underline) where a location exists; cycle errors show the loop, and undefined names are reported leftmost-first. Optimization is local and does not claim globally minimal gate count.
