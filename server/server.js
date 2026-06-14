import dotenv from "dotenv";
import express from "express";
import { Resend } from "resend";
import cors from "cors";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import axios from "axios";
import aiRoutes from "./routes/ai.js";
import atsRoutes from "./routes/ats.js";

dotenv.config({ path: new URL("./.env", import.meta.url) });

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection handled in startServer()

const resend = new Resend(process.env.RESEND_API_KEY);

app.use(cors());
app.use(express.json());

app.use(
  "/api/ai",
  rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: "Too many requests. Try again in a minute." }
  })
);
app.use("/api", aiRoutes);
app.use("/api/ats", atsRoutes);

app.get("/", (req, res) => {
  res.json({
    status: "Server is running",
    message: "Portfolio Email API (Resend) + AI"
  });
});

app.get("/health", (req, res) => {
  res.status(200).send("Server is alive");
});

app.post("/api/send-email", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "Portfolio Contact <onboarding@resend.dev>",
      to: process.env.EMAIL,
      replyTo: email,
      subject: `Portfolio Contact: Message from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="background: #000; color: #fff; padding: 20px; margin: 0;">
            New Message from Portfolio
          </h2>
          <div style="padding: 20px; border: 1px solid #ddd;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p style="background: #f4f4f5; padding: 15px; border-left: 3px solid #000;">
              ${message}
            </p>
          </div>
          <p style="color: #666; font-size: 12px; padding: 10px;">
            Sent from your portfolio contact form
          </p>
        </div>
      `
    });

    if (error) {
      console.error("Resend error:", error);
      return res.status(500).json({ error: "Failed to send email" });
    }

    res.status(200).json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// 🔥 CONNECT MONGODB BEFORE STARTING SERVER
async function startServer() {
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("MongoDB Connected ✅");
    } else {
      console.log("No MONGO_URI provided. Skipping MongoDB connection.");
    }

    // Try listening with automatic retries if the port is already in use.
    const parsedPort = Number(PORT) || 5000;
    const maxRetries = 5;

    const tryListen = (port, remainingRetries) => {
      const server = app.listen(port, () => {
        console.log(`Server running on port ${port}`);

        if (process.env.NODE_ENV === "production" && process.env.EMBEDDING_SERVICE_URL) {
          // Keep embedding service alive (periodic ping). Non-blocking, short timeout.
          setInterval(async () => {
            try {
              await axios.get(process.env.EMBEDDING_SERVICE_URL, { timeout: 5000 });
              console.log("Embedding service kept alive");
            } catch (err) {
              console.log("Embedding service wake-up ping failed");
            }
          }, 10 * 60 * 1000); // every 10 minutes
        }
      });

      server.on("error", (err) => {
        if (err && err.code === "EADDRINUSE") {
          if (remainingRetries > 0) {
            console.warn(
              `Port ${port} in use, retrying on port ${port + 1} (${remainingRetries} retries left)...`
            );
            // Wait briefly before retrying to reduce race conditions
            setTimeout(() => tryListen(port + 1, remainingRetries - 1), 500);
          } else {
            console.error(
              `Failed to bind to a port after multiple attempts. Last error:`,
              err
            );
            process.exit(1);
          }
        } else {
          console.error("Server error:", err);
          process.exit(1);
        }
      });
    };

    tryListen(parsedPort, maxRetries);

  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // stop app if DB fails
  }
}

startServer();
