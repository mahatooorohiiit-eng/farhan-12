import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Set up Gemini API client
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || "MOCK_KEY",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Route: Generate Poetry/Lyrics
  app.post("/api/generate-poetry", async (req, res) => {
    try {
      const { theme, description } = req.body;
      
      if (!apiKey) {
        // Safe fallback in case API key is missing
        const fallbackPoems: Record<string, string> = {
          "Wild Horses": "Across the rolling fields of golden light,\nWild spirits run, unhindered and bright.",
          "Waterfall": "In silver cascades, waters timelessly flow,\nSinging to mossy deep stones far below.",
          "Rainy Window": "Soft droplets trace down the glass pane slow,\nAs evening descends in a quiet, amber glow.",
          "Starfield Nebula": "Through silent, endless stardust we drift,\nWhile cosmic nebulae slowly turn and shift.",
          "Zen Garden": "A single blossom falls, ripple by ripple,\nUnder quiet skies, making the water triple."
        };
        const fallback = fallbackPoems[theme] || "In peaceful stillness, worries depart,\nAs serene moments heal the weary heart.";
        return res.json({ poem: fallback });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Write a beautiful, relaxing, cinematic 2-line poetic quote or lyric for a nature/ambient visualizer. 
The theme is "${theme || 'Relaxation'}" and the visual description is "${description || 'Calm landscape'}".
Keep it elegant, deep, and peaceful. Max 20 words in total. Format it as a simple plain text string with the two lines separated by a newline. Do not include quotes, line markers, or extra labels.`,
      });
      
      const poem = response.text?.trim() || "In silence, peace descends;\nSoft light and quiet winds.";
      res.json({ poem });
    } catch (error: any) {
      console.error("Gemini Poetry Generation Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate poetry" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
