import bcrypt from "bcrypt";
import User from "../models/User.js";
import { createToken } from "../utils/index.js";

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

  if (!user)
    return res.status(401).json({ message: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password);

  if (!match)
    return res.status(401).json({ message: "Invalid credentials" });

  const token = createToken(user._id);

  res.cookie("session", token, cookieOptions);

  res.json({
    id: user._id,
    username: user.username,
    email: user.email
  });
};

export const logout = (req, res) => {
  res.clearCookie("session");
  res.json({ message: "Logged out" });
};

export const getMe = (req,res) =>{
  try {
    const user = req.user;
    return res.status(200).json(user);
  } catch (error) {
    console.log("error",error);
    return res.status(500).json({message:"internal server error"})
    
  }
}