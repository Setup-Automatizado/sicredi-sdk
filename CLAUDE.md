# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

TypeScript SDK for Sicredi PIX and Boleto Hibrido (cobv) APIs. Zero runtime dependencies. Dual-runtime support (Bun + Node.js). Published as `@setup-automatizado/sicredi-sdk` on npm.

## Commands

```bash
bun install               # Install dependencies
bun run build             # Build with tsup (ESM + CJS + .d.ts)
bun run typecheck         # TypeScript strict checking (tsc --noEmit)
bun run lint              # Biome lint on src/
bun run lint:fix          # Biome lint with auto-fix
bun run format            # Biome format src/
bun run test              # Run all tests (vitest)
bun run test:watch        # Watch mode
bun run test:coverage     # Coverage with v8 (80% thresholds on branches/functions/lines/statements)
```

Run a single test file:
```bash
bunx vitest run tests/unit/cob-resource.test.ts
```

CI runs: typecheck -> lint -> test:coverage -> build -> verify exports (on Node 18/20/22).

## Architecture

### Lazy Initialization with Proxy Pattern

The `Sicredi` client (`src/client.ts`) uses a **Proxy-based lazy init** pattern. Resource properties (`.cob`, `.cobv`, `.pix`, etc.) are ES Proxies that trigger `_ensureInit()` on first method call. This means certificates are loaded and HTTP clients created only on first API call, not at construction. The `PROXY_PASSTHROUGH` set prevents the proxy from being treated as a thenable.

### Runtime-Adaptive HTTP Client

`src/core/http-client.ts` defines the `HttpClient` interface and a factory `createHttpClient()` that auto-detects the runtime:
- **Bun**: `http-client-bun.ts` — uses `fetch()` with Bun-specific `tls` option for mTLS
- **Node.js**: `http-client-node.ts` — uses `node:https` with a persistent `Agent` (keepAlive, maxSockets=10)

### Core Layer (`src/core/`)

- **`certificate-manager.ts`** — Resolves certificates from file paths or PEM strings. Detects PEM vs DER format. Caches resolved certs.
- **`auth-manager.ts`** — OAuth2 client_credentials flow with token caching. Auto-refreshes 5 minutes before expiry. Deduplicates concurrent refresh requests.
- **`retry.ts`** — Exponential backoff with jitter. Retries on status 408/429/500/502/503/504 and connection errors.

### Resource Layer (`src/resources/`)

All resources extend `BaseResource` (`base.ts`) which provides `request<T>()` with:
- Auto-injects Bearer token (via AuthManager)
- Handles 401/403 with token invalidation
- Parses error responses into typed `SicrediApiError`
- Delegates retry logic to `withRetry()`

Resources: `CobResource`, `CobvResource`, `PixResource`, `LoteCobvResource`, `LocResource`, `WebhookResource`.

### API Versioning Quirk

`cob.get` uses `/api/v3/cob` while all other cob endpoints use `/api/v2/cob`. All other resources use v2. This is defined in `src/utils/constants.ts` → `API_VERSIONS`.

### Error Hierarchy

`SicrediError` (base, has `code` + `hint`) → `SicrediApiError`, `SicrediAuthError`, `SicrediValidationError`, `SicrediConnectionError`, `SicrediCertificateError`. Each has static factory methods for common cases.

### Webhook Handler

`src/webhook-handler/index.ts` — Standalone `parseWebhookPayload()` function (no client instance needed). Validates the Bacen callback payload structure. Note: Sicredi appends `/pix` to configured webhook URLs.

## Code Style

- **Biome** for linting and formatting: single quotes, semicolons, trailing commas, 2-space indent, 100 char line width
- `noNonNullAssertion: off`, `noStaticOnlyClass: off`, `noExplicitAny: warn`
- TypeScript strict mode with `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`

## Build Output

tsup produces `dist/index.js` (ESM), `dist/index.cjs` (CJS), `dist/index.d.ts`, `dist/index.d.cts`. Single entry point at `src/index.ts`.

## Testing

All tests are in `tests/unit/`. Vitest with globals enabled. Coverage excludes `src/index.ts` and `src/types/**`. Tests mock the HTTP client interface — no real API calls.
