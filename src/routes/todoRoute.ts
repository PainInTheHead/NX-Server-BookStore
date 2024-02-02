import * as express from "express";
import { Router } from "express";
import { createTodo, getTodo, deleteTodo, clearHolder, clearComplited, selectTodo, allSelectTodo, editTodo, paginationTodos } from "../controllers/Todo.controllers";
import { verifyToken } from "../midleware/verifytoken";

const router = Router();

router.post("/todo", verifyToken, createTodo);
router.get("/todo", verifyToken, getTodo);
router.delete("/todo/:id", verifyToken, deleteTodo);
router.delete("/clearholder", verifyToken, clearHolder);
router.delete("/clearComplited", verifyToken, clearComplited);
router.put("/todo/:id", verifyToken, selectTodo);
router.put("/allselected", verifyToken, allSelectTodo);
router.put("/edit/:id", verifyToken, editTodo);
router.get("/pagination", verifyToken, paginationTodos);

export default router;
