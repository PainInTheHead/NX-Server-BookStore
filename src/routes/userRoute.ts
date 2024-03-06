import * as express from "express";
import { Router } from "express";
import {
  userLogin,
  userRegister,
  getUser,
  userMakeAva,
  userFormDataAvatar,
  changeInfoAboutUser,
  changePasswordUser,
} from "../controllers/User.controllers";
import { verifyToken } from "../midleware/verifytoken";
import multer = require("multer");

const upload = multer({ dest: "./src/uploads" });

const router = Router();

router.post("/registration", userRegister);
router.post("/login", userLogin);
router.get("/userinfo", verifyToken, getUser);
router.put("/changeAboutUser", verifyToken, changeInfoAboutUser);
router.put("/changePasswordUser", verifyToken, changePasswordUser);
router.post("/upload", verifyToken, upload.single("file"), userFormDataAvatar);

export default router;
