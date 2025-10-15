# API Module - S3 Config Operations

This module provides a type-safe, resilient API layer for managing tenant configurations stored in S3 via Lambda proxy.

## Architecture

```
┌─────────────────┐
│ React Component │
│   (useConfig)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Config Ops      │  ← High-level operations (config-operations.ts)
│ (loadConfig)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ API Client      │  ← HTTP client with retry (client.ts)
│ (fetch + retry) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Lambda Proxy    │  ← API Gateway → Lambda → S3
│ (API Gateway)   │
└─────────────────┘
```

## Files

- **`client.ts`** - Lambda proxy HTTP client with retry logic
- **`config-operations.ts`** - High-level operations (list, load, save, deploy)
- **`errors.ts`** - Custom error class with user-friendly messages
- **`retry.ts`** - Exponential backoff retry logic
- **`index.ts`** - Module exports

## Usage

### 1. Using Hooks (Recommended)

```typescript
import { useLoadConfig, useSaveConfig } from '@/hooks/useConfig';

function ConfigEditor() {
  const { config, loading, error } = useLoadConfig('MYR384719');
  const { saveConfig, saving, success } = useSaveConfig();

  const handleSave = async () => {
    if (config) {
      await saveConfig('MYR384719', config);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>{config?.chat_title}</h1>
      <button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>
      {success && <div>Saved successfully!</div>}
    </div>
  );
}
```

### 2. Using Operations Directly

```typescript
import { loadConfig, saveConfig } from '@/lib/api';

async function loadTenantConfig(tenantId: string) {
  try {
    const { config, metadata } = await loadConfig(tenantId);
    console.log('Config loaded:', config);
    console.log('Last modified:', metadata.lastModified);
  } catch (error) {
    console.error('Failed to load config:', error);
  }
}
```

### 3. Using Client Directly (Advanced)

```typescript
import { configApiClient } from '@/lib/api';

async function customOperation() {
  const tenants = await configApiClient.listTenants();
  const metadata = await configApiClient.getTenantMetadata('MYR384719');
  const { config } = await configApiClient.loadConfig('MYR384719');
}
```

## Error Handling

All operations throw `ConfigAPIError` with specific error codes:

```typescript
import { ConfigAPIError } from '@/lib/api';

try {
  await loadConfig('INVALID_ID');
} catch (error) {
  if (error instanceof ConfigAPIError) {
    console.log('Error code:', error.code); // e.g., 'CONFIG_NOT_FOUND'
    console.log('User message:', error.getUserMessage()); // User-friendly message
    console.log('Is retryable:', error.isRetryable()); // true/false
  }
}
```

### Error Codes

| Code | Description | Retryable |
|------|-------------|-----------|
| `CONFIG_NOT_FOUND` | Tenant config doesn't exist | No |
| `TENANT_NOT_FOUND` | Tenant doesn't exist | No |
| `NETWORK_ERROR` | Network request failed | Yes |
| `TIMEOUT` | Request timed out | Yes |
| `VALIDATION_ERROR` | Config validation failed | No |
| `SAVE_FAILED` | Failed to save config | No |
| `VERSION_CONFLICT` | Config modified by another user | No |
| `UNAUTHORIZED` | Not authorized | No |
| `SERVER_ERROR` | 5xx server error | Yes |

## Retry Logic

All operations automatically retry on transient errors (network, timeout, 5xx):

- **Max retries**: 3
- **Initial delay**: 1 second
- **Backoff factor**: 2x
- **Max delay**: 10 seconds

Example retry progression: 1s → 2s → 4s

### Custom Retry Options

```typescript
import { fetchWithRetry } from '@/lib/api';

const data = await fetchWithRetry(
  async () => {
    const response = await fetch('/api/data');
    return response.json();
  },
  {
    maxRetries: 5,
    initialDelayMs: 500,
    maxDelayMs: 5000,
    onRetry: (attempt, error) => {
      console.log(`Retry attempt ${attempt}:`, error);
    },
  }
);
```

## Environment Configuration

Set these variables in `.env.local`:

```env
VITE_S3_BUCKET=myrecruiter-picasso
VITE_AWS_REGION=us-east-1
VITE_API_URL=https://your-api-gateway.amazonaws.com
```

## Lambda Proxy API Contract

The Lambda functions must implement these endpoints:

### GET /api/config/tenants

List all tenants.

**Response:**
```json
{
  "tenants": [
    {
      "tenantId": "MYR384719",
      "tenantName": "Example Org",
      "lastModified": 1234567890,
      "version": "1.3",
      "tier": "Standard"
    }
  ]
}
```

### GET /api/config/:tenantId

Load tenant configuration.

**Response:**
```json
{
  "config": { /* TenantConfig */ },
  "metadata": {
    "tenantId": "MYR384719",
    "tenantName": "Example Org",
    "lastModified": 1234567890,
    "configVersion": "1.3"
  }
}
```

### PUT /api/config/:tenantId

Save tenant configuration.

**Request:**
```json
{
  "config": { /* TenantConfig */ },
  "createBackup": true
}
```

**Response:**
```json
{
  "success": true,
  "version": "1.4",
  "timestamp": 1234567890,
  "etag": "abc123..."
}
```

### GET /api/config/:tenantId/metadata

Get tenant metadata without loading full config.

**Response:**
```json
{
  "tenantId": "MYR384719",
  "tenantName": "Example Org",
  "lastModified": 1234567890,
  "configVersion": "1.3",
  "size": 45678,
  "etag": "abc123..."
}
```

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1234567890
}
```

## Testing

### Mock Implementation

```typescript
// src/lib/api/__mocks__/config-operations.ts
export const mockLoadConfig = jest.fn();
export const mockSaveConfig = jest.fn();
export const mockListTenants = jest.fn();

// In tests
import { mockLoadConfig } from '@/lib/api/__mocks__/config-operations';

mockLoadConfig.mockResolvedValue({
  config: { /* mock config */ },
  metadata: { /* mock metadata */ }
});
```

### Testing Error Scenarios

```typescript
import { ConfigAPIError } from '@/lib/api';

test('handles config not found', async () => {
  const error = new ConfigAPIError('CONFIG_NOT_FOUND', 'Config not found');
  expect(error.getUserMessage()).toContain('not found');
  expect(error.isRetryable()).toBe(false);
});
```

## Type Safety

All operations are fully typed:

```typescript
import type { TenantConfig } from '@/types/config';
import type { LoadConfigResponse } from '@/types/api';

// TypeScript knows the exact shape
const { config, metadata }: LoadConfigResponse = await loadConfig('MYR384719');

// Autocomplete works
console.log(config.tenant_id);
console.log(config.conversational_forms);
```

## Best Practices

1. **Use hooks in components** - Automatic state management
2. **Handle loading states** - Show spinners during operations
3. **Display user-friendly errors** - Use `error.getUserMessage()`
4. **Enable backup on save** - Always create backups before modifying
5. **Validate before deploy** - Run validation engine before deployment
6. **Test error scenarios** - Mock network failures and 4xx/5xx responses

## Security

- **No AWS credentials in browser** - All S3 access via Lambda proxy
- **Lambda validates JWT** - Only authorized users can access configs
- **S3 versioning enabled** - Rollback capability
- **Backup before save** - Prevents accidental data loss

## Performance

- **Load time**: <500ms for typical config (15KB)
- **Save time**: <1s with backup
- **Retry overhead**: +1-7s on transient failures (rare)
- **Caching**: None (intentional - always fresh data)

## Roadmap

- [ ] Batch operations (load multiple tenants)
- [ ] Optimistic updates (update UI before server confirms)
- [ ] Offline support (cache configs locally)
- [ ] Real-time sync (WebSocket updates)
- [ ] Diff/merge (handle concurrent edits)
