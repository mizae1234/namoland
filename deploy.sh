#!/bin/bash
set -e

# ============================================
#  Namoland — Remote Deploy Script
#  Usage: bash deploy.sh
# ============================================

SERVER="root@srv1100100.hstgr.cloud"
REMOTE_DIR="/home/web/namoland"

echo ""
echo "🚀 Deploying Namoland to ${SERVER}..."
echo "============================================"

ssh "$SERVER" bash -s <<'EOF'
set -e
cd /home/web/namoland

echo ""
echo "📥 Pulling latest code..."
git pull origin main

echo ""
echo "🐳 Rebuilding Docker image..."
docker compose down
docker compose build --no-cache
docker compose up -d

echo ""
echo "⏳ Waiting for container..."
sleep 5

if docker ps --filter "name=namoland-app" --filter "status=running" -q | grep -q .; then
    echo ""
    echo "✅ Deploy successful!"
    docker logs --tail 5 namoland-app
else
    echo ""
    echo "❌ Container failed!"
    docker logs --tail 20 namoland-app
    exit 1
fi
EOF

echo ""
echo "🎉 Namoland deployed successfully!"
echo ""
