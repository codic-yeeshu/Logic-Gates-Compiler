# IEEE report

`main.tex` uses the IEEEtran conference class and a two-column IEEE structure. Replace the team name, full author names, institution, and department placeholders before submission. Update contribution records only after actual member review.

Build with a TeX installation that includes IEEEtran and listings:

```sh
cd docs/report
pdflatex -interaction=nonstopmode -halt-on-error main.tex
pdflatex -interaction=nonstopmode -halt-on-error main.tex
```

The second pass resolves citations and table references. Alternatively, import this directory as an Overleaf project with `main.tex` as the main document. The bibliography is embedded, so no BibTeX step is needed.

The host initially has no `pdflatex` command. Built-in editor compilation was attempted; see `../verification.md` for its outcome. No PDF should be described as verified until compilation and visual inspection have both succeeded. The LaTeX source remains the editable deliverable.
