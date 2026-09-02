import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

// Verifies JWT (from Authorization header) and attaches req.user
export const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Not authorized, no token provided");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);

  if (!user) throw new ApiError(401, "Not authorized, user no longer exists");
  if (!user.isActive) throw new ApiError(403, "This account has been deactivated");

  req.user = user;
  next();
});

// Role-based access control: authorize("admin"), authorize("admin", "lecturer")...
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, `Role '${req.user?.role}' is not authorized to access this resource`);
    }
    next();
  };
};
