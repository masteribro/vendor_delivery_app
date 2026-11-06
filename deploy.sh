#!/bin/bash
# Usage: ./deploy.sh <server-ip>
# Example: ./deploy.sh 168.119.xxx.xxx

set -e

SERVER_IP="${1:?Usage: ./deploy.sh <server-ip>}"
SERVER_USER="root"
REMOTE_DIR="/var/www/kalidashboard"

echo "=> Building project..."
npm run build

echo "=> Uploading to $SERVER_IP..."
ssh "$SERVER_USER@$SERVER_IP" "mkdir -p $REMOTE_DIR"
rsync -avz --delete dist/ "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/"

echo "=> Reloading nginx..."
ssh "$SERVER_USER@$SERVER_IP" "systemctl reload nginx"

echo "=> Deployed successfully!"
echo "   Visit: http://$SERVER_IP"
