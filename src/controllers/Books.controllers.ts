import { User } from "../entity/user.entity";
import { myDataSource } from "./../../app-data-source";
import { NextFunction, Request, Response } from "express";
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
import { Cart } from "../entity/cart.entity";
import { CartBook } from "../entity/cart_book.entity";
import { Comments } from "../entity/comments.entity";
import { CustomError } from "../midleware/errorHandler";
import { StatusCodes } from "http-status-codes";
const bookRepo = myDataSource.getRepository(Book);
const bookGenreRepo = myDataSource.getRepository(GenreBook);
const genreRepo = myDataSource.getRepository(Genre);
const rateRepo = myDataSource.getRepository(Rate);
const authRepo = myDataSource.getRepository(Author);
const favoritesRepo = myDataSource.getRepository(Favorites);
const favBookRepo = myDataSource.getRepository(FavoriteBook);
const cartRepo = myDataSource.getRepository(Cart);
const cartBookRepo = myDataSource.getRepository(CartBook);
const commentRepo = myDataSource.getRepository(Comments);

export const bookCreate = async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { title, description, price, auth } = req.body;
  try {
    const genreIds = req.body.genre;
    const coverNumber = req.body.cover;

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
          throw new CustomError(
            "Genre not found, try again with other genres",
            StatusCodes.NOT_FOUND
          );
        }
        return genre;
      })
    );

    const finallyCoverPath = `http://localhost:3005/covers/${coverNumber}.png`;
    const book = bookRepo.create({
      title: title,
      description: description,
      price: price,
      auth: author,
      date: new Date(),
      cover: finallyCoverPath,
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
    next(error);
  }
};

export const getCurrentBook = async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const id = req.params.id;
  try {
    const currentBook = await bookRepo.findOne({
      where: {
        id: Number(id),
      },
      relations: ["auth"],
    });
    if (!currentBook) {
      throw new CustomError("Books not found", StatusCodes.NOT_FOUND);
    }
    const rate = await rateRepo.findBy({ book: { id: currentBook.id } });
    const sum = rate.reduce(
      (accumulator, currentValue) => accumulator + currentValue.value,
      0
    );

    let average = sum / rate.length;
    let roundedAverage = Math.round(average * 10) / 10;
    if (!average) {
      roundedAverage = 0;
    }

    res.status(200).json({
      bookId: currentBook.id,
      title: currentBook.title,
      description: currentBook.description,
      price: currentBook.price,
      author: currentBook.auth?.author_name,
      liked: currentBook.liked,
      average: roundedAverage,
      date: currentBook.date,
      cover: currentBook.cover,
    });
  } catch (error) {
    next(error);
  }
};

export const getItems = async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const currentBook = await bookRepo.find({ relations: ["rates", "genre"] });
    const currentGenre = await genreRepo.find();
    const currentGenreBook = await bookGenreRepo.find({
      relations: ["genres", "booksId"],
    });

    const Rates = await rateRepo.find({ relations: ["user"] });
    res.status(200).json({
      currentBook: currentBook,
      currentGenre: currentGenre,
      currentGenreBook: currentGenreBook,
      Rates,
    });
  } catch (error) {
    next(error);
  }
};

export const changeRatingOfBook = async function (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  try {
    const book = await bookRepo.findOne({
      where: {
        id: req.body.bookId,
      },
    });
    if (!book) {
      throw new CustomError("Books not found", StatusCodes.NOT_FOUND);
    }
    const rate = await rateRepo.findOne({
      where: {
        user: req.user,
        book: book,
      },
      relations: ["user", "book"],
    });
    if (rate) {
      await rateRepo.remove(rate);
    }
    const rateNew = rateRepo.create({
      value: req.body.rate,
      user: req.user,
      book: book,
    });

    await rateRepo.save(rateNew);
    res.status(200).json(rateNew);
  } catch (error) {
    next(error);
  }
};

export const getRatingOfBook = async function (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
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
    if (!book) {
      throw new CustomError("Books not found", StatusCodes.NOT_FOUND);
    }
    if (rate.length === 0) {
      return res.status(200).json({ rate: 0, book: book });
    } else {
      const sum = rate.reduce(
        (accumulator, currentValue) => accumulator + currentValue.value,
        0
      );

      let average = sum / rate.length;
      let roundedAverage = Math.round(average * 10) / 10;
      return res.status(200).json({ rate: roundedAverage, book: book });
    }
  } catch (error) {
    next(error);
  }
};

export const getItemsForAuthorized = async function (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  const { ids, searchQuery } = req.body;
  const user = req.user;
  const page = req.body.page;
  const take = 8;
  const prices = req.body.prices;
  const startIndex = isNaN(page) ? 0 : (page - 1) * take;
  const endIndex = startIndex + take;
  const sortBy: "Price" | "Name" | "Author_name" | "Rating" | "Date_of_issue" =
    req.body.sortBy;

  try {
    if (!ids[0]) {
      const books = await bookRepo.find({
        where: {
          price: Between(prices[0], prices[1] * 100),
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

        let average = sum / rate.length;
        let roundedAverage = Math.round(average * 10) / 10;
        if (!average) {
          roundedAverage = 0;
        }
        let lukas = false;
        if (req.user) {
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
          if (FavoritesBook) {
            lukas = true;
          }
        }

        const defaultBook = {
          bookId: book.id,
          title: book.title,
          description: book.description,
          price: book.price,
          author: book.auth?.author_name,
          liked: lukas,
          average: roundedAverage,
          date: book.date,
          cover: book.cover,
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
          sortedData = booksWithRateAndHolders
            .slice()
            .sort(sortByField("date"));
          break;
        default:
          sortedData = booksWithRateAndHolders
            .slice()
            .sort(sortByField("price"));
          break;
      }
      const filteredResults = sortedData.filter(
        (book) =>
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const allBooks = filteredResults.slice(startIndex, endIndex);
      const totalCount = filteredResults.length;
      const totalPages = Math.ceil(filteredResults.length / take);

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

      let average = sum / rate.length;
      let roundedAverage = Math.round(average * 10) / 10;
      if (!average) {
        roundedAverage = 0;
      }

      let lukas = false;
      if (req.user) {
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

        if (FavoritesBook) {
          lukas = true;
        }
      }

      const finallyBook = {
        bookId: book.id,
        title: book.title,
        description: book.description,
        price: book.price,
        author: book.auth?.author_name,
        liked: lukas,
        roundedAverage,
        date: book.date,
        cover: book.cover,
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
        sortedData = filteredAllBooks.slice().sort(sortByField("date"));
        break;
      default:
        sortedData = filteredAllBooks.slice().sort(sortByField("price"));
        break;
    }

    const filterByPrice = sortedData.filter(
      (book) => book.price >= prices[0] && book.price <= prices[1] * 100
    );

    const filteredResults = filterByPrice.filter(
      (book) =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const allBooks = filteredResults.slice(startIndex, endIndex);
    const totalCount = filteredResults.length;
    const totalPages = Math.ceil(filteredResults.length / take);

    res.status(200).json({ allBooks, totalCount, totalPages });
  } catch (error) {
    next(error);
  }
};

export const addBookToFavorites = async function (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  const { bookId } = req.body;
  try {
    const favoritesOfUser = await favoritesRepo.findOne({
      where: {
        userId: req.user,
      },
    });
    if (!favoritesOfUser) {
      throw new CustomError(
        "User deleted, pls try this on new profile",
        StatusCodes.NOT_FOUND
      );
    }
    const book = await bookRepo.findOne({
      where: {
        id: bookId,
      },
    });
    if (!book) {
      throw new CustomError("Book not found", StatusCodes.NOT_FOUND);
    }
    const itsFavoritesBook = await favBookRepo.findOne({
      where: { book: book, favorites: favoritesOfUser },
    });

    if (!itsFavoritesBook) {
      const addBookToFavorites = favBookRepo.create({
        book: book,
        favorites: favoritesOfUser,
      });

      const newFavoriteBook = await favBookRepo.save(addBookToFavorites);

      return res.status(200).json({
        book: newFavoriteBook.book.id,
        favorites: newFavoriteBook.favorites.id,
        id: newFavoriteBook.id,
      });
    } else {
      const deletedBook = await favBookRepo.remove(itsFavoritesBook);

      return res.status(200).json({
        book: book.id,
      });
    }
  } catch (error) {
    next(error);
  }
};

export const addBookToCart = async function (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  const { bookId, count } = req.body;
  try {
    const cartOfUser = await cartRepo.findOne({
      where: {
        userId: req.user,
      },
    });

    const book = await bookRepo.findOne({
      where: {
        id: bookId,
      },
    });
    if (!book) {
      throw new CustomError("Book not found", StatusCodes.NOT_FOUND);
    }
    const itsCartBook = await cartBookRepo.findOne({
      where: { book: book, cart: cartOfUser },
      relations: ["book", "cart"],
    });

    if (!itsCartBook) {
      const addBookToCart = cartBookRepo.create({
        book: book,
        cart: cartOfUser,
        count: count,
      });

      await cartBookRepo.save(addBookToCart);

      return res.status(200).json(addBookToCart);
    }
    // return res.status(200).json(itsCartBook);

    if (count === 0) {
      await cartBookRepo.remove(itsCartBook);

      return res.status(200).json({
        book: book.id,
        message: "Удалили",
      });
    }

    itsCartBook.count = count;
    await cartBookRepo.save(itsCartBook);
    return res.status(200).json(itsCartBook);
  } catch (error) {
    next(error);
  }
};

export const getBooksOfCarts = async function (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  try {
    const cartOfUser = await cartRepo.findOne({
      where: {
        userId: req.user,
      },
    });
    if (!cartOfUser) {
      throw new CustomError("User deleted, pls create new profile", StatusCodes.NOT_FOUND);
    }
    const booksIdandCountInCart = await cartBookRepo.find({
      where: { cart: cartOfUser },
      relations: ["book"],
    });
if (!booksIdandCountInCart) {
  throw new CustomError("Books not found", StatusCodes.NOT_FOUND);
}
    const finallyBooks = [];

    const booksCart = await Promise.all(
      booksIdandCountInCart.map(async (bookcart) => {
        const book = await bookRepo.findOne({
          where: {
            id: bookcart.book.id,
          },
          relations: ["auth"],
        });
        finallyBooks.push({
          bookId: book.id,
          title: book.title,
          price: book.price,
          author: book.auth.author_name,
          count: bookcart.count,
          cover: book.cover,
        });
      })
    );
    res.status(200).json(finallyBooks);
  } catch (error) {
    next(error);
  }
};

export const getUserRatingCurrentBook = async function (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  const user = req.user;
  const bookId = Number(req.query.bookId);
  try {
    const rateOfBook = await rateRepo.findOne({
      where: {
        user: user,
        book: { id: bookId },
      },
      relations: ["user", "book"],
    });

    if (!rateOfBook) {
      return res.status(200).json({
        rate: 0,
      });
    }

    return res.status(200).json({
      rate: rateOfBook.value,
    });
  } catch (error) {
    next(error);
  }
};

export const newComment = async function (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  try {
    const today = new Date();
    const book = await bookRepo.findOne({
      where: {
        id: req.body.bookId,
      },
    });
    if (!book) {
      throw new CustomError("Book not found", StatusCodes.NOT_FOUND);
    }
    const newCom = commentRepo.create({
      value: req.body.text,
      user: req.user,
      book: book,
      date: new Date(),
    });

    const savedCom = await commentRepo.save(newCom);

    let timeAgo: string;
    const diffTime = Math.abs(today.getTime() - savedCom.date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    if (diffMinutes < 1) {
      timeAgo = "сейчас";
    } else if (diffMinutes < 60) {
      if (diffMinutes === 1) {
        timeAgo = "минуту назад";
      } else {
        timeAgo = `${diffMinutes} минут назад`;
      }
    } else if (diffMinutes < 120) {
      timeAgo = "час назад";
    } else if (diffMinutes < 1440) {
      const diffHours = Math.floor(diffMinutes / 60);
      timeAgo = `${diffHours} ${diffHours === 1 ? "час" : "часа"} назад`;
    } else {
      const diffDays = Math.ceil(diffMinutes / 60 / 24);
      timeAgo = `${diffDays} ${diffDays === 1 ? "день" : "дня"} назад`;
    }

    res.status(200).json({
      id: newCom.id,
      value: newCom.value,
      avatar: newCom.user.avatar,
      username: newCom.user.userName,
      timeAgo: timeAgo,
    });
  } catch (error) {
    next(error);
  }
};

export const getCommentForCurrentBook = async function (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  try {
    const today = new Date();
    const comments = await commentRepo.find({
      where: {
        book: { id: Number(req.query.bookId) },
      },
      relations: ["book", "user"],
    });
    if (comments.length === 0) {
      return res.status(200).json([]);
    } else {
      const allComments = comments.map((comment) => {
        let timeAgo: string;
        const diffTime = Math.abs(today.getTime() - comment.date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffMinutes = Math.ceil(diffTime / (1000 * 60));
        if (diffMinutes < 1) {
          timeAgo = "сейчас";
        } else if (diffMinutes < 60) {
          if (diffMinutes === 1) {
            timeAgo = "минуту назад";
          } else {
            timeAgo = `${diffMinutes} минут назад`;
          }
        } else if (diffMinutes < 120) {
          timeAgo = "час назад";
        } else if (diffMinutes < 1440) {
          const diffHours = Math.floor(diffMinutes / 60);
          timeAgo = `${diffHours} ${diffHours === 1 ? "час" : "часа"} назад`;
        } else {
          const diffDays = Math.ceil(diffMinutes / 60 / 24);
          timeAgo = `${diffDays} ${diffDays === 1 ? "день" : "дня"} назад`;
        }
        return {
          id: comment.id,
          value: comment.value,
          avatar: comment.user.avatar,
          username: comment.user.userName,
          timeAgo: timeAgo,
        };
      });
      res.status(200).json(allComments);
    }
  } catch (error) {
    next(error);
  }
};

export const getRecommendations = async function (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  try {
    const book = await bookRepo.findOne({
      where: {
        id: req.body.bookId,
      },
      relations: ["genre"],
    });
    if (!book) {
      throw new CustomError("Book not found", StatusCodes.NOT_FOUND);
    }
    const genres = await genreRepo.find({
      where: { genre: book.genre },
    });

    const genreBook = await bookGenreRepo.find({
      where: { genres: genres },
      relations: ["booksId"],
    });
    const filteredBooks = genreBook.filter(
      (book) => book.booksId.id !== req.body.bookId
    );

    const uniqueBooksId = [];
    const FILTER = filteredBooks.filter((filter) => {
      if (!uniqueBooksId.includes(filter.booksId.id)) {
        uniqueBooksId.push(filter.booksId.id);
        return true;
      }
      return false;
    });

    const result = await Promise.all(
      FILTER.map(async (book) => {
        const rates = await rateRepo.find({
          where: {
            book: { id: book.booksId.id },
          },
          relations: ["book"],
        });

        const sum = rates.reduce(
          (total, current) => ({
            sum: total.sum + current.value,
            count: total.count + 1,
          }),
          { sum: 0, count: 0 }
        );

        const average = sum.count > 0 ? sum.sum / sum.count : 0;
        const roundedAverage = Math.round(average * 10) / 10;
        const authName = await authRepo.findOne({
          where: {
            book: book.booksId,
          },
        });
        return {
          bookId: book.booksId.id,
          title: book.booksId.title,
          description: book.booksId.description,
          price: book.booksId.price,
          author: authName.author_name,
          liked: false,
          date: book.booksId.date,
          roundedAverage,
          cover: book.booksId.cover,
        };
      })
    );

    const sortedData = result
      .sort((a, b) => b.roundedAverage - a.roundedAverage)
      .slice(0, 4);
    res.status(200).json(sortedData);
  } catch (error) {
    next(error);
  }
};

export const getRecommendationsForAuth = async function (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  const user = req.user;
  try {
    const book = await bookRepo.findOne({
      where: {
        id: req.body.bookId,
      },
      relations: ["genre"],
    });
    if (!book) {
      throw new CustomError("Book not found", StatusCodes.NOT_FOUND);
    }
    const genres = await genreRepo.find({
      where: { genre: book.genre },
    });

    const genreBook = await bookGenreRepo.find({
      where: { genres: genres },
      relations: ["booksId"],
    });
    const filteredBooks = genreBook.filter(
      (book) => book.booksId.id !== req.body.bookId
    );

    const uniqueBooksId = [];
    const FILTER = filteredBooks.filter((filter) => {
      if (!uniqueBooksId.includes(filter.booksId.id)) {
        uniqueBooksId.push(filter.booksId.id);
        return true;
      }
      return false;
    });

    const result = await Promise.all(
      FILTER.map(async (book) => {
        const rates = await rateRepo.find({
          where: {
            book: { id: book.booksId.id },
          },
          relations: ["book"],
        });

        const sum = rates.reduce(
          (total, current) => ({
            sum: total.sum + current.value,
            count: total.count + 1,
          }),
          { sum: 0, count: 0 }
        );

        const average = sum.count > 0 ? Math.round(sum.sum / sum.count) : 0;

        const Favorites = await favoritesRepo.findOne({
          where: {
            userId: user,
          },
        });

        const FavoritesBook = await favBookRepo.findOne({
          where: {
            book: book.booksId,
            favorites: Favorites,
          },
        });

        let lukas = false;
        if (FavoritesBook) {
          lukas = true;
        }
        const authName = await authRepo.findOne({
          where: {
            book: book.booksId,
          },
        });

        return {
          bookId: book.booksId.id,
          title: book.booksId.title,
          description: book.booksId.description,
          price: book.booksId.price,
          author: authName.author_name,
          liked: lukas,
          date: book.booksId.date,
          average,
          cover: book.booksId.cover,
        };
      })
    );

    const sortedData = result.sort((a, b) => b.average - a.average).slice(0, 4);
    res.status(200).json(sortedData);
  } catch (error) {
    next(error);
  }
};
