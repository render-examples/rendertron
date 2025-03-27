import express from 'express';
import compression from 'compression';
import morgan from 'morgan';
import helmet from 'helmet';
import path from 'path';
import puppeteer from 'puppeteer';

import {Renderer, ScreenshotError} from './renderer';
import {Config, ConfigManager} from './config';
import {AuthMiddleware} from './auth-middleware';

/**
 * Rendertron rendering service. This runs the server which routes rendering
 * requests through to the renderer.
 */
export class Rendertron {
  app: express.Application = express();
  private config: Config = ConfigManager.config;
  private renderer: Renderer|undefined;
  private port = process.env.PORT ? parseInt(process.env.PORT, 10) : undefined;

  async initialize() {
    // Load config
    this.config = await ConfigManager.getConfiguration();

    this.port = this.port || this.config.port;

    const browser = await puppeteer.launch({
      args: this.config.puppeteerArgs,
      headless: true,
      ignoreHTTPSErrors: true
    });
    this.renderer = new Renderer(browser, this.config);

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" }
    }));

    // Other middleware
    this.app.use(morgan('dev'));
    this.app.use(compression());
    this.app.use(express.json());

    // Add authentication middleware
    const authMiddleware = new AuthMiddleware(this.config);
    this.app.use(authMiddleware.middleware());

    // Routes
    this.app.get('/', (_req, res) => {
      res.sendFile(path.resolve(__dirname, '../src/index.html'));
    });

    this.app.get('/_ah/health', (_req, res) => {
      res.send('OK');
    });

    // Optionally enable cache for rendering requests.
    if (this.config.datastoreCache) {
      const { DatastoreCache } = await import('./datastore-cache');
      this.app.use(new DatastoreCache().middleware());
    }

    // API routes
    this.app.get('/render/*', this.handleRenderRequest.bind(this));
    this.app.get('/screenshot/*', this.handleScreenshotRequest.bind(this));
    this.app.post('/screenshot/*', this.handleScreenshotRequest.bind(this));

    return this.app.listen(this.port, () => {
      console.log(`Listening on port ${this.port}`);
    });
  }

  /**
   * Checks whether or not the URL is valid. For example, we don't want to allow
   * the requester to read the file system via Chrome.
   */
  restricted(href: string): boolean {
    try {
      const parsedUrl = new URL(href);
      return !parsedUrl.protocol.match(/^https?:/);
    } catch (e) {
      return true;
    }
  }

  async handleRenderRequest(req: express.Request, res: express.Response) {
    if (!this.renderer) {
      throw (new Error('No renderer initalized yet.'));
    }

    const url = req.params[0];
    if (this.restricted(url)) {
      res.status(403).send('Forbidden');
      return;
    }

    const mobileVersion = 'mobile' in req.query;

    try {
      console.log(`Rendering URL: ${url}`);
      const serialized = await this.renderer.serialize(url, mobileVersion);
      
      if (!serialized || !serialized.content) {
        console.error('No content received from renderer');
        res.status(500).send('Failed to render page: No content received');
        return;
      }

      // Set response headers
      if (serialized.headers) {
        Object.entries(serialized.headers).forEach(([key, value]) => {
          res.set(key, value);
        });
      }

      // Mark the response as coming from Rendertron
      res.set('x-renderer', 'rendertron');
      res.status(serialized.status).send(serialized.content);
    } catch (error: any) {
      console.error('Error handling render request:', error);
      res.status(500).send(`Failed to render page: ${error.message || 'Unknown error'}`);
    }
  }

  async handleScreenshotRequest(req: express.Request, res: express.Response) {
    if (!this.renderer) {
      throw (new Error('No renderer initalized yet.'));
    }

    const url = req.params[0];
    if (this.restricted(url)) {
      res.status(403).send('Forbidden');
      return;
    }

    let options = undefined;
    if (req.method === 'POST' && req.body) {
      options = req.body;
    }

    const dimensions = {
      width: Number(req.query['width']) || this.config.width,
      height: Number(req.query['height']) || this.config.height
    };

    const mobileVersion = 'mobile' in req.query;

    try {
      const img = await this.renderer.screenshot(
        url, mobileVersion, dimensions, options);
      res.set('Content-Type', 'image/jpeg');
      res.set('Content-Length', img.length.toString());
      res.send(img);
    } catch (error) {
      const err = error as ScreenshotError;
      res.status(err.type === 'Forbidden' ? 403 : 500).send(err.message);
    }
  }
}

async function logUncaughtError(error: Error) {
  console.error('Uncaught exception');
  console.error(error);
  process.exit(1);
}

// Start rendertron if not running inside tests.
if (!module.parent) {
  const rendertron = new Rendertron();
  rendertron.initialize();

  process.on('uncaughtException', logUncaughtError);
  process.on('unhandledRejection', logUncaughtError);
}
