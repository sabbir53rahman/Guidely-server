import { IRequestUser } from "./requestUser.interface";
import { NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      user: IRequestUser;
      file?: Express.Multer.File;
      files?: Express.Multer.File[];
    }
  }
}

export { NextFunction };
