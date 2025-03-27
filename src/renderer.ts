import * as puppeteer from 'puppeteer';
import {Config} from './config';

export type SerializedResponse = {
  status: number;
  content: string;
  headers: Record<string, string>;
};

export type ScreenshotError = {
  type: 'Forbidden' | 'Error';
  message: string;
};

/**
 * Wraps Puppeteer's interface to Headless Chrome to expose high level rendering
 * APIs that are able to handle web components and PWAs.
 * 
 * Note: There are known type issues with Puppeteer's HTTPResponse type.
 * The response.status() method exists at runtime but is not properly typed
 * in the TypeScript definitions. This is a known issue with @types/puppeteer.
 */
export class Renderer {
  private browser: puppeteer.Browser;
  private config: Config;

  constructor(browser: puppeteer.Browser, config: Config) {
    this.browser = browser;
    this.config = config;
  }

  async serialize(_url: string, _mobileVersion: boolean): Promise<SerializedResponse> {
    const page = await this.browser.newPage();
    let response: puppeteer.HTTPResponse | null = null;

    // Set viewport
    await page.setViewport({
      width: this.config.width,
      height: this.config.height,
      deviceScaleFactor: 1,
    });

    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // Enable request interception for debugging
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = request.url();
      
      // Block only truly unnecessary resources
      if (
        // Block known tracking and analytics scripts
        url.includes('google-analytics.com') ||
        url.includes('googletagmanager.com') ||
        url.includes('hotjar.com') ||
        url.includes('clarity.ms') ||
        url.includes('drift.com') ||
        url.includes('datadoghq-browser-agent.com') ||
        // Block third-party fonts that aren't essential
        url.includes('fonts.gstatic.com') ||
        // Block known ad networks
        url.includes('doubleclick.net') ||
        url.includes('adnxs.com') ||
        url.includes('advertising.com')
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Listen for response
    page.on('response', (r: puppeteer.HTTPResponse) => {
      response = r;
      console.log(`Response: ${r.status()} ${r.url()}`);
    });

    try {
      // Set longer timeout for initial navigation
      await page.setDefaultNavigationTimeout(60000); // 60 seconds

      // Navigate to page with more lenient wait conditions
      await page.goto(_url, {
        waitUntil: ['domcontentloaded', 'networkidle0'],
        timeout: 60000,
      });

      // Wait for the page to be fully loaded with a shorter timeout
      await page.waitForFunction(() => document.readyState === 'complete', {
        timeout: 10000
      });

      // Get status code
      const statusCode = response ? await (response as puppeteer.HTTPResponse).status() : 200;

      // Get content
      const result = await page.content();
      
      if (!result || result.length === 0) {
        throw new Error('No content received from page');
      }

      // Set content type header
      const headers = response ? await (response as puppeteer.HTTPResponse).headers() : {};
      const contentType = headers['content-type'] || 'text/html; charset=utf-8';

      return {
        status: statusCode,
        content: result,
        headers: {
          'content-type': contentType
        }
      };
    } catch (error) {
      console.error(`Error rendering ${_url}:`, error);
      // If we have partial content, return it with a warning
      try {
        const result = await page.content();
        if (result && result.length > 0) {
          return {
            status: 200,
            content: result,
            headers: {
              'content-type': 'text/html; charset=utf-8',
              'x-renderer-warning': 'Page load incomplete'
            }
          };
        }
      } catch (e) {
        console.error('Failed to get partial content:', e);
      }
      throw error;
    } finally {
      await page.close();
    }
  }

  async screenshot(_url: string, _mobileVersion: boolean, dimensions: {width: number, height: number}, options?: object): Promise<Buffer> {
    const page = await this.browser.newPage();
    let response: puppeteer.HTTPResponse | null = null;

    // Set viewport
    await page.setViewport({
      width: dimensions.width,
      height: dimensions.height,
      deviceScaleFactor: 1,
    });

    // Set user agent
    await page.setUserAgent('Rendertron');

    // Listen for response
    page.on('response', (r: puppeteer.HTTPResponse) => {
      response = r;
    });

    try {
      // Navigate to page
      await page.goto(_url, {
        waitUntil: 'networkidle0',
        timeout: this.config.timeout,
      });

      // Get status code
      const statusCode = response ? await (response as puppeteer.HTTPResponse).status() : 200;
      if (statusCode !== 200) {
        throw new Error(`Screenshot failed with status ${statusCode}`);
      }

      // Take screenshot
      const screenshotOptions: puppeteer.ScreenshotOptions = {
        type: 'jpeg',
        encoding: 'binary',
        ...options
      };

      const buffer = await page.screenshot(screenshotOptions) as Buffer;
      return buffer;
    } finally {
      await page.close();
    }
  }
}
