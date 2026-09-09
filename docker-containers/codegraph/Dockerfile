# codegraph arm — @colbymchenry/codegraph, installed as shipped. PROTOCOL.md §1/§3.
# Their `codegraph install` wires the MCP server + instructions + permissions into
# detected agents (claude-code in-image, hermetic HOME). Per-project graph build
# (`codegraph init`) is deferred to L0/runtime — repo isn't present at image build.
FROM bench-base:latest

USER root
ARG CODEGRAPH_VERSION=latest
RUN npm install -g @colbymchenry/codegraph@${CODEGRAPH_VERSION}
USER bench

RUN codegraph install --yes || codegraph install || echo "WARN: codegraph install failed — inspect"
