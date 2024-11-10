import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';
import Anthropic from '@anthropic-ai/sdk';
import rateLimit from 'express-rate-limit';
import { validateSingleTranslation, validateBulkTranslation } from '../../src/validators.js';
import { buildPrompt, parseResponse, getSystemPrompt, getUserPrompt } from '../../src/promptUtils.js';
import 'dotenv/config'

const app = express();
const router = express.Router();

// // Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['POST'],
}));


app.use((req, res, next) => {
    console.log('Request Path:', req.path);
    console.log('Request Method:', req.method);
    next();
});


// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
});

app.use(limiter);

// Single translation endpoint
router.post('/translate', validateSingleTranslation, async (req, res) => {
    // return res.json(mockSingleResponse());

    try {
        const { cvPoint, targetDomain, jobDescription } = req.body;
        const message = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1024,
            temperature: 0.7,
            system: getSystemPrompt(),
            messages: [
                { role: "user", content: getUserPrompt(cvPoint, targetDomain, jobDescription) }
            ]
        });

        const response = JSON.parse(parseResponse(message.content[0].text));
        console.log(response.translatedPoint);

        res.json({
            translatedPoint: response.translatedPoint,
            domainAlignment: response.domainAlignment,
            preservedElements: response.preservedElements
        });
    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({ error: 'Failed to translate CV point' });
    }
});

// // Bulk translation endpoint
router.post('/translate-bulk', validateBulkTranslation, async (req, res) => {
    // return res.json(mockBulkResponse());
    try {
        const { cvPoints, targetDomain, jobDescription } = req.body;

        const results = await Promise.all(
            cvPoints.map(async (cvPoint) => {
                const prompt = buildPrompt(cvPoint, targetDomain, jobDescription);

                const message = await anthropic.messages.create({
                    model: "claude-3-haiku-20240307",
                    max_tokens: 1024,
                    temperature: 0.7,
                    system: getSystemPrompt(),
                    messages: [
                        { role: "user", content: getUserPrompt(cvPoint, targetDomain, jobDescription) }
                    ]
                });

                const response = JSON.parse(parseResponse(message.content[0].text));
                return {
                    original: cvPoint,
                    translated: response.translatedPoint,
                    domainAlignment: response.domainAlignment,
                    preservedElements: response.preservedElements
                };
            })
        );
        console.log({ results })
        res.json({ results });
    } catch (error) {
        console.error('Bulk translation error:', error);
        res.status(500).json({ error: 'Failed to translate CV points' });
    }
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});



// Optional: More detailed health check if needed
router.get('/health/detailed', (req, res) => {
    // You could add more checks here as needed
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks: {
            server: true,
            llm: process.env.ANTHROPIC_API_KEY ? true : false,
            memory: process.memoryUsage().heapUsed < 1024 * 1024 * 500 // Alert if using more than 500MB
        },
        uptime: process.uptime()
    };

    // If any check fails, mark as unhealthy
    if (Object.values(health.checks).some(check => !check)) {
        health.status = 'unhealthy';
        res.status(503); // Service Unavailable
    }

    res.json(health);
});

// Base path handler
router.get('/', (req, res) => {
    res.json({ message: 'API is running' });
});

router.get("/hello", (req, res) => res.send("Hello World!"));


router.use('*', (req, res) => {
    console.log(req);
    res.json({
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
});

// Export the handler
app.use('/api', router);
export const handler = serverless(app);


// import express from 'express';
// import cors from 'cors';
// import serverless from 'serverless-http';

// const app = express();
// const router = express.Router();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Debugging middleware for the main app
// app.use((req, res, next) => {
//     console.log('App Level - Original URL:', req.originalUrl);
//     console.log('App Level - Base URL:', req.baseUrl);
//     console.log('App Level - Path:', req.path);
//     next();
// });

// // Debugging middleware for the router
// router.use((req, res, next) => {
//     console.log('Router Level - Original URL:', req.originalUrl);
//     console.log('Router Level - Base URL:', req.baseUrl);
//     console.log('Router Level - Path:', req.path);
//     next();
// });

// // Routes
// router.get('/hello', (req, res) => {
//     console.log('Hello route hit');
//     res.json({ message: "Hello World!" });
// });

// router.get('/health', (req, res) => {
//     console.log('Health route hit');
//     res.json({
//         status: 'healthy',
//         timestamp: new Date().toISOString()
//     });
// });

// // Catch-all route
// router.use('*', (req, res) => {
//     console.log('Catch-all route hit with:', {
//         originalUrl: req.originalUrl,
//         baseUrl: req.baseUrl,
//         path: req.path
//     });
//     res.json({
//         error: 'Route not found',
//         originalUrl: req.originalUrl,
//         baseUrl: req.baseUrl,
//         path: req.path,
//         method: req.method
//     });
// });

// // Mount the router at /api
// app.use('/api', router);

// // Export the handler
// export const handler = serverless(app);