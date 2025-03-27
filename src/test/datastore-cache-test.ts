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

'use strict';

import test from 'ava';
import express from 'express';
import compression from 'compression';
import request from 'supertest';
import {DatastoreCache} from '../datastore-cache';

const app = express();
app.use(compression());

// Add cache middleware
const cache = new DatastoreCache();
app.use(cache.middleware());

// Test route
app.get('/test', (_req, res) => {
  res.set('Content-Type', 'text/html');
  res.send('<html><body>Test</body></html>');
});

const server: ReturnType<typeof request> = request(app);

test('caches content and serves same content on cache hit', async (t) => {
  const firstResponse = await server.get('/test');
  const secondResponse = await server.get('/test');
  
  t.is(firstResponse.status, 200);
  t.is(secondResponse.status, 200);
  t.is(firstResponse.text, secondResponse.text);
});

test('caches headers', async (t) => {
  const firstResponse = await server.get('/test');
  const secondResponse = await server.get('/test');
  
  t.is(firstResponse.headers['content-type'], 'text/html');
  t.is(secondResponse.headers['content-type'], 'text/html');
});

test('compression preserved', async (t) => {
  const response = await server.get('/test')
    .set('Accept-Encoding', 'gzip');
  
  t.is(response.status, 200);
  t.is(response.headers['content-encoding'], 'gzip');
});

test('original status is preserved', async (t) => {
  const response = await server.get('/test');
  t.is(response.status, 200);
});
