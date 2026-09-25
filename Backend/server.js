import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173"
  })
);

app.use(express.json());

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      status: "ok",
      message:
        "AnswerCheck AI backend is running."
    });
  }
);
// Routes

app.use("/api/auth", authRoutes);

app.use(
  "/api/assignments",
  assignmentRoutes
);

// ======================================
// MULTER / GLOBAL ERROR HANDLER
// ======================================

app.use(
  (
    error,
    _req,
    res,
    _next
  ) => {

    if (
      error?.name ===
      "MulterError"
    ) {

      const message =
        error.code ===
          "LIMIT_FILE_SIZE"

          ? "PDF is too large. Maximum allowed size is 10 MB."

          : error.message;

      return res.status(400).json({
        message
      });
    }


    if (
      error?.message ===
      "Only PDF files are allowed."
    ) {

      return res.status(400).json({
        message:
          error.message
      });
    }


    console.error(
      "Unhandled server error:",
      error
    );

    return res.status(500).json({
      message:
        "Unexpected server error."
    });
  }
);


// ======================================
// SERVER
// ======================================

const PORT = process.env.PORT || 5000;

const startServer =
  async () => {

    try {

      if (
        !process.env.MONGO_URI
      ) {
        throw new Error(
          "MONGO_URI is missing in .env"
        );
      }


      if (
        !process.env.JWT_SECRET
      ) {
        throw new Error(
          "JWT_SECRET is missing in .env"
        );
      }


      await mongoose.connect(
        process.env.MONGO_URI
      );

      console.log(
        "MongoDB connected."
      );


      app.listen(
        PORT,
        () => {
          console.log(
            `Server running on http://localhost:${PORT}`
          );
        }
      );

    } catch (error) {

      console.error(
        "Server startup failed:",
        error.message
      );

      process.exit(1);
    }
  };


startServer();