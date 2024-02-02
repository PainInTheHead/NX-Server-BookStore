import * as express from "express";
import { Request, Response } from "express";
import { User } from "./src/entity/user.entity";
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

// register routes
// app.get("/users", async function (req: Request, res: Response) {
//   const users = await myDataSource.getRepository(User).find();
//   res.json(users);
// });

// app.get("/users/:id", async function (req: Request, res: Response) {
//   const results = await myDataSource.getRepository(User).findOneBy({
//     // register routes
//     // register routes
//     id: Number(req.params.id),
//   });
//   return res.send(results);
// });

// app.post("/users", async function (req: Request, res: Response) {
//   const { firstName, lastName } = req.body;
//   const user = myDataSource.getRepository(User).create({
//     firstName: firstName,
//     lastName: lastName,
//   });
//   const results = await myDataSource.getRepository(User).save(user);
//   return res.send(results);
// });

// app.put("/users/:id", async function (req: Request, res: Response) {
//   const user = await myDataSource.getRepository(User).findOneBy({
//     id: Number(req.params.id),
//   });
//   myDataSource.getRepository(User).merge(user, req.body);
//   const results = await myDataSource.getRepository(User).save(user);
//   return res.send(results);
// });

// app.delete("/users/:id", async function (req: Request, res: Response) {
//   const results = await myDataSource.getRepository(User).delete(req.params.id);
//   return res.send(results);
// });

// start express server
app.listen(3002);
