import { createApp } from "./app.js";

const start = async () => {
  try {
    const app = await createApp();
    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`🚀 VERIDIX Server running on http://localhost:${port}`);
  } catch (err) {
    console.error("Failed to start VERIDIX server:", err);
    process.exit(1);
  }
};

start();