#!/bin/bash
set -e

REPO_DIR="/app/repo"
LOG_FILE="/app/repo/deploy.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=== Deploy started ==="

cd "$REPO_DIR"

log "Pulling latest changes from main..."
git fetch origin main
git reset --hard origin/main

log "Rebuilding pt-creator container..."
docker compose up -d --build pt-creator

log "Cleaning up old images..."
docker image prune -f

log "=== Deploy completed ==="
