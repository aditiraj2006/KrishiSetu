import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export async function translateText(text: string, targetLanguage: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Translate the following agricultural product description to ${targetLanguage}. Keep the tone professional and informative. Only return the translated text:\n\n${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Translation Error:", error);
    throw new Error("Failed to translate text");
  }
}

export async function improveGrammar(text: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Improve the grammar and professional tone of the following agricultural product description while keeping its original meaning. Only return the improved text:\n\n${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Grammar Error:", error);
    throw new Error("Failed to improve grammar");
  }
}

export async function analyzeProductQuality(base64Image: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert base64 to the format expected by Gemini
    const part = {
      inlineData: {
        data: base64Image.split(",")[1] || base64Image,
        mimeType: "image/jpeg",
      },
    };

    const prompt =
      "Analyze this image of an agricultural product. Rate its quality on a scale of 1 to 10 based on freshness, color, and lack of damage. Provide a brief explanation for the score. Return as JSON with fields 'score' (number) and 'explanation' (string).";

    const result = await model.generateContent([prompt, part]);
    const response = await result.response;
    const text = response.text();

    // Clean up the response to ensure it's valid JSON
    const jsonStr = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Quality Analysis Error:", error);
    throw new Error("Failed to analyze product quality");
  }
}
