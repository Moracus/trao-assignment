import bcrypt from "bcrypt";
import User from "../models/User.js";
import { createToken } from "../utils/index.js";

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 1000 * 60 * 60 * 24 * 7,
  path: "/",
};

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  const exists = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (exists) return res.status(409).json({ message: "User exists" });

  const salt = await bcrypt.genSalt(10);

  const hashed = await bcrypt.hash(password, salt);

  const user = await User.create({
    username,
    email,
    password: hashed,
  });

  const token = createToken(user._id);

  res.cookie("session", token, cookieOptions);

  res.status(201).json({
    id: user._id,
    username: user.username,
    email: user.email,
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password);

  if (!match) return res.status(401).json({ message: "Invalid credentials" });

  const token = createToken(user._id);

  res.cookie("session", token, cookieOptions);

  return res.status(200).json({
    username: user.username,
    email: user.email,
  });
};

export const logout = (req, res) => {
  res.clearCookie("session");
  res.json({ message: "Logged out" });
};

export const getMe = (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json(user);
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({ message: "internal server error" });
  }
};

export const checkUsername = async (req, res) => {
  try {
    const { username } = req.query;
    const user = await User.find({ username: username });
    if (!user.length) {
      return res.status(200).json({ isAvailable: true });
    }
    return res.status(200).json({ isAvailable: false });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({ message: "internal server error" });
  }
};
