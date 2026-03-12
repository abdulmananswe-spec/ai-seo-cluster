import { app, initApp } from "../server/index";

let isInitialized = false;

export default async (req: any, res: any) => {
  try {
    if (!isInitialized) {
      console.log("Initializing app on Vercel...");
      await initApp();
      isInitialized = true;
      console.log("App initialized successfully.");
    }
    return app(req, res);
  } catch (error: any) {
    console.error("Vercel Initialization Error:", error);
    return res.status(500).json({
      message: "Vercel Initialization Failed",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      env: {
        hasPostgres: !!process.env.POSTGRES_URL,
        hasGemini: !!process.env.GEMINI_API_KEY,
        nodeEnv: process.env.NODE_ENV
      }
    });
  }
};
