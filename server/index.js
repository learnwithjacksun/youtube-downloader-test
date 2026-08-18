import express from "express";
import cors from "cors";
import { download, preview } from "./lib/dispatch.js";

const PORT = process.env.PORT || 3000;

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});

app.get("/info", preview);
app.get("/download", download);

app.listen(PORT, () => {
  console.log(`Server is running on port: http://localhost:${PORT}`);
});
