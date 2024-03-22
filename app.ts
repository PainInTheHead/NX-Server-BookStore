import * as express from "express";
// import multer = require("multer");
import { myDataSource } from "./app-data-source";
import mainRoute from "./src/routes/appRoute";
import { Request, Response } from "express";
import { errorHandler } from "./src/midleware/errorHandler";
const path = require("path");
const cors = require("cors");

// const upload = multer({ dest: "./src/uploads" });

myDataSource
  .initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use(errorHandler);
app.use("/uploads", express.static(path.join(__dirname, "src", "uploads")));
app.use("/covers", express.static(path.join(__dirname, "src", "covers")));
app.use("/", mainRoute);

// app.post(
//   "/upload",
//   upload.single("file"),
//   async (req: Request, res: Response) => {
//     res.json({ filename: req.file.filename });
//   }
// );

app.listen(3005);
