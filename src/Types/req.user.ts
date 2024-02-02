import { Request } from "express";
import { User } from "./../entity/user.entity"; // Путь до модели User

export interface RequestWithUser extends Request {
  user: User;
}