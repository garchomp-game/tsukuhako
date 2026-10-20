"""Dedicated fixture only: reserved dotenv key must stop initialization."""
from pathlib import Path
import subprocess

dotenv = Path('.env')
original = dotenv.read_bytes()
try:
    dotenv.write_bytes(original + b'COMPOSE_PROJECT_NAME=otoka-other-fixture\n')
    result = subprocess.run(['bash', 'scripts/initialize.sh'], capture_output=True, text=True)
    assert result.returncode == 1
    assert '.env に不明な設定' in result.stderr
    print('PASS: reserved dotenv key refused before build/up; existing dotenv restored.')
finally:
    dotenv.write_bytes(original)
