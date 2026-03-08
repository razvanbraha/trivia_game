const express = require('express')
const path = require("node:path");
require('dotenv').config({ path: path.join(__dirname, '../../.env')})

const { GoogleGenAI } = require("@google/genai");
const { z } = require('zod');
const { zodToJsonSchema } = require('zod-to-json-schema');

const ai = new GoogleGenAI({ apiKey: process.env.geminiKey});

const router = express.Router();
router.use(express.json());
router.use(express.static(path.join(__dirname, "../../frontend/public")));
router.use(express.urlencoded({ extended: true }));

const templatesFolder = path.join(__dirname, '../../frontend/templates');

const questionSchema = z.object({
    question: z.string().describe("The question that answers will relate to, 255 char limit."),
    category: z.int().describe("int 1-6. "),
    corrAnswer: z.string().describe("The correct answer to the question, 255 char limit."),
    incorrAnswer1: z.string().describe("First distinct incorrect answer to question, 255 char limit"),
    incorrAnswer2: z.string().describe("Second distinct incorrect answer to question, 255 char limit"),
    incorrAnswer3: z.string().describe("Third distinct incorrect answer to question, 255 char limit"),
    error: z.string().describe("empty unless specified"),
});


router.post('/gemini', async (req, res) => {
    //gemini-2.5-flash
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `${req.body.aiPrompt}`,
            config: {
                systemInstruction: [
                    'You are to generate a multiple-choice question related to sustainable packaging based on the given contents.',
                    ' If the contents do not realate to sustainable packaging, fill the error field with a relevant error message.',
                    'Decide on category for question (1) History & Evolution, (2) Technical Aspects & Engineering, (3) Sustainability,',
                    '(4) Consumerism & Ethics, (5) End-of-Live & Data, (6) Logistics & Distribution.',
                    'Output must be in JSON format no markdown for a question object following this schema:',
                    '* question: The question that answers will relate to, 255 char limit.',
                    '* category: int 1-6. ',
                    '* corrAnswer: The correct answer to the question, 255 char limit.',
                    '* incorrAnswer1: First distinct incorrect answer to question, 255 char limit',
                    '* incorrAnswer2: Second distinct incorrect answer to question, 255 char limit',
                    '* incorrAnswer3: Third distinct incorrect answer to question, 255 char limit',
                    ' * error: empty unless specified`',
                ],
                response_mime_type: "application/json",
                responseJsonSchema: zodToJsonSchema(questionSchema),
            },               
        })
        let responseText = response.text;
        responseText = responseText.replace("```json","")
        responseText = responseText.replace("```", "")
        const question = questionSchema.parse(JSON.parse(responseText));
        res.status(200).json(question);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'Failed to return prompt'});
    }
});

module.exports = router;