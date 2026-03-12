import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.join(process.cwd(), "dist", "public");
  
  // Use Vercel's native static serving if possible, 
  // but Express should still know where files are for SSR/fallback.
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
  }

  // fall through to index.html if the file doesn't exist
  app.get("*", (req, res) => {
    // Skip API routes
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: "API endpoint not found" });
    }
    
    // Serve index.html for all other routes (client-side routing)
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Not Found");
    }
  });
}
