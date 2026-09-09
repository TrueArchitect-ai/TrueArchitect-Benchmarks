# Serena arm — Oraios LSP-based semantic MCP, as shipped (uvx from git).
# PROTOCOL.md §1/§3. The heaviest image: needs Python+uv for serena itself and
# a Go toolchain so gopls can serve the memos backend; TS language server rides
# the base image's node. MCP registration = baked /bench/mcp.json (their
# documented `claude mcp add serena -- uvx ...` form), auto-detected by the runner.
FROM bench-base:latest

USER root
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv \
 && rm -rf /var/lib/apt/lists/*

# Go toolchain for gopls (bookworm's golang is too old).
ARG TARGETARCH
ARG GO_VERSION=1.23.4
RUN curl -fsSL "https://go.dev/dl/go${GO_VERSION}.linux-${TARGETARCH}.tar.gz" | tar -xz -C /usr/local
ENV PATH="/usr/local/go/bin:/bench/home/go/bin:/bench/home/.local/bin:${PATH}"

# uv for the bench user.
USER bench
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

# Pre-warm: bake serena's env + gopls so first benchmark run isn't a download storm.
ARG SERENA_REF=main
RUN /bench/home/.local/bin/uvx --from git+https://github.com/oraios/serena@${SERENA_REF} serena --help > /dev/null || echo "WARN: serena prewarm failed"
RUN go install golang.org/x/tools/gopls@latest || echo "WARN: gopls install failed"

COPY mcp.json /bench/mcp.json
