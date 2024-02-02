import { User } from "../entity/user.entity";
import { myDataSource } from "./../../app-data-source";
import { Request, Response } from "express";
import * as bcrypt from "bcryptjs";
const jwt = require("jsonwebtoken");
import { RequestWithUser } from "../Types/req.user";
const userRepo = myDataSource.getRepository(User);

export const userRegister = async function (req: Request, res: Response) {
  const { email, password } = req.body;
  try {
    const newUser = userRepo.findOneBy({ email: email });
    if (newUser) {
      return res
        .status(409)
        .json({ message: "this email in now moment is be registed" });
    }
    const salt = bcrypt.genSaltSync(10);
    const user = myDataSource.getRepository(User).create({
      email: email,
      password: bcrypt.hashSync(password, salt),
    });
    await userRepo.save(user).then(() => console.log("User created"));
    res.status(201).json(user);
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
    const descryptPass = bcrypt.compareSync(password, user.password);
    if (!descryptPass) {
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
    return res
      .status(200)
      .json({ token: `Bearer ${token}`, id: user.id, avatar: user.avatar });
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
      return 
    }
    res.json(user);
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
