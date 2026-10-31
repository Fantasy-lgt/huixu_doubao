#!/usr/bin/env bash
# Preflight check for the beautiful-feishu-whiteboard skill.
# Verifies the tools needed to render an SVG and write it into Feishu as an editable whiteboard.
#
# Note: larksuite-cli is used for writing to Feishu. It is pre-configured in this environment
# and does not require manual authentication checks.
set -u
ok=1
echo "▶ Checking prerequisites for beautiful-feishu-whiteboard…"
echo

# Node ≥ 20
if command -v node >/dev/null 2>&1; then
  echo "  ✓ Node $(node -v)"
else
  echo "  ✗ Node.js not found — install Node ≥ 20  (https://nodejs.org)"
  ok=0
fi

# whiteboard-cli  (run via npx, auto-downloads)
if npx -y @larksuite/whiteboard-cli@^0.2.11 -v >/dev/null 2>&1; then
  echo "  ✓ @larksuite/whiteboard-cli reachable via npx"
else
  echo "  ! could not reach @larksuite/whiteboard-cli via npx (needs network on first run)"
  ok=0
fi

echo
if [ "$ok" = 1 ]; then
  echo "✅ Ready. You also need a Feishu/Lark account — boards are written to your own tenant."
else
  echo "❌ Missing prerequisites above. Install them, then re-run this check."
  exit 1
fi
