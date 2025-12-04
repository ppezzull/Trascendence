#!/bin/sh

# Create a self-signed SSL certificate
echo "Creating self-signed SSL certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -out /etc/ssl/certs/nginx-selfsigned.crt \
    -keyout /etc/ssl/private/nginx-selfsigned.key \
    -subj "/C=US/ST=State/L=City/O=42School/OU=Trascendence/CN=localhost" > /dev/null 2>&1

echo "SSL certificate created successfully"

# Create htpasswd file for Kibana basic auth (Module #39 security)
echo "Configuring Kibana basic auth..."
if [ -z "$KIBANA_ADMIN_PASSWORD" ]; then
    echo "ERROR: KIBANA_ADMIN_PASSWORD not set in .env file"
    echo "Please add KIBANA_ADMIN_PASSWORD to your .env file"
    exit 1
fi
htpasswd -bc /etc/nginx/.htpasswd_kibana admin "$KIBANA_ADMIN_PASSWORD" > /dev/null 2>&1
echo "Kibana basic auth configured (user: admin)"

# Fix nginx logs for Logstash: Remove symlinks and create actual files
echo "Configuring nginx logs for Logstash..."
rm -f /var/log/nginx/access.log /var/log/nginx/error.log
touch /var/log/nginx/access.log /var/log/nginx/error.log
chown nginx:nginx /var/log/nginx/access.log /var/log/nginx/error.log
echo "Nginx logs configured successfully"

# Start NGINX in foreground
echo "Starting Nginx..."
nginx -g "daemon off;"
