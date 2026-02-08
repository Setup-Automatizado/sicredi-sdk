import { AuthManager } from './core/auth-manager';
import { CertificateManager } from './core/certificate-manager';
import { createHttpClient } from './core/http-client';
import type { ResourceConfig } from './resources/base';
import { CobResource } from './resources/cob';
import { CobvResource } from './resources/cobv';
import { LocResource } from './resources/loc';
import { LoteCobvResource } from './resources/lotecobv';
import { PixResource } from './resources/pix';
import { WebhookResource } from './resources/webhook';
import type { SicrediConfig } from './types/config';
import { DEFAULT_MAX_RETRIES, DEFAULT_TIMEOUT, SICREDI_URLS } from './utils/constants';

// Properties that should NOT be intercepted by the proxy.
// Returning undefined for 'then' prevents the proxy from being treated as a thenable/Promise.
const PROXY_PASSTHROUGH = new Set(['then', 'catch', 'finally', 'toJSON', 'toString', 'valueOf']);

export class Sicredi {
  readonly cob: CobResource;
  readonly cobv: CobvResource;
  readonly pix: PixResource;
  readonly lotecobv: LoteCobvResource;
  readonly loc: LocResource;
  readonly webhook: WebhookResource;

  private readonly _config: Required<
    Pick<SicrediConfig, 'environment' | 'timeout' | 'maxRetries' | 'debug'>
  > &
    SicrediConfig;

  private _initPromise: Promise<void> | null = null;
  private _cob: CobResource | null = null;
  private _cobv: CobvResource | null = null;
  private _pix: PixResource | null = null;
  private _lotecobv: LoteCobvResource | null = null;
  private _loc: LocResource | null = null;
  private _webhook: WebhookResource | null = null;

  constructor(config: SicrediConfig) {
    this._config = {
      ...config,
      environment: config.environment ?? 'production',
      timeout: config.timeout ?? DEFAULT_TIMEOUT,
      maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
      debug: config.debug ?? false,
    };

    const self = this;

    this.cob = new Proxy({} as CobResource, {
      get(_target, prop) {
        if (typeof prop !== 'string' || PROXY_PASSTHROUGH.has(prop)) return undefined;
        return async (...args: unknown[]) => {
          await self._ensureInit();
          const method = (self._cob as unknown as Record<string, unknown>)[prop];
          if (typeof method === 'function') {
            return method.apply(self._cob, args);
          }
          return method;
        };
      },
    });

    this.cobv = new Proxy({} as CobvResource, {
      get(_target, prop) {
        if (typeof prop !== 'string' || PROXY_PASSTHROUGH.has(prop)) return undefined;
        return async (...args: unknown[]) => {
          await self._ensureInit();
          const method = (self._cobv as unknown as Record<string, unknown>)[prop];
          if (typeof method === 'function') {
            return method.apply(self._cobv, args);
          }
          return method;
        };
      },
    });

    this.pix = new Proxy({} as PixResource, {
      get(_target, prop) {
        if (typeof prop !== 'string' || PROXY_PASSTHROUGH.has(prop)) return undefined;
        return async (...args: unknown[]) => {
          await self._ensureInit();
          const method = (self._pix as unknown as Record<string, unknown>)[prop];
          if (typeof method === 'function') {
            return method.apply(self._pix, args);
          }
          return method;
        };
      },
    });

    this.lotecobv = new Proxy({} as LoteCobvResource, {
      get(_target, prop) {
        if (typeof prop !== 'string' || PROXY_PASSTHROUGH.has(prop)) return undefined;
        return async (...args: unknown[]) => {
          await self._ensureInit();
          const method = (self._lotecobv as unknown as Record<string, unknown>)[prop];
          if (typeof method === 'function') {
            return method.apply(self._lotecobv, args);
          }
          return method;
        };
      },
    });

    this.loc = new Proxy({} as LocResource, {
      get(_target, prop) {
        if (typeof prop !== 'string' || PROXY_PASSTHROUGH.has(prop)) return undefined;
        return async (...args: unknown[]) => {
          await self._ensureInit();
          const method = (self._loc as unknown as Record<string, unknown>)[prop];
          if (typeof method === 'function') {
            return method.apply(self._loc, args);
          }
          return method;
        };
      },
    });

    this.webhook = new Proxy({} as WebhookResource, {
      get(_target, prop) {
        if (typeof prop !== 'string' || PROXY_PASSTHROUGH.has(prop)) return undefined;
        return async (...args: unknown[]) => {
          await self._ensureInit();
          const method = (self._webhook as unknown as Record<string, unknown>)[prop];
          if (typeof method === 'function') {
            return method.apply(self._webhook, args);
          }
          return method;
        };
      },
    });
  }

  private get baseUrl(): string {
    return this._config.baseUrl ?? SICREDI_URLS[this._config.environment];
  }

  private async _ensureInit(): Promise<void> {
    if (this._cob) return;
    if (!this._initPromise) {
      this._initPromise = this._initialize().catch((err) => {
        this._initPromise = null;
        throw err;
      });
    }
    await this._initPromise;
  }

  private async _initialize(): Promise<void> {
    const certManager = new CertificateManager(this._config.certificate);
    const certificates = certManager.resolve();

    const httpClient = await createHttpClient({
      certificates,
      timeout: this._config.timeout,
      debug: this._config.debug,
    });

    const authManager = new AuthManager(
      this._config.clientId,
      this._config.clientSecret,
      this.baseUrl,
      httpClient,
    );

    const resourceConfig: ResourceConfig = {
      baseUrl: this.baseUrl,
      httpClient,
      authManager,
      retryOptions: { maxRetries: this._config.maxRetries },
      debug: this._config.debug,
    };

    this._cob = new CobResource(resourceConfig);
    this._cobv = new CobvResource(resourceConfig);
    this._pix = new PixResource(resourceConfig);
    this._lotecobv = new LoteCobvResource(resourceConfig);
    this._loc = new LocResource(resourceConfig);
    this._webhook = new WebhookResource(resourceConfig);
  }
}
