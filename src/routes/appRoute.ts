import * as express from "express";
import { Router } from "express";
import userRoute from "./userRoute";
import booksRoute from "./booksRoute";

const router = Router();

router.use("/user", userRoute);
router.use("/books", booksRoute);

export default router;
