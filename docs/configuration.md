# Configuration

Config file names (first found wins when `--config` is omitted):

1. `contractguard.config.json`
2. `.contractguardrc`
3. `.contractguardrc.json`

Example: [`examples/contractguard.config.json`](../examples/contractguard.config.json) and root [`contractguard.config.json`](../contractguard.config.json).

## Schema

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `failOn` | `"breaking" \| "warning" \| "never"` | `"breaking"` | Process / Action failure policy |
| `side` | `"response" \| "request"` | `"response"` | Severity rules for add/remove/required |
| `additiveSeverity` | `"info" \| "warning"` | `"info"` | Severity for new response fields |
| `ignorePaths` | `string[]` | `[]` | Extra ignore globs (merged with defaults) |
| `baseUrl` | `string` | — | Base URL for `capture` |
| `endpoints` | `CaptureEndpoint[]` | — | Endpoints for `capture` |

### `endpoints[]`

| Field | Type | Description |
| --- | --- | --- |
| `name` | `string` | Snapshot filename stem |
| `method` | `GET \| POST \| PUT \| PATCH \| DELETE` | HTTP method |
| `url` | `string` | Absolute URL or path relative to `baseUrl` |
| `headers` | `Record<string, string>` | Optional; supports `${ENV}` |
| `body` | JSON | Optional request body |

## Default ignore paths

Always applied by `compareJson` unless `useDefaultIgnores: false`:

```text
*.created_at
*.updated_at
*.createdAt
*.updatedAt
requestId
*.requestId
```

Patterns match full dotted paths or leaf names (e.g. `*.created_at` matches `created_at` and `user.created_at`).

## Example

```json
{
  "failOn": "breaking",
  "additiveSeverity": "info",
  "side": "response",
  "ignorePaths": ["*.trace_id"],
  "baseUrl": "https://staging.example.com",
  "endpoints": [
    {
      "name": "get-user",
      "method": "GET",
      "url": "/v1/users/me",
      "headers": {
        "Authorization": "Bearer ${CONTRACTGUARD_TOKEN}"
      }
    }
  ]
}
```

## Severity cheat sheet (response side)

| Finding | Severity |
| --- | --- |
| Type change | breaking |
| Field removed | breaking |
| Possible rename | breaking |
| Nullability widened / object→null | breaking |
| Field added | info (or warning if configured) |
| Required loosened | warning |
