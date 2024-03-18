import { myDataSource } from "../../app-data-source";
import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { User } from "../entity/user.entity";
import { RequestWithUser } from "../Types/req.user";

export const verifyUser = async function (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return next();
  }

  try {
    const decoded: { userId: number } = jwt.verify(token, "dev-jwt") as {
      userId: number;
    };
    const userId = decoded.userId;

    const userRepository = myDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: userId });
    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    console.error(error);

    next();
  }
};
