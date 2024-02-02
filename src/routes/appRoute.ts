import * as express from "express";
import { Router } from "express";
import userRoute from './userRoute'
import todoRoute from './todoRoute'

const router = Router()

router.use('/user', userRoute)
router.use("/todos", todoRoute);

export default router