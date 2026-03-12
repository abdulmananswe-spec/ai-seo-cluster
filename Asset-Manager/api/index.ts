import { app, initApp } from "../server/index";

let isInitialized = false;

// Re-enable Vercel's default body parsing
export const config = {
  api: {
    bodyParser: true,
  },
};

// Standard Vercel Node.js handler
export default async (req: any, res: any) => {
  console.log(`[Vercel Serverless] Handling request: ${req.method} ${req.url}`);
  
  try {
    if (!isInitialized) {
      console.log("[Vercel Serverless] Starting initialization...");
      
      // Check for critical environment variables early
      const envCheck = {
        POSTGRES_URL: !!process.env.POSTGRES_URL,
        DATABASE_URL: !!process.env.DATABASE_URL,
        GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL
      };
      console.log("[Vercel Serverless] Env Check:", JSON.stringify(envCheck));

      if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
        throw new Error("Missing POSTGRES_URL or DATABASE_URL. Please set this in Vercel settings.");
      }

      await initApp();
      isInitialized = true;
      console.log("[Vercel Serverless] App initialized successfully.");
    }

    // Call the Express app
    return app(req, res);
  } catch (error: any) {
    console.error("[Vercel Serverless] Fatal Initialization Error:", error);
    
    // Return a JSON response that is easy to read in the browser
    if (!res.headersSent) {
      res.status(500).json({
        error: "Server Initialization Failed",
        message: error.message,
        details: "Check Vercel logs for full stack trace.",
        timestamp: new Date().toISOString(),
        diagnostics: {
          hasPostgres: !!(process.env.POSTGRES_URL || process.env.DATABASE_URL),
          hasGemini: !!process.env.GEMINI_API_KEY,
          nodeEnv: process.env.NODE_ENV,
          vercel: process.env.VERCEL,
          isInitialized
        }
      });
    }
  }
};
