import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { IdentifyResult, DiagnosisResult, WeatherData, Plant } from "../types";

// ---------------------------------------------------------------------------
// 👇 ACTION REQUIRED: Paste your Gemini API Key inside the quotes below
// ---------------------------------------------------------------------------
const ai = new GoogleGenAI({ apiKey: "AIzaSyDPffMb066yYMh0YUHNulX5ZTAOr16BPWc" });
// ---------------------------------------------------------------------------

const identifySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Common name of the plant" },
    scientificName: { type: Type.STRING, description: "Scientific name" },
    care: {
      type: Type.OBJECT,
      properties: {
        water: { type: Type.STRING, description: "Watering frequency and amount (e.g., 'Every 7 days')" },
        sun: { type: Type.STRING, description: "Sunlight needs (e.g., 'Indirect bright light')" },
        temp: { type: Type.STRING, description: "Ideal temperature range" },
        humidity: { type: Type.STRING, description: "Humidity requirements" },
      },
      required: ["water", "sun", "temp", "humidity"],
    },
    companions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of a companion plant" },
          benefit: { type: Type.STRING, description: "Specific benefit (e.g. 'Repels aphids', 'Fixes nitrogen', 'Provides shade')" }
        },
        required: ["name", "benefit"]
      },
      description: "List 3 plants that are beneficial companions, specifically for pest control or growth enhancement."
    },
    quickTips: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3 clear, concise, and critical care tips for this plant (e.g. 'Keep soil moist', 'Avoid direct sun')"
    },
    visualGuides: {
      type: Type.ARRAY,
      description: "A step-by-step guide for a complex task relevant to this plant (e.g. Repotting, Pruning, Propagation). Provide 1 guide.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Title of the guide (e.g. 'How to Repot')" },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Short step title" },
                description: { type: Type.STRING, description: "Clear instruction for this step" }
              }
            }
          }
        }
      }
    },
    description: { type: Type.STRING, description: "Short description of the plant" },
    funFact: { type: Type.STRING, description: "A fun short fact about the plant" },
  },
  required: ["name", "scientificName", "care", "companions", "quickTips", "visualGuides", "description"],
};

const diagnosisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    issue: { type: Type.STRING, description: "Name of the disease or pest" },
    description: { type: Type.STRING, description: "Description of the symptoms observed" },
    treatment: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Step by step treatment instructions"
    },
    prevention: { type: Type.STRING, description: "How to prevent this in the future" },
    confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 100" },
  },
  required: ["issue", "description", "treatment", "prevention", "confidence"],
};

const weatherSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    temp: { type: Type.NUMBER, description: "Estimated temperature in Celsius" },
    condition: { type: Type.STRING, description: "Weather condition (Sunny, Rainy, Cloudy)" },
    humidity: { type: Type.NUMBER, description: "Humidity percentage" },
    icon: { type: Type.STRING, description: "An emoji representing the weather" },
    advice: { type: Type.STRING, description: "Short gardening advice based on this weather" }
  },
  required: ["temp", "condition", "humidity", "icon", "advice"]
}

export const identifyPlant = async (base64Image: string, location: string): Promise<IdentifyResult> => {
  try {
    // Remove header if present to get raw base64
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: `Identify this plant. The user is located in ${location}. Provide care instructions specific to this climate. Suggest 3 companion plants that are highly beneficial. Include 3 quick care tips. Also include a step-by-step visual guide breakdown for a common complex task for this plant (like Repotting or Pruning).`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: identifySchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as IdentifyResult;
    }
    throw new Error("No response from Gemini");
  } catch (error) {
    console.error("Identify Plant Error:", error);
    throw error;
  }
};

export const diagnosePlant = async (base64Image: string, description: string): Promise<DiagnosisResult> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: `Diagnose the issue with this plant. User description: "${description}". If the plant looks healthy, say so.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: diagnosisSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as DiagnosisResult;
    }
    throw new Error("No response from Gemini");
  } catch (error) {
    console.error("Diagnosis Error:", error);
    throw error;
  }
};

export const getWeatherAdvice = async (location: string): Promise<WeatherData> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a realistic current weather report for ${location} (assume current month/season). Provide gardening advice.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: weatherSchema
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as WeatherData;
    }
    throw new Error("No weather data");
  } catch (e) {
    console.error("Weather Error", e);
    return {
      temp: 22,
      condition: "Sunny",
      humidity: 50,
      icon: "☀️",
      advice: "It's a beautiful day! Check your plants for hydration."
    }
  }
}

export const createGardenChat = (plants: Plant[], location: string): Chat => {
  const gardenContext = plants.map(p =>
    `- ${p.nickname || p.name} (${p.scientificName}): Health is ${p.health}. Care: Water ${p.care.water}, Light ${p.care.sun}.`
  ).join('\n');

  const systemInstruction = `You are Seedly, a helpful and friendly AI gardening assistant. 
    The user is located in ${location}.
    
    Here is the user's current garden inventory:
    ${gardenContext}
    
    Answer questions specifically about these plants when asked, using them as context. 
    Provide general gardening advice based on the user's location and climate.
    Be encouraging, use emojis, and keep answers concise and practical.
    If the user asks about a plant not in their garden, answer generally but suggest if it would be a good fit for their location.`;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction
    }
  });
}