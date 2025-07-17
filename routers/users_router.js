import { Router } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/users.js";
import { isAuthenticated } from "../middleware/auth.js";

export const router = Router();
const saltRounds = 10;

function validateUserParams(req, res, next) {
  const { username, password } = req.body;
  if (!username || typeof username !== "string" || username.trim() === "") {
    return res.status(422).json({ error: "Invalid username" });
  }
  if (!password || typeof password !== "string" || password.trim() === "") {
    return res.status(422).json({ error: "Invalid password" });
  }
  next();
}

router.post("/signup", validateUserParams, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const user = await User.create({
      username,
      password: hashedPassword,
    });

    req.session.userId = user.id;

    return res.status(201).json({ username: user.username, id: user.id });
  } catch (err) {
    console.error("Error in signup:", err);
    return res.status(500).json({ error: "User creation failed" });
  }
});

router.post("/signin", validateUserParams, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: "Incorrect username or password" });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Incorrect username or password" });
    }

    req.session.userId = user.id;

    return res.json({ username: user.username, id: user.id });
  } catch (err) {
    console.error("Error in signin:", err);
    return res.status(500).json({ error: "Authentication failed" });
  }
});

router.post("/signout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to sign out" });
    }
    res.json({ message: "Signed out successfully" });
  });
});

router.get("/me", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ username: user.username, id: user.id });
  } catch (err) {
    console.error("Error fetching user:", err);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.get("/", async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "username"],
    });

    return res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
});
