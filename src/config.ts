/*
 * Copyright 2018 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 not
 * use this file except in compliance with the License. You may obtain a copy
 of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 under
 * the License.
 */

'use strict';

import * as fse from 'fs-extra';
import * as path from 'path';

const CONFIG_PATH = path.resolve(__dirname, '../config.json');

export interface Config {
    host: string;
    port: number;
    width: number;
    height: number;
    timeout: number;
    reqHeaders: {[key: string]: string};
    headers: {[key: string]: string};
    puppeteerArgs: string[];
    renderTimeout: number;
    maxRenderTime: number;
    datastoreCache: boolean;
    closeBrowser: boolean;
    restrictedUrlPattern: string[];
    apiKey: string;
}

export class ConfigManager {
    public static config: Config = {
        host: '0.0.0.0',
        port: 3000,
        width: 1000,
        height: 1000,
        timeout: 10000,
        reqHeaders: {},
        headers: {},
        puppeteerArgs: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920,1080',
            '--hide-scrollbars',
            '--disable-notifications',
            '--disable-extensions',
            '--force-device-scale-factor=1',
            '--disable-infobars',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
        ],
        renderTimeout: 10000,
        maxRenderTime: 30000,
        datastoreCache: false,
        closeBrowser: false,
        restrictedUrlPattern: [],
        apiKey: process.env.RENDERTRON_API_KEY || ''
    };

    static async getConfiguration(): Promise<Config> {
        // Load config.json if it exists.
        if (fse.pathExistsSync(CONFIG_PATH)) {
            ConfigManager.config = Object.assign(ConfigManager.config, await fse.readJson(CONFIG_PATH));
        }
        return ConfigManager.config;
    }
}

