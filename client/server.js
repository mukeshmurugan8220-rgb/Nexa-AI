import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRoutes from "./routes/chatRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed frontend origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",

  // Current Vercel deployment
  "https://nexa-ilfucnaba-mukesh-s-projects13.vercel.app",
];

// CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },

  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization"],

  credentials: true,
};

// Middleware
app.use(cors(corsOptions));

app.use(express.json());

// Health Check
app.get("/", (req, res) => {
  res.send("NexaAI Backend is Running Successfully!");
});

// Chat Routes
app.use("/api/chat", chatRoutes);

// Server
app.listen(PORT, () => {
  console.log(`NexaAI Server running on port ${PORT}`);
});