import { User } from "../entity/user.entity";
import { myDataSource } from "./../../app-data-source";
import { Request, Response } from "express";
import { RequestWithUser } from "../Types/req.user";
import { Book } from "../entity/book.entity";
import { GenreBook } from "../entity/genre-books.entity";
import { Genre } from "../entity/genre.entity";
import { Rate } from "../entity/book_rating.entity";
import { Author } from "../entity/author.entity";
import { Favorites } from "../entity/favorites.entity";
import { FavoriteBook } from "../entity/favorite_book.entity";
import { Between, FindOptionsUtils } from "typeorm";
import { sortByField } from "../utils/books";
const bookRepo = myDataSource.getRepository(Book);
const bookGenreRepo = myDataSource.getRepository(GenreBook);
const genreRepo = myDataSource.getRepository(Genre);
const rateRepo = myDataSource.getRepository(Rate);
const authRepo = myDataSource.getRepository(Author);
const favoritesRepo = myDataSource.getRepository(Favorites);
const favBookRepo = myDataSource.getRepository(FavoriteBook);

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

export const getItemsWithGenre = async function (req: Request, res: Response) {
  const { ids } = req.body;
  const page = req.body.page;
  const take = 4;
  const prices = req.body.prices;
  const startIndex = isNaN(page) ? 0 : (page - 1) * take;
  const endIndex = startIndex + take;
  const sortBy: "Price" | "Name" | "Author_name" | "Rating" | "Date_of_issue" =
    req.body.sortBy;
  try {
    if (!ids[0]) {
      const books = await bookRepo.find({
        where: {
          price: Between(prices[0], prices[1]),
        },
        relations: ["rates", "genre", "auth"],
      });

      let booksWithRateAndHolders = [];
      for (let i = 0; i < books.length; i++) {
        const book = books[i];

        const rate = await rateRepo.findBy({ book: { id: book.id } });
        const sum = rate.reduce(
          (accumulator, currentValue) => accumulator + currentValue.value,
          0
        );
        let average = Math.round(sum / rate.length);
        if (!average) {
          average = 0;
        }

        const defaultBook = {
          bookId: book.id,
          title: book.title,
          description: book.description,
          price: book.price,
          author: book.auth?.author_name,
          liked: book.liked,
          average: average,
        };
        booksWithRateAndHolders.push(defaultBook);
      }

      let sortedData = [];
      switch (sortBy) {
        case "Price":
          sortedData = booksWithRateAndHolders
            .slice()
            .sort(sortByField("price"));
          break;
        case "Name":
          sortedData = booksWithRateAndHolders
            .slice()
            .sort(sortByField("title"));
          break;
        case "Author_name":
          sortedData = booksWithRateAndHolders
            .slice()
            .sort(sortByField("author"));
          break;
        case "Rating":
          sortedData = booksWithRateAndHolders
            .slice()
            .sort(sortByField("average"));
          break;
        case "Date_of_issue":
          console.log(
            "Данные не могут быть отсортированы по дате выпуска, так как соответствующее поле отсутствует."
          );
        default:
          sortedData = booksWithRateAndHolders
            .slice()
            .sort(sortByField("price"));
          break;
      }

      const allBooks = sortedData.slice(startIndex, endIndex);
      const totalCount = sortedData.length;
      const totalPages = Math.ceil(sortedData.length / take);

      return res.status(200).json({ allBooks, totalCount, totalPages });
    }

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
        select: {
          auth: { author_name: true },
        },
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
      const finallyBook = {
        bookId: filtered.id,
        title: filtered.title,
        description: filtered.description,
        price: filtered.price,
        author: filtered.auth?.author_name,
        liked: filtered.liked,
        average,
      };
      return finallyBook;
    });
    const filteredAllBooks = await Promise.all(filteredAllBooksPromises);

    let sortedData = [];
    switch (sortBy) {
      case "Price":
        sortedData = filteredAllBooks.slice().sort(sortByField("price"));
        break;
      case "Name":
        sortedData = filteredAllBooks.slice().sort(sortByField("title"));
        break;
      case "Author_name":
        sortedData = filteredAllBooks.slice().sort(sortByField("author"));
        break;
      case "Rating":
        sortedData = filteredAllBooks.slice().sort(sortByField("average"));
        break;
      case "Date_of_issue":
        console.log(
          "Данные не могут быть отсортированы по дате выпуска, так как соответствующее поле отсутствует."
        );
      default:
        sortedData = filteredAllBooks.slice().sort(sortByField("price"));
        break;
    }

    const filterByPrice = sortedData.filter(
      (book) => book.price >= prices[0] && book.price <= prices[1]
    );

    const allBooks = filterByPrice.slice(startIndex, endIndex);
    const totalCount = filterByPrice.length;
    const totalPages = Math.ceil(filterByPrice.length / take);

    res.status(200).json({ allBooks, totalCount, totalPages });
  } catch (error) {
    res.status(404).json({ message: "Такой пользователь уже существует" });
  }
};

export const addBookToFavorites = async function (
  req: RequestWithUser,
  res: Response
) {
  const { bookId } = req.body;
  try {
    const favoritesOfUser = await favoritesRepo.findOne({
      where: {
        userId: req.user,
      },
    });
    const book = await bookRepo.findOne({
      where: {
        id: bookId,
      },
    });
    const itsFavoritesBook = await favBookRepo.findOne({
      where: { book: book, favorites: favoritesOfUser },
    });

    if (!itsFavoritesBook) {
      const addBookToFavorites = await favBookRepo.create({
        book: book,
        favorites: favoritesOfUser,
      });

      book.liked = true;
      await bookRepo.save(book);

      await favBookRepo.save(addBookToFavorites);

      return res.status(200).json({
        book: addBookToFavorites.book.id,
        favorites: addBookToFavorites.favorites.id,
        id: addBookToFavorites.id,
      });
    } else {
      const deletedTodo = await favBookRepo.remove(itsFavoritesBook);
      if (deletedTodo) {
        book.liked = false;
        await bookRepo.save(book);
        return res.status(200).json({ message: "Книга удалена из избранных" });
      }
    }

    // return res.status(200).json(itsFavoritesBook);
  } catch (error) {
    res.status(404).json({ message: "Произошла ошибка при обработке запроса" });
  }
};

// export const changeRatingOfBook = async function (
//   req: RequestWithUser,
//   res: Response
// ) {
//   try {
//     const rate = await rateRepo.findOneBy({
//       user: req.user.id,
//       book: req.body.bookId,
//     });
//     if (rate) {
//       rateRepo.remove(rate);
//     }
//     const rateNew = rateRepo.create({
//       value: req.body.rate,
//       user: req.user.id,
//       book: req.body.bookId,
//     });

//     await rateRepo.save(rateNew);
//     res.status(200).json(rateNew);
//   } catch (error) {
//     res.status(404).json({ message: "Такой пользователь уже существует" });
//   }
// };

export const getItemsForAuthorized = async function (
  req: RequestWithUser,
  res: Response
) {
  const { ids } = req.body;
  const user = req.user;
  try {
    const favoritesOfUser = await favoritesRepo.findOne({
      where: {
        userId: req.user,
      },
    });

    if (!ids[0]) {
      const books = await bookRepo.find({
        where: {
          price: Between(prices[0], prices[1]),
        },
        relations: ["rates", "genre", "auth"],
      });

      let booksWithRateAndHolders = [];
      for (let i = 0; i < books.length; i++) {
        const book = books[i];

        const rate = await rateRepo.findBy({ book: { id: book.id } });
        const sum = rate.reduce(
          (accumulator, currentValue) => accumulator + currentValue.value,
          0
        );

        let average = Math.round(sum / rate.length);
        if (!average) {
          average = 0;
        }

        const defaultBook = {
          bookId: book.id,
          title: book.title,
          description: book.description,
          price: book.price,
          author: book.auth?.author_name,
          liked: lukas,
          average: average,
        };
        booksWithRateAndHolders.push(defaultBook);
      }

      let sortedData = [];
      switch (sortBy) {
        case "Price":
          sortedData = booksWithRateAndHolders
            .slice()
            .sort(sortByField("price"));
          break;
        case "Name":
          sortedData = booksWithRateAndHolders
            .slice()
            .sort(sortByField("title"));
          break;
        case "Author_name":
          sortedData = booksWithRateAndHolders
            .slice()
            .sort(sortByField("author"));
          break;
        case "Rating":
          sortedData = booksWithRateAndHolders
            .slice()
            .sort(sortByField("average"));
          break;
        case "Date_of_issue":
          console.log(
            "Данные не могут быть отсортированы по дате выпуска, так как соответствующее поле отсутствует."
          );
        default:
          sortedData = booksWithRateAndHolders
            .slice()
            .sort(sortByField("price"));
          break;
      }

      const allBooks = sortedData.slice(startIndex, endIndex);
      const totalCount = sortedData.length;
      const totalPages = Math.ceil(sortedData.length / take);

      return res.status(200).json({ allBooks, totalCount, totalPages });
    }

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
      const book = await bookRepo.findOne({
        where: {
          genre: { id: id },
        },
        relations: { auth: true },
        select: {
          auth: { author_name: true },
        },
      });
      const rate = await rateRepo.findBy({ book: { id: book.id } });
      const sum = rate.reduce(
        (accumulator, currentValue) => accumulator + currentValue.value,
        0
      );
      let average = Math.round(sum / rate.length);
      if (!average) {
        average = 0;
      }

      const Favorites = await favoritesRepo.findOne({
        where: {
          userId: user,
        },
      });

      const FavoritesBook = await favBookRepo.findOne({
        where: {
          book: book,
          favorites: Favorites,
        },
      });

      let lukas = false;
      if (FavoritesBook) {
        lukas = true;
      }

      const finallyBook = {
        bookId: book.id,
        title: book.title,
        description: book.description,
        price: book.price,
        author: book.auth?.author_name,
        liked: lukas,
        average,
      };
      return finallyBook;
    });
    const filteredAllBooks = await Promise.all(filteredAllBooksPromises);
    let sortedData = [];
    switch (sortBy) {
      case "Price":
        sortedData = filteredAllBooks.slice().sort(sortByField("price"));
        break;
      case "Name":
        sortedData = filteredAllBooks.slice().sort(sortByField("title"));
        break;
      case "Author_name":
        sortedData = filteredAllBooks.slice().sort(sortByField("author"));
        break;
      case "Rating":
        sortedData = filteredAllBooks.slice().sort(sortByField("average"));
        break;
      case "Date_of_issue":
        console.log(
          "Данные не могут быть отсортированы по дате выпуска, так как соответствующее поле отсутствует."
        );
      default:
        sortedData = filteredAllBooks.slice().sort(sortByField("price"));
        break;
    }

    const filterByPrice = sortedData.filter(
      (book) => book.price >= prices[0] && book.price <= prices[1]
    );

    const allBooks = filterByPrice.slice(startIndex, endIndex);
    const totalCount = filterByPrice.length;
    const totalPages = Math.ceil(filterByPrice.length / take);

    res.status(200).json({ allBooks, totalCount, totalPages });
  } catch (error) {
    res.status(404).json({ message: "Такой пользователь уже существует" });
  }
};
