import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // AI Service (Optional, but useful for product descriptions)
  const genAI = process.env.GEMINI_API_KEY ? new GoogleGenAI(process.env.GEMINI_API_KEY) : null;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", business: "Hussain Electronics" });
  });

  // Example AI route for generating product descriptions (Admin feature)
  app.post("/api/admin/generate-description", async (req, res) => {
    if (!genAI) return res.status(500).json({ error: "AI Service not configured" });
    const { productName, specs } = req.body;
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `Write a professional, premium e-commerce product description for a CCTV product named "${productName}" with these specs: ${JSON.stringify(specs)}. Focus on trust, security, and wholesale value for Hussain Electronics. Keep it elegant and concise.`;
      const result = await model.generateContent(prompt);
      res.json({ description: result.response.text() });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate description" });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
