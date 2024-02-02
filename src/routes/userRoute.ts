import * as express from "express";
import { Router } from "express";
import {
  userLogin,
  userRegister,
  getUser,
  userMakeAva,
} from "../controllers/User.controllers";
import { verifyToken } from "../midleware/verifytoken";

const router = Router();

router.post("/registration", userRegister);
router.post("/login", userLogin);
router.get("/userinfo", verifyToken, getUser);
router.put("/changeAvatar", verifyToken, userMakeAva);

export default router;
