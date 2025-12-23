import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini model
const getGeminiModel = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY environment variable is not set. Please create a .env file with your Gemini API key.');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
};

// Call Gemini API with system prompt and user message
export const callGemini = async (systemPrompt, userMessage, maxTokens = 20000) => {
  try {
    const model = getGeminiModel();
    const fullPrompt = `${systemPrompt}\n\nUser Question: ${userMessage}`;
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7,
      },
    });

    const response = await result.response;
    return response.text();
  } catch (error) {
    throw new Error(`API Error: ${error.message}`);
  }
};

