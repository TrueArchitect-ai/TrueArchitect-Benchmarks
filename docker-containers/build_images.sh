#!/usr/bin/env bash
# build_images.sh — build all bench Docker images on THIS machine.
#
# Docker images live in the local daemon, NOT the Syncthing-synced filesystem —
# every machine that runs docker arms must build once (and rebuild only when an
# arms/*/Dockerfile changes; results/cells are unaffected by rebuilds of
# identical Dockerfiles, which is why Dockerfiles pin their tool versions).
#
# Usage:  ./scripts/build_images.sh          # base + all arms
#         ./scripts/build_images.sh cbm serena   # base + named arms only
set -euo pipefail
cd "$(dirname "$0")/.."

ARMS=("$@")
if [ ${#ARMS[@]} -eq 0 ]; then
  # codex + cursor are SELF-CONTAINED (native-harness arms, not claude-shaped —
  # they do not build FROM bench-base); listed here so every machine builds
  # them alongside.
  # wave-2 external harnesses (design §5-§7; SCAFFOLD stage — their fetch
  # scripts fail loudly until each lane's recon fixes the artifact pin):
  # auggie (npm-pinned, no fetch) · devin (fetch-devin.sh) · prime-agent
  # (fetch-prime.sh, tarball identity = recon item)
  ARMS=(cold cbm graphify gitnexus codegraph serena repomix codex cursor auggie devin prime-agent)
fi

echo "build: bench-base (claude-shaped arms build FROM this)"
docker build -t bench-base:latest arms/base

for arm in "${ARMS[@]}"; do
  if [ ! -f "arms/$arm/Dockerfile" ]; then
    echo "SKIP  $arm — no arms/$arm/Dockerfile" >&2
    continue
  fi
  if [ "$arm" = "cursor" ]; then
    # cursor's build context needs the PINNED bridge staged first (docker
    # build never fetches the network — fetch-bridge.sh is the one
    # sanctioned downloader, idempotent, SHA256-verified every run)
    echo "stage: cursor-sdk-bridge (fetch-bridge.sh)"
    (cd arms/cursor && ./fetch-bridge.sh)
  fi
  if [ "$arm" = "devin" ]; then
    echo "stage: devin cli tarball (fetch-devin.sh)"
    (cd arms/devin && bash ./fetch-devin.sh)
  fi
  if [ "$arm" = "prime-agent" ]; then
    echo "stage: prime-agent tarball (fetch-prime.sh)"
    (cd arms/prime-agent && bash ./fetch-prime.sh) || { echo "SKIP  prime-agent — artifact pin pending (§7.5 recon)" >&2; continue; }
  fi
  echo "build: bench-$arm"
  docker build -t "bench-$arm:latest" "arms/$arm"
done

echo "done. images:"
docker images --format '{{.Repository}}:{{.Tag}}  {{.Size}}' | grep '^bench-' | sort
