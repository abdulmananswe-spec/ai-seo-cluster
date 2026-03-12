import { app, initApp } from "../server/index";

let isInitialized = false;

export default async (req: any, res: any) => {
  if (!isInitialized) {
    await initApp();
    isInitialized = true;
  }
  return app(req, res);
};
