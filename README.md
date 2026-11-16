# Webhook relay

A Vercel function that only accepts `POST` requests carrying the secret code,
and forwards every other argument to a Discord webhook.

## Setup (Vercel → Project → Settings → Environment Variables)

| Name | Value |
| --- | --- |
| `SECRET_CODE` | your secret code |
| `DISCORD_WEBHOOK_URL` | your Discord webhook URL |

Redeploy after adding them. They are not stored in this repo, since it is public.

## Usage

Endpoint: `https://<your-app>.vercel.app/` (or `/api/webhook`)

Send the secret in any one of these:
- header `x-secret: <code>`
- header `Authorization: Bearer <code>`
- body or query field `secret` (also `code`, `secret_code`, `secretCode`)

Everything else (JSON/form body fields plus query parameters) is forwarded to
Discord. If the body has Discord fields (`content` / `embeds`), it is passed
through as-is; otherwise it is posted as a JSON code block (or as an attached
file if it's over 2000 characters).

```bash
curl -X POST https://<your-app>.vercel.app/ \
  -H "Content-Type: application/json" \
  -d '{"secret":"<code>","user":"bob","event":"signup"}'
```

Responses: `200` sent, `401` wrong/missing secret, `405` not POST,
`400` nothing to send, `500` env vars missing, `502` Discord error.
