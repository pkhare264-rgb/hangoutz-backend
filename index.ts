import "dotenv/config";
import app from "./app";
import connectDB from "./config/db";

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 VIBE CODING Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server failed to start:", error);
    process.exit(1);
  }
};

startServer();