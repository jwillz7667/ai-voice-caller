# EC2 Server Configuration Summary

This document summarizes the configuration details for the production server deployment.

## Server Access

*   **Provider:** AWS EC2
*   **Public IP Address:** `3.12.153.208`
*   **Domain Name:** `viral-ventures-llc.com` (and `www.viral-ventures-llc.com`)
*   **Initial SSH User:** `ubuntu`
*   **Deployment SSH User:** `deploy_user` (with `sudo` privileges)
*   **SSH Key File (Local):** `/Users/willz/Desktop/voice.pem`
*   **SSH Command (Ubuntu User):** `ssh -i /Users/willz/Desktop/voice.pem ubuntu@3.12.153.208`
*   **SSH Command (Deploy User):** `ssh -i /Users/willz/Desktop/voice.pem deploy_user@3.12.153.208` (Ensure public key is added to `/home/deploy_user/.ssh/authorized_keys`)

## Installed Software

*   **Web Server:** Nginx
*   **Version Control:** Git
*   **Utilities:** curl
*   **Security:** Fail2ban, UFW (Uncomplicated Firewall)
*   **SSL:** Certbot (with `python3-certbot-nginx`)
*   **Node.js Management:** NVM (Node Version Manager)
*   **Node.js Version:** v20.x
*   **Process Manager:** PM2

## Firewall (UFW) Configuration

*   **Status:** Enabled
*   **Allowed Ports:**
    *   22 (SSH)
    *   80 (HTTP)
    *   443 (HTTPS)

## Application & Web Server Configuration

*   **Base Application Directory:** `/srv/www/viral-ventures-llc.com/app` (Owned by `deploy_user`)
*   **Nginx Web Root:** `/srv/www/viral-ventures-llc.com/public_html` (Primarily for initial setup/verification)
*   **Nginx Config File:** `/etc/nginx/sites-available/viral-ventures-llc.com.conf`
*   **Nginx Enabled Site:** `/etc/nginx/sites-enabled/viral-ventures-llc.com.conf`
*   **SSL Certificates:** Managed by Certbot, located under `/etc/letsencrypt/live/viral-ventures-llc.com/`
*   **Backend Port (Planned for PM2):** `8080`
*   **Frontend Port (Planned for PM2):** `3000`
*   **Nginx Proxies:**
    *   `/ws` -> `http://localhost:8080`
    *   `/api` -> `http://localhost:8080`
    *   `/` -> `http://localhost:3000`

## Next Steps

1.  Add your local public SSH key to `/home/deploy_user/.ssh/authorized_keys` on the server.
2.  Clone application repository into `/srv/www/viral-ventures-llc.com/app` as `deploy_user`.
3.  Configure Supabase & Stripe secrets (obtain from respective dashboards).
4.  Create `ecosystem.config.js` files for both backend and frontend, including secrets/environment variables.
5.  Run `npm install` and `npm run build` for both apps.
6.  Start applications using `pm2 start ecosystem.config.js`.
7.  Update DNS A record for `viral-ventures-llc.com` to point to `3.12.153.208`. 