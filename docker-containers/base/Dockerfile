# bench base — hermetic claude-code environment every competitor arm builds FROM.
# PROTOCOL.md §3. Auth (CLAUDE_CODE_OAUTH_TOKEN) is passed at `docker run -e` time
# ONLY — never add it to this file or any layer.
FROM node:22-bookworm-slim

# PIN before real runs (smoke tests may float on latest; L2 runs must not).
ARG CLAUDE_CODE_VERSION=latest

RUN apt-get update \
 && apt-get install -y --no-install-recommends git ripgrep ca-certificates curl jq \
 && rm -rf /var/lib/apt/lists/*

RUN npm install -g @anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}

# Non-root user: claude-code's bypassPermissions mode refuses to run as root,
# and the benchmark runs with all permission checks bypassed (PROTOCOL.md §3 —
# the container IS the permission boundary).
RUN useradd -m -u 1010 bench

# Hermetic HOME: no global CLAUDE.md, no operator docs, no user state, no memory.
# NOTE: deliberately NO CLAUDE_CONFIG_DIR override — tool installers (codegraph
# et al.) hardcode default locations (~/.claude.json, ~/.claude/); the scratch
# HOME alone provides hermeticity while giving every installer the layout it
# expects (as-shipped fidelity).
ENV HOME=/bench/home
RUN mkdir -p /bench/home/.claude /bench/repo /bench/out && chown -R bench:bench /bench

# API traffic only — kill nonessential egress (telemetry / error reporting).
# Full egress allowlisting (proxy sidecar → api.anthropic.com) is the L0 TODO.
ENV CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
ENV DISABLE_TELEMETRY=1
ENV DISABLE_ERROR_REPORTING=1

# Benchmark fairness (PROTOCOL.md §3): every arm's full MCP tool surface is
# directly visible — no deferred tool loading / search step between the agent
# and a tool's capabilities. Otherwise we measure claude-code's deferral
# heuristics, not the tools.
ENV ENABLE_TOOL_SEARCH=false

# Repo is mounted read-only at /bench/repo; results written to /bench/out (mounted).
USER bench
WORKDIR /bench/repo
