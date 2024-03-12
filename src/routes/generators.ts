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
  getUserRatingCurrentBook,
  addBookToCart,
  newComment,
  getCommentForCurrentBook
} from "../controllers/Books.controllers";
import { verifyToken } from "../midleware/verifytoken";

const router = Router();

router.post("/createGenre", createGenre);
router.post("/booksCreate", bookCreate);
// router.post("/booksGenry", putGenreBooks);
router.get("/getitems", getItems);
router.post("/getitemsGenre", getItemsWithGenre);
router.post("/changeRatingOfBook", verifyToken, changeRatingOfBook);
router.post("/newComment", verifyToken, newComment);
router.get("/getRatingOfBook", getRatingOfBook);
router.get("/getCommentForCurrentBook", getCommentForCurrentBook);
router.post("/addBookToFavorites", verifyToken, addBookToFavorites);
router.post("/addBookToCart", verifyToken, addBookToCart);
router.post("/getItemsForAuthorized", verifyToken, getItemsForAuthorized);
router.get("/getUserRatingCurrentBook", verifyToken, getUserRatingCurrentBook);

export default router;
