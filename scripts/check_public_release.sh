#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "Checking public release content..."

if find . \
  -path './.git' -prune -o \
  -path './.mkdocs_site' -prune -o \
  -path './data' -prune -o \
  -path './outputs' -prune -o \
  -path './logs' -prune -o \
  -type f \
  \( -name '*.zip' -o -name '*.parquet' -o -name '*.pt' -o -name '*.pth' -o -name '*.ckpt' -o -name '*.bin' \) \
  -print | grep -q .; then
  echo "Large or generated artifacts are present in the public workspace." >&2
  exit 1
fi

PATTERN='(/Users/|/home/|/root/|/nvme|root@|[0-9]{1,3}(\.[0-9]{1,3}){3}|access_token|kaggle\.json|api[_-]?key|password|BEGIN (RSA|OPENSSH|EC|DSA) PRIVATE KEY|何时再看|新会话|Codex|vibecoding|控制认知负载|自言自语|心里话|AI 协作|交接模板|面试官)'

if rg -n -I "$PATTERN" \
  --glob '!.git/**' \
  --glob '!.mkdocs_site/**' \
  --glob '!scripts/check_public_release.sh' \
  --glob '!data/**' \
  --glob '!outputs/**' \
  --glob '!logs/**' \
  .; then
  echo "Public release check failed: sensitive or internal wording was found." >&2
  exit 1
fi

echo "Public release check passed."
