# IEEE project report

The report uses the actual **IEEEtran conference class**, two columns, numbered sections, figure/table captions, and numbered references. It is written in simple language and follows the supplied compiler-design rubric.

## Files

- `Logic-Lab-IEEE-Report.pdf`: compiled report for reading and sharing.
- `main.tex`: editable IEEE LaTeX source.
- `circuit-example.pdf`: vector diagram of the worked example.
- `draw_circuit.py`: optional diagram regeneration script; requires ReportLab.

## Rubric coverage

| Required report content | Where to find it |
|---|---|
| Abstract | Abstract |
| Chosen use case, relevance, and complexity | Introduction; Problem Statement and Objectives |
| Methodology and architecture | Methodology and System Design; Compiler Implementation |
| Lexical token generation | Lexical Analysis; Worked Example and Output |
| Syntax parsing and AST | Syntax Analysis; Grammar and Precedence |
| Semantic handling and edge cases | Semantic Analysis; Error Handling and Quality Checks |
| IR, optimization, and code generation | Compiler Implementation; original/optimized IR and Verilog example |
| Correct output | Worked example circuit and truth table; Recorded Results |
| Interactive phase visualization | Interactive Visualization; Module Inputs and Outputs |
| Individual member contribution | Assigned Team Responsibilities; Actual Work and Review Status |
| AI assistance | AI Assistance and Reproducibility |
| Future scope | Limitations and Future Scope |
| Technical correctness and grammar | Cross-checked examples, measured test results, plain-language explanations |

## Team and submission details

Team ABC, CS & AI, Rishihood University. Members: Dibyajyoti, Rhythm Jain, Prince Sahoo, Ritik Raj, and A M YEESHU.

Actual member review/change/test evidence remains pending. The report lists assigned modules and discloses AI assistance; update the contribution guide and report when reviews are confirmed. The repository is public. No registration form or final submission has been sent automatically.

## Rebuild

After installing either Tectonic or a suitable TeX distribution, run `sh docs/report/build.sh` from the repository root. The script creates the stable PDF filename. Equivalent manual commands are below.

With Tectonic installed:

```sh
tectonic docs/report/main.tex --outdir docs/report
cp docs/report/main.pdf docs/report/Logic-Lab-IEEE-Report.pdf
```

Or use a TeX distribution containing IEEEtran, listings, graphicx, url, array, and booktabs:

```sh
cd docs/report
pdflatex -interaction=nonstopmode -halt-on-error main.tex
pdflatex -interaction=nonstopmode -halt-on-error main.tex
cp main.pdf Logic-Lab-IEEE-Report.pdf
```

The second pdflatex pass resolves references. No BibTeX command is needed because the bibliography is embedded. Import both `main.tex` and `circuit-example.pdf` into an IEEE conference project in Overleaf as another option.

The vector diagram is already included, so ReportLab is not needed to compile the report. To redraw it, install ReportLab in a suitable Python environment and run `python docs/report/draw_circuit.py`.
