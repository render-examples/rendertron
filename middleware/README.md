[![Build status](https://img.shields.io/travis/samuelli/bot-render.svg?style=flat-square)](https://travis-ci.org/samuelli/bot-render)
[![NPM version](http://img.shields.io/npm/v/portal-middleware.svg)](https://www.npmjs.com/package/portal-middleware)

# portal-middleware

An Express middleware for [portal](https://github.com/samuelli/bot-render).

portal is a server which runs headless Chrome and renders web pages on the fly, which can be set up to serve pages to search engines, social networks and link rendering bots.

This middleware checks the User-Agent header of incoming requests, and if it matches one of a configurable set of bots, proxies that request through portal.

## Usage
```sh
$ npm install --save express portal-middleware
```

```js
const express = require('express');
const portal = require('portal-middleware');

const app = express();

app.use(portal.makeMiddleware({
  proxyUrl: 'http://my-portal-instance/render',
}));

app.use(express.static('files'));
app.listen(8080);
```

## Configuration

The `makeMiddleware` function takes a configuration object with the following
properties:

| Property | Default | Description |
| -------- | ------- | ----------- |
| `proxyUrl` | *Required* | Base URL of your running portal proxy service. |
| `userAgentPattern` | A set of known bots that benefit from pre-rendering. [Full list.](https://github.com/samuelli/bot-render/blob/master/middleware/src/middleware.ts) | RegExp for matching requests by User-Agent header. |
| `excludeUrlPattern` | A set of known static file extensions. [Full list.](https://github.com/samuelli/bot-render/blob/master/middleware/src/middleware.ts) | RegExp for excluding requests by the path component of the URL. |
| `injectShadyDom` | `false` | Force the web components polyfills to be loaded. [Read more.](https://github.com/samuelli/bot-render#web-components) |
| `timeout` | `11000` | Millisecond timeout for the proxy request to portal. If exceeded, the standard response is served (i.e. `next()` is called). See also the [portal timeout.](https://github.com/samuelli/bot-render#rendering-budget-timeout) |


