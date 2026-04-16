import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API Route
  app.post('/api/gemini', async (req, res) => {
    const { scene } = req.body;
    
    if (!scene) {
      return res.status(400).json({ success: false, error: 'Scene description is required' });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY not found in environment');
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `你是一个小米人车家全生态联动专家。根据用户输入的情景“${scene}”，返回5个设备的联动状态。
      必须返回 JSON 格式。
      
      示例输出:
      {
        "success": true,
        "devices": [
          {"name": "小米汽车", "action": "准备出发", "status": "active"},
          {"name": "空调", "action": "制冷 26°C", "status": "active"},
          {"name": "客厅灯", "action": "暖光 60%", "status": "active"},
          {"name": "音箱", "action": "准备欢迎语", "status": "pending"},
          {"name": "电视", "action": "待续播", "status": "inactive"}
        ]
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp", // Using flash for speed
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              success: { type: Type.BOOLEAN },
              devices: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    action: { type: Type.STRING },
                    status: { type: Type.STRING }
                  },
                  required: ["name", "action", "status"]
                }
              }
            },
            required: ["success", "devices"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      res.json(result);
    } catch (error) {
      console.error('Gemini API Error:', error);
      // Fallback JSON as requested
      res.json({
        success: true,
        fallback: true,
        devices: [
          { name: "小米汽车", action: "准备出发", status: "active" },
          { name: "空调", action: "制冷 26°C", status: "active" },
          { name: "客厅灯", action: "暖光 60%", status: "active" },
          { name: "音箱", action: "准备欢迎语", status: "pending" },
          { name: "电视", action: "待续播", status: "inactive" }
        ]
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
