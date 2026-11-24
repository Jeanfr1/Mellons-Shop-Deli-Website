#!/usr/bin/env python3
"""Conferir todos os arquivos do kit extraído (sem dependências externas)."""
import hashlib
from pathlib import Path
import sys

root = Path(__file__).resolve().parents[1]
manifest = root / "MANIFEST.sha256"
expected = {}
for line in manifest.read_text(encoding="utf-8").splitlines():
    digest, name = line.split("  ", maxsplit=1)
    path = root / name
    if not path.resolve().is_relative_to(root) or name in expected:
        sys.exit(f"Entrada inválida: {name}")
    expected[name] = digest
bad = [name for name, digest in expected.items()
       if not (root / name).is_file() or hashlib.sha256((root / name).read_bytes()).hexdigest() != digest]
if bad:
    sys.exit("\n".join("Falha: " + name for name in bad))
print(f"{len(expected)} arquivos conferidos.")
