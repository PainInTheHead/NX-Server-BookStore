import { StatusCodes } from "http-status-codes";
import { Response, Request, NextFunction } from "express";

export class CustomError extends Error {
  status: StatusCodes;
  data?: any;
  constructor(message: string, status: StatusCodes, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof CustomError) {
    return res
      .status(err.status)
      .json({ message: err.message, data: err.data });
  }

  res.status(500).json({ message: err });
};
