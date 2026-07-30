# Railway Environment Variables Checklist

This document lists all environment variables that need to be set in the Railway dashboard for the StormCash deployment.

## Project Structure
- **Postgres**: Railway managed addon (provides DATABASE_URL automatically)
- **django-api**: Django service (apps/django-api)
- **fastapi**: FastAPI service (apps/fastapi)

## Shared Variables (Set at Project Level)
These variables are shared between both services and should be set at the project level in Railway:

| Variable | Description | Example Value | Notes |
|----------|-------------|---------------|-------|
| `JWT_SECRET_KEY` | Secret key for JWT token signing | `your-super-secret-key-change-in-production` | Must be identical for both Django and FastAPI services |
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` | Must be identical for both Django and FastAPI services |

## Django Service Variables (apps/django-api)

| Variable | Description | Example Value | Notes |
|----------|-------------|---------------|-------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:port/db` | **Automatically provided by Railway Postgres addon** - do not set manually |
| `DJANGO_SECRET_KEY` | Django's secret key for cryptographic signing | `django-insecure-change-in-production` | Generate a random string for production |
| `DEBUG` | Django debug mode | `False` | Set to `False` in production |
| `ALLOWED_HOSTS` | Comma-separated list of allowed hostnames | `*.up.railway.app,yourdomain.com` | Include Railway's domain and any custom domains |
| `CSRF_TRUSTED_ORIGINS` | Comma-separated list of trusted origins for CSRF | `https://stormcash-django-production.up.railway.app` | Required for Django admin login in production behind HTTPS proxy |
| `JWT_SECRET_KEY` | (Shared - see above) | - | Must match FastAPI's JWT_SECRET_KEY |
| `JWT_ALGORITHM` | (Shared - see above) | - | Must match FastAPI's JWT_ALGORITHM |

## FastAPI Service Variables (apps/fastapi)

| Variable | Description | Example Value | Notes |
|----------|-------------|---------------|-------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:port/db` | **Must be the same as Django's DATABASE_URL** - Railway provides this automatically |
| `JWT_SECRET_KEY` | (Shared - see above) | - | Must match Django's JWT_SECRET_KEY |
| `JWT_ALGORITHM` | (Shared - see above) | - | Must match Django's JWT_ALGORITHM |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins | `https://your-frontend.vercel.app,https://localhost:3000` | Set to your frontend domain(s) once deployed |

## Setup Instructions

1. **Create Railway Project**
   - Create a new project in Railway
   - Add a Postgres database addon

2. **Set Project-Level Variables**
   - Go to project settings → Variables
   - Add `JWT_SECRET_KEY` with a strong random string
   - Add `JWT_ALGORITHM` with value `HS256`

3. **Deploy Django Service**
   - Connect `apps/django-api` as a new service
   - **IMPORTANT**: Set the Root Directory to `apps/django-api` in Railway's service settings (this is NOT automatic)
   - Railway will automatically inject `DATABASE_URL` from the Postgres addon
   - Set Django-specific variables:
     - `DJANGO_SECRET_KEY`: Generate a random string
     - `DEBUG`: `False`
     - `ALLOWED_HOSTS`: `*.up.railway.app` (plus any custom domains)
     - `CSRF_TRUSTED_ORIGINS`: Your Railway domain (e.g., `https://stormcash-django-production.up.railway.app`)

4. **Deploy FastAPI Service**
   - Connect `apps/fastapi` as a new service
   - **IMPORTANT**: Set the Root Directory to `apps/fastapi` in Railway's service settings (this is NOT automatic)
   - Railway will automatically inject `DATABASE_URL` from the Postgres addon
   - Set `CORS_ORIGINS`: Your frontend domain(s) (required - app will fail if not set)

## Important Notes

- **DATABASE_URL**: Do NOT set this manually. Railway automatically provides it from the Postgres addon to both services.
- **JWT_SECRET_KEY**: This MUST be identical between Django and FastAPI, as FastAPI validates tokens issued by Django.
- **ALLOWED_HOSTS**: Must include Railway's domain pattern `*.up.railway.app` for the service to work.
- **CORS_ORIGINS**: Set this to your actual frontend domain once deployed. For initial testing, you can leave it as `*` (not recommended for production).
- **DEBUG**: Always set to `False` in production for security.
