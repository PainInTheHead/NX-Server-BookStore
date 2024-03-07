import { User } from "../entity/user.entity";
import { myDataSource } from "./../../app-data-source";
import { Request, Response } from "express";
import * as bcrypt from "bcryptjs";
const jwt = require("jsonwebtoken");
import { RequestWithUser } from "../Types/req.user";
import * as fs from "fs";
import { Favorites } from "../entity/favorites.entity";
const path = require("path");

const userRepo = myDataSource.getRepository(User);
const favoriteRepo = myDataSource.getRepository(Favorites);
const salt = bcrypt.genSaltSync(10);

export const userRegister = async function (req: Request, res: Response) {
  const { email, password } = req.body;
  try {
    const newUser = await userRepo.findOneBy({ email: email });
    if (newUser) {
      return res
        .status(409)
        .json({ message: "this email in now moment is be registed" });
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

    const userWithFavorites = await userRepo.findOne({
      where: {
        id: user.id,
      },
      relations: ["favorites"],
    });
    res.status(201).json({ user: userWithFavorites, favorites });
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: "Такой пользователь уже существует" });
  }
};

export const userLogin = async function (req: Request, res: Response) {
  const { email, password } = req.body;
  try {
    const user = await userRepo.findOneBy({ email: email });
    if (!user) {
      return;
    }
    const decryptPass = bcrypt.compareSync(password, user.password);
    if (!decryptPass) {
      return res.status(401).json({ message: "неверный логин или пароль" });
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
      token: `Bearer ${token}`,
      id: user.id,
      avatar: user.avatar,
      userName: user.userName,
      email: user.email,
      favorites: favorites.id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
};

export const getUser = async function (req: RequestWithUser, res: Response) {
  const userFromToken = req.user;
  try {
    const user = await userRepo.findOneBy({ id: userFromToken.id });
    if (!user) {
      return;
    }
    const { userName, email, avatar, id } = user;
    res.json({ userName, email, avatar, id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
};

export const userMakeAva = async function (
  req: RequestWithUser,
  res: Response
) {
  try {
    const { id, avatar } = req.body;

    const user = await userRepo.findOneBy({ id: id });
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }
    user.avatar = avatar;
    await myDataSource.getRepository(User).save(user);
    res.status(200).json({ message: "Аватар изменен" });
  } catch (error) {
    console.error("Ошибка сервера:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
};

export const userFormDataAvatar = async function (
  req: RequestWithUser,
  res: Response
) {
  try {
    const userFromToken = req.user;
    const user = await userRepo.findOneBy({ id: userFromToken.id });
    if (!user) {
      return;
    }
    const oldAvatarPath = user.avatar;
    user.avatar = req.file.filename;
    await myDataSource.getRepository(User).save(user);

    if (oldAvatarPath) {
      const filePath = path.join(__dirname, "../uploads", oldAvatarPath);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Ошибка при удалении файла:", err);
        } else {
          console.log("Файл успешно удален");
        }
      });
    }
    res.status(200).json({ filename: req.file.filename });
  } catch (error) {
    console.error("Ошибка сервера:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
};

export const changeInfoAboutUser = async function (
  req: RequestWithUser,
  res: Response
) {
  const userId = req.user.id;
  const { Email, UserName } = req.body;
  try {
    const currentUser = await userRepo.findOneBy({ id: userId });
    if (!currentUser) {
      return;
    }
    currentUser.email = Email;
    currentUser.userName = UserName;
    await userRepo.save(currentUser);
    res
      .status(200)
      .json({ email: currentUser.email, userName: currentUser.userName });
  } catch (error) {
    console.error("Ошибка сервера:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
};

export const changePasswordUser = async function (
  req: RequestWithUser,
  res: Response
) {
  const userId = req.user.id;
  const { Password } = req.body;

  try {
    const currentUser = await userRepo.findOneBy({ id: userId });
    if (!currentUser) {
      return;
    }
    currentUser.password = bcrypt.hashSync(Password, salt);
    await userRepo.save(currentUser);
    res.status(200).json({ Password: Password });
  } catch (error) {
    console.error("Ошибка сервера:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
};
