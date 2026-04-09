# API Contract (v1)

Base URL:

- Local: `http://localhost:3001`
- Production (default): `https://wearable-investor-demo-api.onrender.com`

## Response envelope

Success:

```json
{
  "success": true,
  "data": {}
}
```

Failure:

```json
{
  "success": false,
  "error": {
    "code": "REQUEST_ERROR",
    "message": "Invalid request body",
    "requestId": "uuid"
  }
}
```

## `GET /health`

Purpose: liveness/health check for Render and uptime monitors.

Example response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-04-09T03:15:00.000Z"
  }
}
```

## `POST /v1/ai/generate`

Purpose: server-side AI generation for investor demo interactions.

Request body:

```json
{
  "prompt": "请解释第7.2条延期违约风险",
  "systemPrompt": "可选。覆盖默认系统提示词"
}
```

Validation:

- `prompt`: required, 8-2000 chars
- `systemPrompt`: optional, 1-1000 chars

Example success response:

```json
{
  "success": true,
  "data": {
    "text": "这条款意味着...",
    "model": "gemini-1.5-flash",
    "provider": "gemini"
  }
}
```

## Planned extension endpoints

Reserved for productization:

- `POST /v1/session`
- `POST /v1/telemetry/event`
