import { User } from "../entity/user.entity";
import { myDataSource } from "./../../app-data-source";
import { NextFunction, Request, Response } from "express";
import * as bcrypt from "bcryptjs";
const jwt = require("jsonwebtoken");
import { RequestWithUser } from "../Types/req.user";
import * as fs from "fs";
import { Favorites } from "../entity/favorites.entity";
import { Cart } from "../entity/cart.entity";
const path = require("path");
import { StatusCodes } from "http-status-codes";
import { CustomError } from "../midleware/errorHandler";

const userRepo = myDataSource.getRepository(User);
const favoriteRepo = myDataSource.getRepository(Favorites);
const cartRepo = myDataSource.getRepository(Cart);
const salt = bcrypt.genSaltSync(10);

export const userRegister = async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { email, password } = req.body;
  try {
    const newUser = await userRepo.findOneBy({ email: email });
    if (newUser) {
      throw new CustomError("This user already exists", StatusCodes.CONFLICT);
    }

    const user = myDataSource.getRepository(User).create({
      email: email,
      password: bcrypt.hashSync(password, salt),
    });
    await userRepo.save(user).then(() => console.log("User created"));

    const favorites = favoriteRepo.create({
      userId: user,
    });
    await favoriteRepo.save(favorites);

    const cart = cartRepo.create({
      userId: user,
    });
    await cartRepo.save(cart);

    const userWithFavorites = await userRepo.findOne({
      where: {
        id: user.id,
      },
      relations: ["favorites", "cart"],
    });
    res.status(201).json({ user: userWithFavorites, favorites });
  } catch (error) {
    next(error);
  }
};

export const userLogin = async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { email, password } = req.body;
  try {
    const user = await userRepo.findOneBy({ email: email });
    if (!user) {
      throw new CustomError(
        "This user does not exist",
        StatusCodes.BAD_REQUEST
      );
    }
    const decryptPass = bcrypt.compareSync(password, user.password);
    if (!decryptPass) {
      throw new CustomError(
        "Invalid authentication details",
        StatusCodes.BAD_REQUEST
      );
    }
    const token = jwt.sign(
      {
        email: user.email,
        userId: user.id,
      },
      "dev-jwt",
      { expiresIn: 60 * 60 }
    );

    const favorites = await favoriteRepo.findOne({ where: { userId: user } });
    return res.status(200).json({
      token: token,
      id: user.id,
      avatar: user.avatar,
      userName: user.userName,
      email: user.email,
      favorites: favorites.id,
    });
  } catch (error) {
    next(error);
  }
};

export const getUser = async function (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  const userFromToken = req.user;
  try {
    const user = await userRepo.findOneBy({ id: userFromToken.id });
    if (!user) {
      throw new CustomError("Authorisation Error", StatusCodes.UNAUTHORIZED);
    }
    const { userName, email, avatar, id } = user;
    res.json({ userName, email, avatar, id });
  } catch (error) {
    next(error);
  }
};

export const userMakeAva = async function (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  try {
    const { id, avatar } = req.body;

    const user = await userRepo.findOneBy({ id: id });
    if (!user) {
      throw new CustomError("Authorisation Error", StatusCodes.UNAUTHORIZED);
    }
    user.avatar = avatar;
    await myDataSource.getRepository(User).save(user);
    res.status(200).json({ message: "Avatar changed" });
  } catch (error) {
    next(error);
  }
};

export const userFormDataAvatar = async function (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  try {
    const userFromToken = req.user;
    const user = await userRepo.findOneBy({ id: userFromToken.id });
    if (!user) {
      throw new CustomError("Authorisation Error", StatusCodes.UNAUTHORIZED);
    }
    const oldAvatarPath = user.avatar;
    user.avatar = req.file.filename;
    await myDataSource.getRepository(User).save(user);

    if (oldAvatarPath) {
      const filePath = path.join(__dirname, "../uploads", oldAvatarPath);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Error when deleting file:", err);
        } else {
          console.log("File deleted successfully");
        }
      });
    }
    res.status(200).json({ filename: req.file.filename });
  } catch (error) {
    next(error);
  }
};

export const changeInfoAboutUser = async function (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  const userId = req.user.id;
  const { Email, UserName } = req.body;
  try {
    const currentUser = await userRepo.findOneBy({ id: userId });
    if (!currentUser) {
      throw new CustomError("Authorisation Error", StatusCodes.UNAUTHORIZED);
    }
    currentUser.email = Email;
    currentUser.userName = UserName;
    await userRepo.save(currentUser);
    res
      .status(200)
      .json({ email: currentUser.email, userName: currentUser.userName });
  } catch (error) {
    next(error);
  }
};

export const changePasswordUser = async function (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  const userId = req.user.id;
  const { Password, oldPassword } = req.body;

  try {
    const currentUser = await userRepo.findOneBy({ id: userId });
    if (!currentUser) {
      throw new CustomError("Authorisation Error", StatusCodes.UNAUTHORIZED);
    }
    const decryptPass = bcrypt.compareSync(oldPassword, currentUser.password);
    if (!decryptPass) {
      throw new CustomError(
        "The old password is incorrect",
        StatusCodes.BAD_REQUEST
      );
    }
    currentUser.password = bcrypt.hashSync(Password, salt);
    await userRepo.save(currentUser);
    res.status(200).json({ Password: Password });
  } catch (error) {
    next(error);
  }
};
