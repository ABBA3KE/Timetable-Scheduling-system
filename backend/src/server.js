import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./sockets/index.js";

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`Lecture Timetable API running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
  });
};

start();

process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
});
