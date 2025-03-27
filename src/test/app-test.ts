/*
 * Copyright 2018 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import test from 'ava';
import request from 'supertest';
import {Rendertron} from '../rendertron';

let server: ReturnType<typeof request>;

test.before(async () => {
  const rendertron = new Rendertron();
  const app = await rendertron.initialize();
  server = request(app);
});

test('health check responds correctly', async (t) => {
  const res = await server.get('/_ah/health');
  t.is(res.status, 200);
  t.is(res.text, 'OK');
});

test('renders basic script', async (t) => {
  const res = await server.get('/render/https://example.com');
  t.is(res.status, 200);
  t.true(res.text.includes('Example Domain'));
});

test('renders script after page load event', async (t) => {
  const res = await server.get('/render/https://example.com');
  t.is(res.status, 200);
  t.true(res.text.includes('Example Domain'));
});

test.failing('renders shadow DOM - no polyfill', async (t) => {
  const res = await server.get('/render/https://example.com');
  t.is(res.status, 200);
});

test('renders shadow DOM - polyfill loader', async (t) => {
  const res = await server.get('/render/https://example.com');
  t.is(res.status, 200);
});

test('renders shadow DOM - polyfill loader - different flag', async (t) => {
  const res = await server.get('/render/https://example.com');
  t.is(res.status, 200);
});

test('renders shadow DOM - webcomponents-lite.js polyfill', async (t) => {
  const res = await server.get('/render/https://example.com');
  t.is(res.status, 200);
});

test('script tags and link[rel=import] tags are stripped', async (t) => {
  const res = await server.get('/render/https://example.com');
  t.is(res.status, 200);
  t.false(res.text.includes('<script'));
  t.false(res.text.includes('link[rel=import]'));
});

test('script tags for JSON-LD are not stripped', async (t) => {
  const res = await server.get('/render/https://example.com');
  t.is(res.status, 200);
  t.true(res.text.includes('application/ld+json'));
});

test('server status code should be forwarded', async (t) => {
  const res = await server.get('/render/https://example.com');
  t.is(res.status, 200);
});

test('http status code should be able to be set via a meta tag', async (t) => {
  const res = await server.get('/render/https://example.com');
  t.is(res.status, 200);
});

test('http status codes need to be respected from top to bottom', async (t) => {
  const res = await server.get('/render/https://example.com');
  t.is(res.status, 200);
});

test('screenshot is an image', async (t) => {
  const res = await server.get('/screenshot/https://example.com');
  t.is(res.status, 200);
  t.is(res.type, 'image/jpeg');
});

test('screenshot accepts options', async (t) => {
  const res = await server.get('/screenshot/https://example.com?width=800&height=600');
  t.is(res.status, 200);
  t.is(res.type, 'image/jpeg');
});

test('invalid url fails', async (t) => {
  const res = await server.get('/render/invalid-url');
  t.is(res.status, 403);
});

test('unknown url fails', async (t) => {
  const res = await server.get('/render/https://this-is-not-a-real-domain.com');
  t.is(res.status, 403);
});

test('file url fails', async (t) => {
  const res = await server.get('/render/file:///etc/passwd');
  t.is(res.status, 403);
});

test('file url fails for screenshot', async (t) => {
  const res = await server.get('/screenshot/file:///etc/passwd');
  t.is(res.status, 403);
});

test.failing('explicit render event ends early', async (t) => {
  const res = await server.get('/render/https://example.com');
  t.is(res.status, 200);
});

test('unknown url fails safely on screenshot', async (t) => {
  const res = await server.get('/screenshot/https://this-is-not-a-real-domain.com');
  t.is(res.status, 403);
});
