import * as express from "express";
import { Router } from "express";
import { createGenre, getGenres } from "../controllers/Genre";
import {
  bookCreate,
  getItems,
  changeRatingOfBook,
  getRatingOfBook,
  addBookToFavorites,
  getItemsForAuthorized,
  getUserRatingCurrentBook,
  addBookToCart,
  newComment,
  getCommentForCurrentBook,
  getBooksOfCarts,
  getRecommendations,
  getRecommendationsForAuth,
  getCurrentBook,
} from "../controllers/Books.controllers";
import { verifyToken } from "../midleware/verifytoken";
import { verifyUser } from "../midleware/getUser";

const router = Router();

router.post("/genres", createGenre);
router.post("/book", bookCreate);
router.get("/items", getItems);
router.post("/change/rating", verifyToken, changeRatingOfBook);
router.post("/comment", verifyToken, newComment);
router.get("/rating", getRatingOfBook);
router.get("/comment", getCommentForCurrentBook);
router.post("/favorites", verifyToken, addBookToFavorites);
router.post("/cart", verifyToken, addBookToCart);
router.post("/filtered", verifyUser, getItemsForAuthorized);
router.get("/rate", verifyToken, getUserRatingCurrentBook);
router.get("/cart", verifyToken, getBooksOfCarts);
router.post("/recommendation", getRecommendations);
router.post("/recommendation/foruser", verifyToken, getRecommendationsForAuth);
router.get("/book/:id", getCurrentBook);
router.get("/genres", getGenres);

export default router;
