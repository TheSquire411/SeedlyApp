import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { IdentifyResult, DiagnosisResult, WeatherData, Plant } from "../types";

// ---------------------------------------------------------------------------
// ✅ SECURE CONFIGURATION
// ---------------------------------------------------------------------------
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const weatherApiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY;

if (!apiKey) {
  console.error("❌ CRITICAL ERROR: VITE_GEMINI_API_KEY is missing from .env file");
  throw new Error("Gemini API Key is missing. Check your .env file.");
}

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey });

// ---------------------------------------------------------------------------
// --- Schemas ---
// ---------------------------------------------------------------------------

const identifySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Common name" },
    scientificName: { type: Type.STRING, description: "Scientific name" },
    care: {
      type: Type.OBJECT,
      properties: {
        water: { type: Type.STRING, description: "Brief watering info" },
        sun: { type: Type.STRING, description: "Light needs" },
        temp: { type: Type.STRING, description: "Temp range" },
        humidity: { type: Type.STRING, description: "Humidity level" },
      },
      required: ["water", "sun", "temp", "humidity"],
    },
    companions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name" },
          benefit: { type: Type.STRING, description: "Benefit" }
        },
        required: ["name", "benefit"]
      },
      description: "3 companions"
    },
    quickTips: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3 tips"
    },
    description: { type: Type.STRING, description: "Description" },
    funFact: { type: Type.STRING, description: "Fun fact" },
    visualGuides: {
      type: Type.ARRAY,
      description: "1 simple care guide",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Title" },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Step" },
                description: { type: Type.STRING, description: "Action" }
              }
            }
          }
        }
      }
    },
  },
  required: ["name", "scientificName", "care", "companions", "quickTips", "description"],
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
    confidence: { type: Type.NUMBER, description: "Confidence score as a decimal between 0.0 and 1.0 (e.g. 0.95)" },
  },
  required: ["issue", "description", "treatment", "prevention", "confidence"],
};

// ---------------------------------------------------------------------------
// --- Helper: Compress Image ---
// ---------------------------------------------------------------------------
const compressImage = (base64Str: string, maxWidth = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scaleSize = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * scaleSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // Return base64 without the data URL prefix
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, ''));
    };
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = base64Str;
  });
};

// ---------------------------------------------------------------------------
// --- Helper: Repair JSON ---
// ---------------------------------------------------------------------------
function repairJson(jsonString: string): string {
  let repaired = jsonString.trim();

  // Close open arrays/objects
  const openBraces = (repaired.match(/\{/g) || []).length;
  const closeBraces = (repaired.match(/\}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/\]/g) || []).length;

  if (openBraces > closeBraces) {
    // If we are likely inside a string value that got cut off (e.g. "desc...)
    // Check if the last non-whitespace char is a quote or if we are inside a value
    const lastQuote = repaired.lastIndexOf('"');
    if (lastQuote > repaired.lastIndexOf(':')) {
      // Probably unclosed string
      if (repaired.match(/"/g)!.length % 2 !== 0) {
        repaired += '"';
      }
    }
  }

  // Naive cleanup of trailing commas or garbage at end
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas

  // Append missing closing brackets
  for (let i = 0; i < (openBrackets - closeBrackets); i++) repaired += ']';
  for (let i = 0; i < (openBraces - closeBraces); i++) repaired += '}';

  return repaired;
}

// ---------------------------------------------------------------------------
// --- Functions ---
// ---------------------------------------------------------------------------

// Shared System Instruction to prevent "Minecraft/Game" hallucinations
const BOTANIST_SYSTEM_PROMPT = `
You are an expert botanist and horticultural assistant. 
You must ONLY provide real-world gardening information. 
Do not mention video games, software versions, texture packs, or digital graphics. 
If asked for a 'visual guide', provide text instructions for physical actions (like pruning), not digital rendering.
`;

export const identifyPlant = async (base64Image: string, location: string): Promise<IdentifyResult> => {
  try {
    // Compress image before sending to reduce payload size
    let cleanBase64: string;
    if (base64Image.startsWith('data:')) {
      cleanBase64 = await compressImage(base64Image, 512, 0.6);
    } else {
      cleanBase64 = await compressImage(`data:image/jpeg;base64,${base64Image}`, 512, 0.6);
    }

    console.log("📷 Compressed image size:", Math.round(cleanBase64.length / 1024), "KB");

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
            text: `Identify this plant. Location: ${location}. Keep all responses brief and concise.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: identifySchema,
        temperature: 0.1,
        // @ts-ignore - The SDK types might be outdated
        maxOutputTokens: 8192,
        systemInstruction: BOTANIST_SYSTEM_PROMPT,
      },
    });

    console.log("🤖 Raw AI Response:", response.text?.substring(0, 200));

    if (response.text) {
      let text = response.text.trim();

      // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        text = codeBlockMatch[1].trim();
      }

      // Find JSON object boundaries (first { to last })
      const firstBrace = text.indexOf('{');
      // Look for the last curly brace, even if it's not at the very end
      let lastBrace = text.lastIndexOf('}');

      // TRUNCATION HANDLING:
      // If we can't find a last brace, OR if the response seems cut off
      if (lastBrace === -1 || lastBrace < firstBrace) {
        lastBrace = text.length - 1;
      }

      let jsonString = text.substring(firstBrace, lastBrace + 1);
      console.log("📝 Extracted JSON length:", jsonString.length);

      try {
        const parsed = JSON.parse(jsonString) as IdentifyResult;
        console.log("✅ Successfully parsed plant:", parsed.name);
        return parsed;
      } catch (parseError) {
        console.warn("⚠️ JSON Parse completed failed, attempting repair...");

        try {
          const repaired = repairJson(jsonString);
          console.log("🔧 Repaired JSON:", repaired.substring(0, 100) + "...");
          const repairedParsed = JSON.parse(repaired) as IdentifyResult;
          return repairedParsed;
        } catch (repairError) {
          console.error("❌ Repair failed.");
          console.error("📄 Full JSON string:", jsonString);
          throw new Error("Failed to define plant data. Please try again.");
        }
      }
    }
    throw new Error("No response from Gemini");
  } catch (error) {
    console.error("❌ Identify Plant Error:", error);
    throw error;
  }
};

export const diagnosePlant = async (base64Image: string, description: string): Promise<DiagnosisResult> => {
  try {
    let cleanBase64: string;
    if (base64Image.startsWith('data:')) {
      cleanBase64 = await compressImage(base64Image);
    } else {
      cleanBase64 = await compressImage(`data:image/jpeg;base64,${base64Image}`);
    }

    console.log("📷 Compressed image size:", Math.round(cleanBase64.length / 1024), "KB");

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
        temperature: 0.1, // Low temp for diagnosis accuracy
        systemInstruction: BOTANIST_SYSTEM_PROMPT,
      },
    });

    if (response.text) {
      let text = response.text.trim();

      // Strip markdown code fences if present
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        text = codeBlockMatch[1].trim();
      }

      // Find JSON object boundaries
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');

      if (firstBrace === -1 || lastBrace === -1 || firstBrace > lastBrace) {
        console.error("Could not find valid JSON object in response:", text.substring(0, 500));
        throw new Error("AI returned an invalid response format. Please try again.");
      }

      const jsonString = text.substring(firstBrace, lastBrace + 1);

      try {
        return JSON.parse(jsonString) as DiagnosisResult;
      } catch (parseError) {
        console.error("JSON Parse Error:", jsonString.substring(0, 500));
        throw new Error("Failed to parse AI diagnosis. Please try again.");
      }
    }
    throw new Error("No response from Gemini");
  } catch (error) {
    console.error("Diagnosis Error:", error);
    throw error;
  }
};

export const getWeatherAdvice = async (location: string, coords?: { lat: number; lon: number }): Promise<WeatherData> => {
  try {
    console.log("Fetching real weather for:", location, coords ? `(${coords.lat}, ${coords.lon})` : "");

    if (!weatherApiKey) {
      throw new Error("OpenWeather API Key is missing from .env");
    }

    // 1. Get REAL weather data - prefer coords for accuracy, fallback to location string
    const weatherUrl = coords
      ? `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${weatherApiKey}`
      : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${weatherApiKey}`;

    const weatherRes = await fetch(weatherUrl);

    if (!weatherRes.ok) throw new Error("Weather API failed");

    const weatherData = await weatherRes.json();

    const realTemp = Math.round(weatherData.main.temp);
    const realCondition = weatherData.weather[0].main;
    const realHumidity = weatherData.main.humidity;

    // 2. Ask AI for advice
    let aiAdvice = "Check your plants based on current conditions.";
    try {
      const adviceResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `The current weather in ${location} is ${realCondition}, ${realTemp}°C with ${realHumidity}% humidity. 
                   Give 1 short sentence of gardening advice for this specific condition. 
                   Do not use JSON. Just plain text.`,
        config: {
          temperature: 0.3, // Slightly higher for "advice" variety, but still controlled
          systemInstruction: BOTANIST_SYSTEM_PROMPT
        }
      });
      if (adviceResponse.text) {
        aiAdvice = adviceResponse.text;
      }
    } catch (aiError) {
      console.error("AI Advice failed, using default", aiError);
    }

    // 3. Map Icons and Return
    const getIcon = (condition: string) => {
      const map: Record<string, string> = {
        'Clear': '☀️', 'Clouds': '☁️', 'Rain': 'kT', 'Drizzle': 'kT',
        'Thunderstorm': '⚡', 'Snow': '❄️', 'Mist': 'zz'
      };
      return map[condition] || '🌤️';
    };

    return {
      temp: realTemp,
      condition: realCondition,
      humidity: realHumidity,
      icon: getIcon(realCondition),
      advice: aiAdvice
    };

  } catch (e) {
    console.error("Weather Error", e);
    return {
      temp: 22,
      condition: "Unavailable",
      humidity: 50,
      icon: "❓",
      advice: "Could not load local weather. Please check your connection."
    };
  }
};

export const createGardenChat = (plants: Plant[], location: string): Chat => {
  const gardenContext = plants.map(p =>
    `- ${p.nickname || p.name} (${p.scientificName}): Health is ${p.health}. Care: Water ${p.care.water}, Light ${p.care.sun}.`
  ).join('\n');

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const systemInstruction = `
    ${BOTANIST_SYSTEM_PROMPT}

    You are Seedly, a helpful and friendly AI gardening assistant. 
    
    CONTEXT:
    - User Location: ${location}
    - Current Date: ${today}
    - Season: Infer the season based on the location and date provided above.
    
    Here is the user's current garden inventory:
    ${gardenContext}
    
    INSTRUCTIONS:
    - Answer questions specifically about these plants when asked, using them as context. 
    - Provide general gardening advice based on the user's location, current season, and climate.
    - Be encouraging, use emojis, and keep answers concise and practical.
    - If the user asks about a plant not in their garden, answer generally but suggest if it would be a good fit for their location.
  `;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction,
      temperature: 0.2, // Conversational but factual
    }
  });
}