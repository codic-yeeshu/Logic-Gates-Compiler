#!/bin/sh
# Build the editable IEEE source into the stable report filename.
set -eu
cd "$(dirname "$0")"
if command -v tectonic >/dev/null 2>&1; then
    tectonic main.tex --keep-logs
elif command -v pdflatex >/dev/null 2>&1; then
    pdflatex -interaction=nonstopmode -halt-on-error main.tex
    pdflatex -interaction=nonstopmode -halt-on-error main.tex
else
    printf '%s\n' 'Install Tectonic or a TeX distribution with IEEEtran, then rerun this script.' >&2
    exit 1
fi
cp main.pdf Logic-Lab-IEEE-Report.pdf
printf '%s\n' 'Created docs/report/Logic-Lab-IEEE-Report.pdf'
