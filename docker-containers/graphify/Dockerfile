# graphify arm — Graphify-Labs (YC S26), installed as shipped. PROTOCOL.md §1/§3.
# NOTE: their integration is SKILL-based, not MCP — `graphify install` registers
# the /graphify skill (SKILL.md + references) into the agent profile; the skill
# drives the graphify CLI. Code parsing is tree-sitter/local; doc/media ingestion
# would use the assistant's model (not exercised — our questions are code-only).
FROM bench-base:latest

USER root
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip pipx \
 && rm -rf /var/lib/apt/lists/*
ARG GRAPHIFY_VERSION
RUN PIPX_HOME=/opt/pipx PIPX_BIN_DIR=/usr/local/bin pipx install graphifyy${GRAPHIFY_VERSION:+==$GRAPHIFY_VERSION}
USER bench

# Registers the skill into the hermetic HOME profile.
RUN graphify install || echo "WARN: graphify install failed — inspect"
