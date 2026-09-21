import sys
import os

_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_root_dir = os.path.dirname(_backend_dir)

for path in [_backend_dir, _root_dir]:
    if path not in sys.path:
        sys.path.insert(0, path)
