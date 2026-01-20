
import { GoogleGenAI } from "@google/genai";

// Initialize the GoogleGenAI client with correct configuration
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeLeadMessage = async (message: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this cabinet sales lead message and provide a concise summary, key requirements, and a sentiment (High Intent, Informational, or Casual). Message: "${message}"`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      },
    });
    // response.text is a getter, not a function
    return response.text || 'Analysis unavailable.';
  } catch (error) {
    console.error('Error analyzing lead with Gemini:', error);
    return 'Analysis unavailable.';
  }
};
