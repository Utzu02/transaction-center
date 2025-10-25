# 🔐 Environment Variables Configuration

## Overview

This project uses environment variables to manage sensitive configuration like API keys and server URLs. All environment variables must be prefixed with `VITE_` to be accessible in the frontend.

## Files

### `.env.example`
Template file with example values. **Safe to commit to Git**.

### `.env`
Your personal configuration with real API keys. **NEVER commit this file**.

### `.gitignore`
Already configured to exclude `.env` files from Git.

## Setup Instructions

### 1. Create your .env file

```bash
cp .env.example .env
```

### 2. Add your API key

Edit `.env` and replace `YOUR_API_KEY_HERE` with your actual API key:

```env
VITE_API_KEY=your_actual_api_key_here
```

### 3. Restart dev server

If the dev server is running, restart it to load the new environment variables:

```bash
npm run dev
```

## Available Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_STREAM_URL` | SSE stream endpoint for hackathon | `https://95.217.75.14:8443/stream` |
| `VITE_FLAG_URL` | Endpoint to flag transactions | `https://95.217.75.14:8443/api/flag` |
| `VITE_API_KEY` | Your personal API key for authentication | *(empty)* |
| `VITE_WEBSOCKET_URL` | WebSocket URL for local development | `ws://localhost:8080/stream` |
| `VITE_DEFAULT_CONNECTION_TYPE` | Default connection type (`sse` or `websocket`) | `sse` |

## Usage in Code

### Accessing environment variables

```javascript
// In any .js/.jsx file
const streamUrl = import.meta.env.VITE_STREAM_URL;
const apiKey = import.meta.env.VITE_API_KEY;
```

### Using with SSE service

```javascript
import sseService from './services/sse';

// Option 1: Use environment variables automatically
sseService.connect(
  import.meta.env.VITE_STREAM_URL,
  import.meta.env.VITE_API_KEY
);

// Option 2: Pass null to use environment variables
sseService.flagTransaction(null, null, 'trans_123', 1);
```

### UI indicator

The Live Monitor Control will show a green checkmark if your API key is loaded:

```
✅ API Key loaded from .env file
```

## Troubleshooting

### Variables not loading?

1. **Check filename**: Must be exactly `.env` (not `.env.txt`)
2. **Check prefix**: All variables must start with `VITE_`
3. **Restart server**: Environment variables are loaded at build time
4. **Check quotes**: Don't use quotes around values in .env

### API Key not working?

1. Verify the key is correct in `.env`
2. Check no extra spaces or newlines
3. Ensure the dev server was restarted after adding the key

## Security Best Practices

✅ **DO:**
- Keep `.env` in `.gitignore`
- Use different API keys for dev/production
- Share `.env.example` with your team
- Document all variables in this file

❌ **DON'T:**
- Commit `.env` to Git
- Share your API key publicly
- Hardcode API keys in source code
- Use production keys in development

## Local Development Override

For local development with different settings, create `.env.local`:

```env
# This file takes precedence over .env
VITE_WEBSOCKET_URL=ws://localhost:3000/stream
VITE_DEFAULT_CONNECTION_TYPE=websocket
```

## Production Build

When building for production, environment variables are embedded at build time:

```bash
# Build with production values
npm run build
```

Make sure your production environment has the correct values set before building!
