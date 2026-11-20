# Data Models & Schemas (Schema.md)
## Project: Ciphercop 2026 Ai Smart

### 1. Primary Entity State
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Ciphercop2026AiSmartState",
  "type": "object",
  "required": ["sessionId", "timestamp", "status"],
  "properties": {
    "sessionId": { "type": "string" },
    "timestamp": { "type": "integer" },
    "status": { "type": "string", "enum": ["IDLE", "RUNNING", "VERIFIED", "FAILED"] },
    "metadata": { "type": "object" }
  }
}
```

### 2. Memory URI Mapping
- **Active State:** `viking://projects/ciphercop-2026-ai-smart/state`
- **Telemetry Snapshots:** `viking://projects/ciphercop-2026-ai-smart/telemetry`
- **Security Checkpoints:** `viking://projects/ciphercop-2026-ai-smart/security`
