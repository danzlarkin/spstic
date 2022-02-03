#!/bin/bash

# Installer description
echo ""
echo -e "\x1b[34m  \x1b[4m\x1b[1mspstic\x1b[0m"
echo ""
echo -e "\x1b[34m\x1b[2m    A static service tool using Deno, Ngrok, Certbot and Cloudflare\x1b[0m"
echo ""
echo -e "\x1b[34m\x1b[2m    * Deno is used to create a static file server (including live-reloading)\x1b[0m"
echo -e "\x1b[34m\x1b[2m    * Ngrok is used to tunnel this server to any specified domain\x1b[0m"
echo -e "\x1b[34m\x1b[2m    * Certbot is used to issue a TLS/SSL certificate for the specified domain\x1b[0m"
echo -e "\x1b[34m\x1b[2m    * Cloudflare is used for DNS service\x1b[0m"
echo ""

# Link the file if not already done
if [ ! -L "/bin/spstic" ]; then
  echo -e "\x1b[2m    We're attempting to link static to your user shell (sudo is required).\x1b[0m"
  echo -e "\x1b[2m    Please enter your password when required\x1b[0m"
  echo -e ""
  sleep 1
  sudo ln -s $PWD/spstic /bin/spstic
  sudo ln -s /bin/spstic /bin/static
  echo ""
fi

# Request the Wildcard Domain
echo -e "\x1b[2m    To get started, we need a wildcard domain name that all your services will be deployed to.\x1b[0m"
echo -e "\x1b[2m    If for example your domain is *.example.io then an example service may be deployed to xyz123.example.io.\x1b[0m"
echo -e "\x1b[2m    Please enter the wildcard domain you wish to use\x1b[0m"
echo ""
read -p "    Wildcard Domain: *." BaseDomain
echo ""

# Request the Cloudflare API Token
echo -e "\x1b[2m    In order to use TLS/SSL for your domain, we need to be able to create a DNS record on your Cloudflare Account.\x1b[0m"
echo -e "\x1b[2m    Please enter a Cloudflare API Token with access to DNS on the Zone you're wishing to use\x1b[0m"
echo ""
read -p "    Cloudflare API Token: " CloudflareAPIToken
echo ""

# Request the Ngrok Authtoken
echo -e "\x1b[2m    Now for Ngrok we need an Authtoken for your local Ngrok tunelling instance.\x1b[0m"
echo -e "\x1b[2m    Please enter your Ngrok Authtoken"
echo ""
read -p "    Ngrok Authtoken: " NgrokAuthtoken
echo ""

# Request the Ngrok API Key
echo -e "\x1b[2m    Finally, we need an Ngork API Key to upload your TLS/SSL certificates.\x1b[0m"
echo -e "\x1b[2m    Please enter your Ngrok API Key\x1b[0m"
echo ""
read -p "    Ngrok API Key: " NgrokAPIKey
echo ""

# Write the config files
mkdir -p config
echo "dns_cloudflare_api_token = $CloudflareAPIToken" > config/cloudflare.ini
cat <<EOF > config/config.js
export const ProjectDirectory = '$PWD';
export const CertbotDirectory = '$PWD/certbot';
export const ConfigDirectory = '$PWD/config';
export const ScriptsDirectory = '$PWD/scripts';
export const WildcardDomain = '*.$BaseDomain';
export const BaseDomain = '$BaseDomain';
export const CloudflareAPIToken = '$CloudflareAPIToken';
export const NgrokAuthtoken = '$NgrokAuthtoken';
export const NgrokAPIKey = '$NgrokAPIKey';
EOF

# Log out the success
echo -e "\x1b[2m    Congrats, you're all setup and ready to run \x1b[1mspstic\x1b[0m\x1b[2m from your terminal\x1b[0m"
echo ""
echo -e "\x1b[2m      \x1b[4msee:\x1b[0m\x1b[2m\x1b[1m spstic \x1b[2m--help\x1b[0m"
echo ""