#!/bin/sh

# Create a self-signed SSL certificate
echo "Creating self-signed SSL certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -out /etc/ssl/certs/nginx-selfsigned.crt \
    -keyout /etc/ssl/private/nginx-selfsigned.key \
    -subj "/C=US/ST=State/L=City/O=42School/OU=Trascendence/CN=localhost" > /dev/null 2>&1

echo "SSL certificate created successfully"

# Start NGINX in foreground
echo "Starting Nginx..."
nginx -g "daemon off;"
