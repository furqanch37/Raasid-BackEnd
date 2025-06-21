import express from "express";
import userRouter from "./routes/user.js";
import productsRouter from "./routes/products.js";
import categoryRouter from "./routes/category.js";
import orderRouter from "./routes/order.js";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "./middlewares/error.js";
import cors from "cors";

export const app = express();

config({
  path: "./data/config.env",
});


// Using Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [process.env.FRONTEND_URL, "http://localhost:3001","http://localhost:3000" ,"https://raasid-x-go.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
// Using routes
app.use("/api/users", userRouter);
app.use("/api/products", productsRouter);
app.use("/api/category", categoryRouter);
app.use("/api/order", orderRouter);
app.get("/", (req, res) => {
  res.send("Nice working backend by Muhammad Furqan Wajih");
});

// Using Error Middleware
app.use(errorMiddleware);
