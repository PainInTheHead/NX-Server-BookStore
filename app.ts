import * as express from "express";
// import multer = require("multer");
import { myDataSource } from "./app-data-source";
import mainRoute from "./src/routes/appRoute";
import { Request, Response } from "express";
import { errorHandler } from "./src/midleware/errorHandler";
const path = require("path");
const cors = require("cors");
const http = require("http");
const app = express();
const { Server } = require("socket.io");

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Пользователь подключен к сокету");
  
  socket.on("disconnect", () => {
    console.log("Пользователь отключился от сокета");
  });

  socket.on("join_book", (data) => {
    socket.join(data);
  });

  socket.on("send_comment", (data) => {
    socket.to(data).emit("receive_comment", data)
  })
});

myDataSource
  .initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use(errorHandler);
app.use("/uploads", express.static(path.join(__dirname, "src", "uploads")));
app.use("/covers", express.static(path.join(__dirname, "src", "covers")));
app.use("/", mainRoute);



server.listen(3005);
