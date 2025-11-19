# Grafana Authentication and Security

## Overview

This document explains how Grafana authentication is configured in the Transcendence project for Module #42 (Monitoring System).
The implementation uses a secure, environment-based approach with no hardcoded passwords.

---

## Security Approach

**Method:** Mandatory environment variable with no fallback

**Benefits:**
- ✅ No hardcoded passwords in git
- ✅ Forces explicit password configuration


---

## How Grafana "Registration" Works

There is **NO manual registration UI** for the admin user. Instead:

1. **First container startup:** Grafana reads `GF_SECURITY_ADMIN_PASSWORD` from environment
2. **Automatic admin creation:** Creates admin user with that password in its database
3. **Password persistence:** Password is stored in Grafana's database (volume)
4. **Subsequent startups:** Environment variable is ignored (password already set)

**Important:** The "registration phase" **IS** the configuration in your `.env` file and `docker-compose.yml`.

---

## Configuration Files

### 1. docker-compose.yml

**Location:** `srcs/docker-compose.yml` (lines 209-221)

```yaml
grafana:
  environment:
    # Security: Admin credentials (MANDATORY - set in .env file)
    - GF_SECURITY_ADMIN_USER=admin
    - "GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:?GRAFANA_ADMIN_PASSWORD not set in .env}"

    # Password policy enforcement
    - GF_SECURITY_PASSWORD_MIN_LENGTH=12

    # Session security
    - GF_AUTH_LOGIN_COOKIE_NAME=grafana_session
    - GF_AUTH_LOGIN_MAXIMUM_LIFETIME_DAYS=7

    # Disable anonymous access
    - GF_AUTH_ANONYMOUS_ENABLED=false
```

**Key Security Features:**

- **`:?` syntax:** Forces configuration - container **fails to start** if `GRAFANA_ADMIN_PASSWORD` is not set in `.env`
- **No fallback:** Cannot accidentally use a default password
- **Password policy:** Minimum 12 characters enforced by Grafana
- **Session limits:** 7-day maximum session lifetime
- **Anonymous disabled:** Authentication required for all access

### 2. .env File

**Location:** `srcs/.env` (lines 22-31)

```bash
# ==============================================================================
# Grafana Monitoring Configuration (Module #42)
# ==============================================================================
# MANDATORY: Strong password for Grafana admin user
# Requirements:
#   - Minimum 12 characters
#   - Mix of uppercase, lowercase, numbers, and special characters
#   - NOT a dictionary word or common password
# Generate strong password: openssl rand -base64 24
GRAFANA_ADMIN_PASSWORD=Transcendence_Admin_2025!
```

**⚠️ IMPORTANT:** This file is in `.gitignore` and must NEVER be committed to git.

---

## Setup Instructions

### For First-Time Setup

1. **Open `.env` file:**
   ```bash
   cd srcs
   nano .env
   ```

2. **Find the Grafana section** (around line 22)

3. **Set a strong password:**
   ```bash
   # Generate a strong password (recommended)
   openssl rand -base64 24

   # Or create your own meeting these requirements:
   # - Minimum 12 characters
   # - Uppercase letters (A-Z)
   # - Lowercase letters (a-z)
   # - Numbers (0-9)
   # - Special characters (!@#$%^&*)
   ```

4. **Update the variable:**
   ```bash
   GRAFANA_ADMIN_PASSWORD=YourGeneratedStrongPassword123!
   ```

5. **Start Grafana:**
   ```bash
   make up
   # or
   docker-compose up -d grafana
   ```

6. **Access Grafana:**
   - URL: https://localhost:8090/grafana/
   - Username: `admin`
   - Password: (the one you set in `.env`)

### If Container Fails to Start

**Error message:**
```
Error: GRAFANA_ADMIN_PASSWORD not set in .env
```

**Solution:**
1. Check that `GRAFANA_ADMIN_PASSWORD` exists in your `.env` file
2. Ensure there are no typos in the variable name
3. Make sure `.env` is in the `srcs/` directory
4. Verify the line is not commented out (no `#` at start)

---

## Changing the Admin Password

Because Grafana stores the password in its database, you must reset the database to change it:

### Method 1: Full Reset (Loses Dashboard Customizations)

```bash
cd srcs

# Stop Grafana
docker-compose stop grafana

# Remove the container and volume
docker-compose rm -f grafana
docker volume rm trascendence_grafana_data

# Update password in .env file
nano .env  # Edit GRAFANA_ADMIN_PASSWORD

# Restart Grafana (will recreate with new password)
docker-compose up -d grafana
```

**Note:** Auto-provisioned dashboards (System Overview, Nginx Monitoring) will automatically reload. Manual customizations will be lost.

### Method 2: Using Grafana CLI (Preserves Data)

```bash
# Connect to Grafana container
docker exec -it grafana sh

# Reset admin password
grafana-cli admin reset-admin-password NewPassword123!

# Exit container
exit

# Update .env to match (for documentation)
nano srcs/.env
```

---

## Security Features

### Password Policy
- **Minimum length:** 12 characters
- **Enforced by:** Grafana configuration (`GF_SECURITY_PASSWORD_MIN_LENGTH=12`)
- **Recommendation:** Use 16+ characters with mixed case, numbers, and special characters

### Session Security
- **Session cookie name:** `grafana_session` (custom name for security)
- **Maximum lifetime:** 7 days
- **Automatic expiration:** Sessions expire after 7 days of inactivity
- **Benefits:** Limits exposure if session token is compromised

### Access Control
- **Anonymous access:** Disabled (`GF_AUTH_ANONYMOUS_ENABLED=false`)
- **Public access:** None - reverse proxied through Nginx at `/grafana/` path
- **Network isolation:** Grafana only accessible via internal Docker network
- **External access:** Only through Nginx HTTPS (single entry point)



---

## Troubleshooting

### Problem: Cannot login with password from .env

**Possible causes:**
1. Grafana container was started before password was set
2. Password was changed in `.env` but Grafana database not reset
3. Typo in username (must be exactly `admin`)

**Solution:**
```bash
cd srcs
docker-compose stop grafana
docker-compose rm -f grafana
docker volume rm trascendence_grafana_data
docker-compose up -d grafana
# Wait 15 seconds for initialization
```

### Problem: Container fails with "GRAFANA_ADMIN_PASSWORD not set"

**Cause:** Variable missing or misspelled in `.env`

**Solution:**
1. Open `srcs/.env`
2. Find Grafana section (around line 22-31)
3. Ensure this line exists:
   ```bash
   GRAFANA_ADMIN_PASSWORD=YourPasswordHere
   ```
4. No spaces around `=`
5. Not commented out (no `#` at start)

### Problem: Old password still works after change

**Cause:** Grafana database not reset

**Solution:** See "Changing the Admin Password" section above

### Problem: Password policy error when trying to login

**Cause:** Password in `.env` doesn't meet 12-character minimum

**Solution:**
1. Generate longer password: `openssl rand -base64 24`
2. Update `.env`
3. Reset Grafana database (see Method 1 above)

---

## Security Best Practices

### DO ✅

- ✅ Use unique password for each developer/deployment
- ✅ Use strong password (16+ chars, mixed case, numbers, symbols)
- ✅ Keep `.env` in `.gitignore`
- ✅ Generate password with: `openssl rand -base64 24`
- ✅ Change password if suspected compromise
- ✅ Use password manager to store your Grafana password

### DON'T ❌

- ❌ Commit `.env` to git
- ❌ Share your password with teammates
- ❌ Use common passwords (admin123, password, etc.)
- ❌ Reuse passwords from other services
- ❌ Use fallback/default passwords in production
- ❌ Store password in plain text outside `.env`

---

## Why No Fallback Password?

**Question:** Why not have a default password for convenience?

**Answer:** Fallback passwords create security vulnerabilities:

1. **Everyone uses the same password** (defeats purpose of unique credentials)
2. **Hardcoded in git** (visible in repository history)
3. **Easy to forget to change** (fallback becomes production password)
4. **Known to attackers** (anyone reading docker-compose.yml knows it)

**Our approach:** Force explicit configuration. If password not set, container fails immediately with clear error message. This ensures security cannot be accidentally bypassed.

---

## Environment Variable Syntax Explained

```yaml
"GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:?GRAFANA_ADMIN_PASSWORD not set in .env}"
```

**Breakdown:**
- `${VAR}` - Read environment variable
- `:?` - Error if unset (fail container startup)
- `error message` - Shown when variable missing

**Alternative syntaxes (NOT used):**
- `${VAR:-default}` - Use default if unset (we avoid this for security)
- `${VAR}` - Use empty string if unset (insecure)

---

## Module #42 Compliance

✅ **Requirement:** "Implement secure authentication for Grafana"

**Implementation:**
- Mandatory strong password configuration
- No hardcoded credentials in repository
- Password policy enforcement (12+ characters)
- Session security (7-day max lifetime)
- Anonymous access disabled
- Environment-based configuration (12-factor app)

---

## Additional Resources

### Generate Strong Password
```bash
# Base64 encoded random (recommended)
openssl rand -base64 24

# Hex encoded random
openssl rand -hex 16

# With specific character requirements
openssl rand -base64 32 | tr -dc 'A-Za-z0-9!@#$%^&*' | head -c 20
```

### Check Current Grafana Configuration
```bash
# View all Grafana environment variables
docker inspect grafana --format '{{range .Config.Env}}{{println .}}{{end}}' | grep GF_

# Check if password is set correctly
docker inspect grafana --format '{{range .Config.Env}}{{println .}}{{end}}' | grep ADMIN_PASSWORD
```

### Access Grafana API
```bash
# Test authentication
curl -u admin:YourPassword "http://localhost:3000/api/user"

# Via Nginx proxy
curl -k -u admin:YourPassword "https://localhost:8090/grafana/api/user"
```

---

## Summary

**Access:** https://localhost:8090/grafana/
**Username:** `admin`
**Password:** Set in `srcs/.env` → `GRAFANA_ADMIN_PASSWORD`
**Security:** Mandatory configuration, no defaults, no hardcoded passwords

**Key Points:**
1. Password must be set in `.env` before starting Grafana
2. Each developer uses their own unique password
3. Container fails if password not configured (by design)
4. Password stored in Grafana database (volume)
5. To change password: reset database volume

---

## Questions?

**Q: Where do I set the password?**
A: In `srcs/.env` file, line ~31: `GRAFANA_ADMIN_PASSWORD=YourPasswordHere`

**Q: What if I forget my password?**
A: Reset Grafana database (removes volume) and start fresh with new password from `.env`

**Q: Why does container fail to start?**
A: This is intentional! It ensures you cannot accidentally run Grafana without setting a secure password.

**Q: Do I need to change the password in production?**
A: Yes! Set a strong, unique password in production `.env` that is different from development.
