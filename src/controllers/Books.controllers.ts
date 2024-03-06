import { User } from "../entity/user.entity";
import { myDataSource } from "./../../app-data-source";
import { Request, Response } from "express";
import { RequestWithUser } from "../Types/req.user";
import { Book } from "../entity/book.entity";
import { GenreBook } from "../entity/genre-books.entity";
import { Genre } from "../entity/genre.entity";
import { Rate } from "../entity/book_rating.entity";
import { Author } from "../entity/author.entity";
const bookRepo = myDataSource.getRepository(Book);
const bookGenreRepo = myDataSource.getRepository(GenreBook);
const genreRepo = myDataSource.getRepository(Genre);
const rateRepo = myDataSource.getRepository(Rate);
const authRepo = myDataSource.getRepository(Author);

export const bookCreate = async function (req: Request, res: Response) {
  const { title, description, price, auth } = req.body;
  try {
    const genreIds = req.body.genre;

    let author = await authRepo.findOne({ where: { author_name: auth } });

    if (!author) {
      const newAuthor = authRepo.create({
        author_name: auth,
      });
      author = newAuthor;
      return await authRepo.save(newAuthor);
    }

    const genres = await Promise.all(
      genreIds.map(async (id) => {
        const genre = await genreRepo.findOne({ where: { id: id } });
        if (!genre) {
          throw new Error(`Жанр с id ${id} не найден`);
        }
        return genre;
      })
    );
    const book = bookRepo.create({
      title: title,
      description: description,
      price: price,
      auth: author,
    });
    await bookRepo.save(book);
    const currentBook = await bookRepo.findOne({
      where: { id: book.id },
      relations: { auth: true },
    });

    let finallyBook = [];

    for (let genre of genres) {
      const genreBook = bookGenreRepo.create({
        booksId: currentBook,
        genres: genre,
      });

      const savedGenreBook = await bookGenreRepo.save(genreBook);
      finallyBook.push(savedGenreBook);
    }

    res.status(200).json(finallyBook);
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: "Такой пользователь уже существует" });
  }
};

export const getItems = async function (req: Request, res: Response) {
  try {
    const currentBook = await bookRepo.find({ relations: ["rates", "genre"] });
    const currentGenre = await genreRepo.find();
    const currentGenreBook = await bookGenreRepo.find({
      relations: ["genres", "booksId"],
    });

    res.status(200).json({
      currentBook: currentBook,
      currentGenre: currentGenre,
      currentGenreBook: currentGenreBook,
    });
  } catch (error) {
    res.status(404).json({ message: "Такой пользователь уже существует" });
  }
};

export const changeRatingOfBook = async function (
  req: RequestWithUser,
  res: Response
) {
  try {
    const rate = await rateRepo.findOneBy({
      user: req.user.id,
      book: req.body.bookId,
    });
    if (rate) {
      rateRepo.remove(rate);
    }
    const rateNew = rateRepo.create({
      value: req.body.rate,
      user: req.user.id,
      book: req.body.bookId,
    });

    await rateRepo.save(rateNew);
    res.status(200).json(rateNew);
  } catch (error) {
    res.status(404).json({ message: "Такой пользователь уже существует" });
  }
};

export const getRatingOfBook = async function (
  req: RequestWithUser,
  res: Response
) {
  try {
    const rate = await rateRepo.find({
      where: {
        book: { id: req.body.bookId },
      },
      relations: ["book"],
    });
    const book = await bookRepo.findOne({
      where: {
        id: req.body.bookId,
      },
      relations: ["rates"],
    });
    if (rate.length === 0) {
      res.status(200).json({ rate: 0, book: book });
    } else {
      const sum = rate.reduce(
        (accumulator, currentValue) => accumulator + currentValue.value,
        0
      );
      const average = Math.round(sum / rate.length);
      res.status(200).json({ rate: average, book: book });
    }
  } catch (error) {
    res.status(404).json({ message: "Такой пользователь уже существует" });
  }
};

export const putGenreBooks = async function (req: Request, res: Response) {
  // const { bookId, genreId } = req.body;
  // try {
  //   const curentBook = await bookRepo.findOneBy({ id: bookId });
  //   const curentGenre = await genryRepo.findOneBy({ id: genreId });
  //   if (!curentBook || !curentGenre) {
  //     return res
  //       .status(400)
  //       .json({ message: "Такой пользователь уже существует" });
  //   }
  //   const inValidBook = await bookGenryRepo.findOneBy({ booksId: curentBook });
  //   if (inValidBook) {
  //     return res
  //       .status(400)
  //       .json({ message: "Такой пользователь уже существует" });
  //   }
  //   const book = bookGenryRepo.create({
  //     booksId: curentBook,
  //     genreId: curentGenre,
  //   });
  //   await bookGenryRepo.save(book);
  //   res.status(200).json(book);
  // } catch (error) {
  //   res.status(404).json({ message: "Такой пользователь уже существует" });
  // }
};

export const getItemsWithGenre = async function (req: Request, res: Response) {
  const { ids } = req.body;
  try {
    const filterPromise = ids.map(async (id) => {
      const filter = await bookGenreRepo.find({
        where: {
          genres: { id: id },
        },
        relations: { booksId: true },
      });
      return filter;
    });
    const genreFilters = (await Promise.all(filterPromise)).flat();

    const uniqueBooksId = [];
    const FILTER = genreFilters.filter((filter) => {
      if (!uniqueBooksId.includes(filter.booksId.id)) {
        uniqueBooksId.push(filter.booksId.id);
        return true;
      }
      return false;
    });

    const filteredAllBooksPromises = FILTER.map(async (ids) => {
      const id = ids.id;
      const filtered = await bookRepo.findOne({
        where: {
          genre: { id: id },
        },
        relations: { auth: true },
      });
      const rate = await rateRepo.findBy({ book: { id: filtered.id } });
      const sum = rate.reduce(
        (accumulator, currentValue) => accumulator + currentValue.value,
        0
      );
      let average = Math.round(sum / rate.length);
      if (!average) {
        average = 0;
      }
      const finallyBook = { filtered, average };
      return finallyBook;
    });
    const filteredAllBooks = await Promise.all(filteredAllBooksPromises);

    res.status(200).json(filteredAllBooks);
  } catch (error) {
    res.status(404).json({ message: "Такой пользователь уже существует" });
  }
};