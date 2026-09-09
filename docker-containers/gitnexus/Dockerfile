# GitNexus arm — installed as shipped (global npm → absolute-path MCP config,
# their documented fastest path). PROTOCOL.md §1/§3.
# GITNEXUS_SKIP_OPTIONAL_GRAMMARS=1 skips dart/proto/swift/kotlin native grammar
# builds (their documented no-C++-toolchain path; memos is Go+TS — unaffected).
# `gitnexus analyze` (index + AGENTS.md/CLAUDE.md context files) is deferred to
# L0/runtime and needs a WRITABLE repo copy — their analyze writes into the repo.
FROM bench-base:latest

USER root
# Core tree-sitter native module needs node-gyp's toolchain (the skip flag only
# covers the four optional grammars).
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
ARG GITNEXUS_VERSION=latest
ENV GITNEXUS_SKIP_OPTIONAL_GRAMMARS=1
RUN npm install -g gitnexus@${GITNEXUS_VERSION}
USER bench

# `setup` writes the MCP config for detected agents (hermetic HOME).
RUN gitnexus setup || echo "WARN: gitnexus setup failed — inspect"
