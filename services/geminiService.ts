
import { GoogleGenAI } from "@google/genai";

export const analyzeLeadMessage = async (message: string) => {
  // Use the injected API key or fallback to a check
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    return 'Please configure your Gemini API Key in Settings to use AI features.';
  }

  try {
    // Initialize inside the call to avoid crashing the whole app on boot
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this cabinet sales lead message and provide a concise summary, key requirements, and a sentiment (High Intent, Informational, or Casual). Message: "${message}"`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      },
    });
    return response.text || 'Analysis unavailable.';
  } catch (error) {
    console.error('Error analyzing lead with Gemini:', error);
    return 'Analysis unavailable. Check your API Key configuration.';
  }
};