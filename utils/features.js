import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config({ path: "./data/config.env" });

export const sendCookie = (user, res, message, statusCode = 200, data = {}) => {
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

  res
    .status(statusCode)
    .cookie("token", token, {
      httpOnly: true,
       maxAge: 24 * 60 * 60 * 1000, 
      sameSite: process.env.NODE_ENV === "Development" ? "lax" : "none",
      secure: process.env.NODE_ENV === "Development" ? false : true,
    })
    .json({
      success: true,
      message,
      ...data, // Merges additional fields like user info
    });
};
