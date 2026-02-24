import { JwtPayload } from "jsonwebtoken";
import { IUser } from "../models/User";

declare global {
  namespace Express {
    interface Request {
      user?: HydratedDocument<IUser>
    }
  }
}
