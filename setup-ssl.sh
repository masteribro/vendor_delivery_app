#!/bin/bash
# Run this AFTER your domain DNS is pointing to your server
# Usage: ssh root@<server-ip> 'bash -s' < setup-ssl.sh <yourdomain.com>
# Example: ssh root@168.119.xx.xx 'bash -s' < setup-ssl.sh kalivend.com

set -e

DOMAIN="${1:?Usage: provide your domain as argument, e.g. setup-ssl.sh kalivend.com}"

echo "=> Installing certbot..."
apt install -y certbot python3-certbot-nginx

echo "=> Updating nginx config with domain: $DOMAIN"
cat > /etc/nginx/sites-available/kalidashboard << NGINX
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    root /var/www/kalidashboard;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
}
NGINX

nginx -t && systemctl reload nginx

echo "=> Obtaining SSL certificate for $DOMAIN..."
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect

echo "=> Verifying auto-renewal..."
certbot renew --dry-run

echo ""
echo "=> HTTPS setup complete!"
echo "   Your site is live at: https://$DOMAIN"
echo "   SSL auto-renews automatically via certbot timer."
