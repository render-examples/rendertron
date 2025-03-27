import {Request, Response, NextFunction} from 'express';
import {Config} from './config';

// This is only for development - in production, set RENDERTRON_API_KEY env var
const DEV_API_KEY = '3OB0DLraW0qdJsUFwaVVqOoXNZtmzj1C';

export class AuthMiddleware {
    private config: Config;
    private apiKey: string;

    constructor(config: Config) {
        this.config = config;
        // Use environment variable first, fall back to config, then use dev key
        this.apiKey = process.env.RENDERTRON_API_KEY || this.config.apiKey || DEV_API_KEY;
        console.log('API Key loaded:', this.apiKey ? '(API key is set)' : '(API key is NOT set)');
    }

    middleware() {
        return (req: Request, res: Response, next: NextFunction) => {
            // Skip auth for health check endpoint
            if (req.path === '/_ah/health' || req.path === '/') {
                return next();
            }

            const requestApiKey = req.headers['x-api-key'];
            console.log('Request API Key:', requestApiKey ? '(key provided)' : '(no key provided)');
            
            if (!requestApiKey) {
                res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Missing API key. Please provide an API key in the x-api-key header.'
                });
                return;
            }

            // Type check and comparison 
            const keyMatches = typeof requestApiKey === 'string' && 
                typeof this.apiKey === 'string' && 
                requestApiKey === this.apiKey;
            console.log('API Key match:', keyMatches);

            if (!keyMatches) {
                res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Invalid API key'
                });
                return;
            }

            next();
        };
    }
} 