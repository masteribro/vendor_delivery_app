#!/bin/bash
# Run this ONCE on your Hetzner server after creation
# Usage: ssh root@<server-ip> 'bash -s' < server-setup.sh

set -e

echo "=> Updating system..."
apt update && apt upgrade -y

echo "=> Installing nginx..."
apt install -y nginx

echo "=> Creating web directory..."
mkdir -p /var/www/kalidashboard

echo "=> Setting up nginx config..."
cat > /etc/nginx/sites-available/kalidashboard << 'NGINX'
server {
    listen 80;
    server_name _;
    root /var/www/kalidashboard;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
}
NGINX

ln -sf /etc/nginx/sites-available/kalidashboard /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "=> Starting nginx..."
nginx -t && systemctl restart nginx
systemctl enable nginx

echo "=> Setting up firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "=> Server setup complete!"
echo "   Now run: ./deploy.sh <this-server-ip>"
