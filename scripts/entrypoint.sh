#!/usr/bin/env bash
set -euo pipefail

echo "Entrypoint: preparing environment..."

# Ensure /data exists and is writable
mkdir -p /data /data/workspaces /data/bin /data/logs 2>/dev/null || true
mkdir -p /tmp/antigravity-workspaces /tmp/antigravity-bin /tmp/antigravity-logs

DATA_ROOT="/data"
if [ ! -w /data ]; then
    echo "/data is not writable; falling back to /tmp for runtime files"
    DATA_ROOT="/tmp"
fi

export PYTHONPATH="/app:${PYTHONPATH:-}"
export WORKSPACE_PATH="${WORKSPACE_PATH:-$DATA_ROOT/workspaces}"
mkdir -p "$WORKSPACE_PATH" "$DATA_ROOT/bin" "$DATA_ROOT/logs" 2>/dev/null || true

install_opencode_async() {
    echo "Installing Opencode CLI asynchronously..."
    if curl -fsSL https://opencode.ai/install -o /tmp/opencode-install.sh; then
        timeout 180 bash /tmp/opencode-install.sh >>"$DATA_ROOT/logs/opencode-install.log" 2>&1 || true
        if [ -f "$HOME/.local/bin/opencode" ]; then
            cp "$HOME/.local/bin/opencode" "$DATA_ROOT/bin/opencode" || true
            chmod +x "$DATA_ROOT/bin/opencode" || true
            ln -sf "$DATA_ROOT/bin/opencode" /usr/local/bin/opencode || true
        fi
    else
        echo "Opencode installer download failed" >>"$DATA_ROOT/logs/opencode-install.log"
    fi
}

# Do not block startup on CLI installation.
install_opencode_async &

echo "Starting uvicorn"
exec uvicorn backend.app.main:app --host 0.0.0.0 --port "${PORT:-7860}" --log-level info
