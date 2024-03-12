import * as express from "express";
import { Router } from "express";
import { createGenre } from "../controllers/Genre";
import {
  bookCreate,
  getItems,
  getItemsWithGenre,
  changeRatingOfBook,
  getRatingOfBook,
  addBookToFavorites,
  getItemsForAuthorized,
} from "../controllers/Books.controllers";
import { verifyToken } from "../midleware/verifytoken";

const router = Router();

router.post("/createGenre", createGenre);
router.post("/books", bookCreate);
// router.post("/booksGenry", putGenreBooks);
router.get("/getitems", getItems);
router.post("/getitemsGenre", getItemsWithGenre);
router.post("/changeRatingOfBook", verifyToken, changeRatingOfBook);
router.get("/getRatingOfBook", getRatingOfBook);
router.post("/addBookToFavorites", verifyToken, addBookToFavorites);
router.post("/getItemsForAuthorized",verifyToken, getItemsForAuthorized);


export default router;
