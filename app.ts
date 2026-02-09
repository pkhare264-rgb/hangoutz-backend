import express, { Application, Request, Response } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes"; // Make sure this path exists!

const app: Application = express();

app.use(cors());
app.use(express.json());

// Routes
// app.use("/auth", authRoutes); // Uncomment this when you confirm the routes folder has auth.routes.ts

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

export default app;