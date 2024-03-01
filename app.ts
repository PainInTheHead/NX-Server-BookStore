import * as express from "express";

import { myDataSource } from "./app-data-source";
import mainRoute from "./src/routes/appRoute";
const cors = require("cors");

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
app.use("/", mainRoute);

app.listen(3005);
