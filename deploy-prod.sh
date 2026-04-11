#!/bin/bash
set -e

# ============================================
#  Namoland — Remote Prod Deploy Script
#  Usage: bash deploy-prod.sh
# ============================================

SERVER="root@srv1562380.hstgr.cloud"
REMOTE_DIR="/home/web/namoland"

echo ""
echo "🚀 Deploying Namoland to Production ${SERVER}..."
echo "============================================"

ssh "$SERVER" bash -s <<'EOF'
set -e
echo ""
echo "📥 Pulling latest code..."
if [ ! -d "/home/web/namoland" ]; then
    echo "Directory not found. Cloning repository..."
    mkdir -p /home/web
    cd /home/web
    git clone https://github.com/mizae1234/namoland.git
    cd namoland
else
    cd /home/web/namoland
    git pull origin main
fi

echo ""
echo "📂 Setting up uploads directory permissions..."
mkdir -p /home/web/namoland/uploads
chown -R 1001:1001 /home/web/namoland/uploads

echo ""
echo "🐳 Rebuilding Docker image..."
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

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
echo "🎉 Namoland Production deployed successfully!"
echo ""
