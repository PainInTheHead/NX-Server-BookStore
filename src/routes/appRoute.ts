import * as express from "express";
import { Router } from "express";
import userRoute from './userRoute'
import generators from './generators'


const router = Router()

router.use('/user', userRoute)
router.use('/books', generators)

export default router