#!/bin/bash
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$script_dir/.." && pwd)"
REPO_LOGS_DIR="$REPO_ROOT/.logs"
mkdir -p "$REPO_LOGS_DIR"

# Install pre-commit hook
HOOKS_DIR="$REPO_ROOT/.git/hooks"
mkdir -p "$HOOKS_DIR"
cat > "$HOOKS_DIR/pre-commit" << 'EOF'
#!/bin/bash
REPO_ROOT="$(git rev-parse --show-toplevel)"
REPO_LOGS_DIR="$REPO_ROOT/.logs"
mkdir -p "$REPO_LOGS_DIR"

remoteagent_log=$(find "$HOME/.vscode-remote/data/logs" -type f -name "remoteagent.log" 2>/dev/null | head -n1)

if [ -n "$remoteagent_log" ]; then
    cp "$remoteagent_log" "$REPO_LOGS_DIR/remoteagent.log"
    git add "$REPO_LOGS_DIR/remoteagent.log"
fi

copilot_log=$(find "$HOME/.vscode-remote/data/logs" -type f -name "GitHub Copilot.log" 2>/dev/null | head -n1)

if [ -n "$copilot_log" ]; then
    cp "$copilot_log" "$REPO_LOGS_DIR/GitHub Copilot.log"
    git add "$REPO_LOGS_DIR/GitHub Copilot.log"
fi
EOF
chmod +x "$HOOKS_DIR/pre-commit"
echo "Git pre-commit hook installed"
