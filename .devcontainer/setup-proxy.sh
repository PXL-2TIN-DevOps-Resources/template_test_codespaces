#!/bin/bash

# Installeer squid proxy
sudo apt-get update
sudo apt-get install -y squid

# Configureer whitelist
cat > /etc/squid/squid.conf << EOF
# Whitelist alleen GitHub en essentiële domeinen
acl allowed_domains dstdomain .github.com .githubusercontent.com
acl allowed_domains dstdomain .microsoft.com .visualstudio.com

# Blokkeer alles behalve whitelist
http_access allow allowed_domains
http_access deny all

# Logging
access_log /var/log/squid/access.log squid
EOF

# Start proxy
sudo systemctl start squid

# Blokkeer directe internet access (force proxy)
sudo iptables -A OUTPUT -p tcp --dport 80 -j REJECT
sudo iptables -A OUTPUT -p tcp --dport 443 -j REJECT
sudo iptables -A OUTPUT -p tcp --dport 8888 -j ACCEPT
