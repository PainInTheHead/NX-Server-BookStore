import { Genre } from "../entity/genre.entity";
import { User } from "../entity/user.entity";
import { myDataSource } from "./../../app-data-source";
import { Request, Response, json } from "express";
import { RequestWithUser } from "../Types/req.user";
import { Book } from "../entity/book.entity";
const bookRepo = myDataSource.getRepository(Book);
const genreRepo = myDataSource.getRepository(Genre);

export const createGenre = async function (req: Request, res: Response) {
  const { name } = req.body;
  try {
    const genre = await genreRepo.create({
      name: name,
    });
    await genreRepo.save(genre);
    res.status(200).json(genre);
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: "Такой пользователь уже существует" });
  }
};


export const getGenres = async function(req: Request, res: Response) {
  try {
    const genres = await genreRepo.find()
    res.status(200).json(genres)
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: "Такой пользователь уже существует" });
  }
};
