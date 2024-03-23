import { Genre } from "../entity/genre.entity";
import { myDataSource } from "./../../app-data-source";
import { NextFunction, Request, Response, json } from "express";
const genreRepo = myDataSource.getRepository(Genre);

export const createGenre = async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { name } = req.body;
  try {
    const genre = genreRepo.create({
      name: name,
    });
    await genreRepo.save(genre);
    res.status(200).json(genre);
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: "Use a different genre name" });
  }
};


export const getGenres = async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const genres = await genreRepo.find();
    res.status(200).json(genres);
  } catch (error) {
    console.error(error);
    next(error);
  }
};
