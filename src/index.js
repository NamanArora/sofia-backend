import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import rateLimit from 'express-rate-limit';
import { validateSingleTranslation, validateBulkTranslation } from './validators.js';
import { buildPrompt, parseResponse, getSystemPrompt, getUserPrompt } from './promptUtils.js';
import 'dotenv/config'

const app = express();
const port = process.env.PORT || 3000;

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['POST'],
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
});

app.use(limiter);

const mockSingleResponse = () => {
    return {
        "translatedPoint": "Led cross-functional teams across 15 manufacturing plants to deliver a comprehensive sustainability product initiative, leveraging data analysis to drive a 25% reduction in carbon emissions through the implementation of renewable energy solutions and waste reduction programs, resulting in $2M in annual cost savings.",
        "domainAlignment": [
            "Led cross-functional teams",
            "data analysis to drive improvements",
            "delivered measurable impact"
        ],
        "preservedElements": [
            "15 manufacturing plants scope",
            "25% reduction in carbon emissions",
            "$2M in annual cost savings"
        ]
    }
}

const mockBulkResponse = () => {
    return {
        "translations": [
          {
            "original": "Led sustainability audit for 15 manufacturing plants, reducing carbon emissions by 25% through implementation of renewable energy solutions and waste reduction initiatives, saving $2M annually",
            "translated": "Directed $2M cost optimization initiative across 15 manufacturing sites, achieving 25% carbon footprint reduction through ROI-driven renewable energy investments and waste reduction strategies, delivering sustainable bottom-line impact",
            "domainAlignment": [
              "Cost optimization focus",
              "ROI-driven decision making",
              "Bottom-line impact quantification",
              "Investment strategy",
              "Financial outcome measurement"
            ],
            "preservedElements": [
              "Project scale (15 sites)",
              "Cost savings ($2M)",
              "Efficiency metrics (25%)",
              "Leadership position",
              "Implementation scope"
            ]
          },
          {
            "original": "Developed and implemented green supply chain strategy resulting in 30% reduction in packaging waste and 15% decrease in transportation emissions across 5 distribution centers",
            "translated": "Optimized operational costs through supply chain restructuring, yielding 30% reduction in packaging expenses and 15% logistics cost improvement across 5 distribution centers, enhancing operational efficiency and risk mitigation",
            "domainAlignment": [
              "Cost optimization",
              "Operational efficiency",
              "Risk management",
              "Quantitative analysis",
              "Supply chain economics"
            ],
            "preservedElements": [
              "Scale of impact (5 centers)",
              "Efficiency metrics (30%, 15%)",
              "Strategic implementation",
              "Cross-facility coordination"
            ]
          },
          {
            "original": "Conducted environmental impact assessments for 3 major infrastructure projects, ensuring compliance with ISO 14001 standards and reducing environmental risks by 40%",
            "translated": "Executed risk assessment and compliance analysis for 3 major infrastructure investments, ensuring ISO 14001 conformity and achieving 40% risk exposure reduction, maximizing asset protection and regulatory alignment",
            "domainAlignment": [
              "Risk assessment methodology",
              "Compliance analysis",
              "Investment evaluation",
              "Asset protection",
              "Regulatory compliance"
            ],
            "preservedElements": [
              "Project scope (3 projects)",
              "Risk reduction metric (40%)",
              "Compliance standard (ISO 14001)",
              "Assessment leadership"
            ]
          }
        ]
      }      
}

// Single translation endpoint
app.post('/api/translate', validateSingleTranslation, async (req, res) => {
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

// Bulk translation endpoint
app.post('/api/translate-bulk', validateBulkTranslation, async (req, res) => {
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
        console.log({results})
        res.json({ results });
    } catch (error) {
        console.error('Bulk translation error:', error);
        res.status(500).json({ error: 'Failed to translate CV points' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});