import argparse
import json
from pathlib import Path
from .pipeline import compile_source, PHASES

parser = argparse.ArgumentParser(description="Compile a Logic Gates source file")
parser.add_argument("file", type=Path)
parser.add_argument("--phase", choices=PHASES)
parser.add_argument("--no-optimize", action="store_true")
args = parser.parse_args()
try:
    source = args.file.read_text(encoding="utf-8-sig")
except (OSError, UnicodeDecodeError) as error:
    raise SystemExit(f"Cannot read {args.file}: {error}")
result = compile_source(source, not args.no_optimize)
print(json.dumps(result["phases"][args.phase] if args.phase else result, indent=2))
raise SystemExit(0 if result["success"] else 1)
