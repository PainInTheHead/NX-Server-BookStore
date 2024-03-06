import * as express from "express";
import { Router } from "express";
import { createGenre } from "../controllers/Genre";
import {
  bookCreate,
  putGenreBooks,
  getItems,
  getItemsWithGenre,
  changeRatingOfBook,
  getRatingOfBook
} from "../controllers/Books.controllers";
import { verifyToken } from "../midleware/verifytoken";

const router = Router();

router.post("/genry", createGenre);
router.post("/books", bookCreate);
router.post("/booksGenry", putGenreBooks);
router.get("/getitems", getItems);
router.get("/getitemsGenre", getItemsWithGenre);
router.post("/changeRatingOfBook", verifyToken, changeRatingOfBook);
router.get("/getRatingOfBook", getRatingOfBook);



export default router;
