import express from "express";
import { Image } from "../models/images.js";
import { Comment } from "../models/comments.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { isAuthenticated, isImageOwner } from "../middleware/auth.js";
import { User } from "../models/users.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadDir = path.join(dirname(__dirname), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

export const router = express.Router();

function validateQueryParams(req, res, next) {
  const { offset, limit, userId } = req.query;
  if (offset && isNaN(parseInt(offset))) {
    return res.status(422).json({ error: "Invalid offset parameter" });
  }
  if (limit && isNaN(parseInt(limit))) {
    return res.status(422).json({ error: "Invalid limit parameter" });
  }
  if (userId && isNaN(parseInt(userId)) && userId !== "all") {
    return res.status(422).json({ error: "Invalid userId parameter" });
  }
  next();
}

function validateImageParams(req, res, next) {
  const { title } = req.body;
  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(422).json({ error: "Invalid title" });
  }
  if (!req.file) {
    return res.status(422).json({ error: "Image file is required" });
  }
  next();
}

router.post(
  "/",
  isAuthenticated,
  upload.single("image"),
  validateImageParams,
  async (req, res) => {
    const { title } = req.body;
    const file = req.file;

    if (!title || !file) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const userId = req.session.userId;
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const image = await Image.create({
        title,
        author: user.username,
        url: `/uploads/${file.filename}`,
        date: new Date(),
        UserId: userId,
      });

      res.status(201).json(image);
    } catch (err) {
      res.status(500).json({ error: "Failed to create image" });
    }
  },
);

router.get("/", validateQueryParams, async (req, res) => {
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 1000;
  const userId = req.query.userId;

  try {
    const query = {
      offset,
      limit,
      order: [["date", "DESC"]],
      include: [{ model: User, attributes: ["username", "id"] }],
    };

    if (userId && userId !== "all") {
      query.where = { UserId: userId };
    }

    const images = await Image.findAll(query);

    res.json(images);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch images", details: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const image = await Image.findByPk(req.params.id, {
      include: [{ model: User, attributes: ["username"] }],
    });

    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.json(image);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch image" });
  }
});

router.delete("/:id", isAuthenticated, isImageOwner, async (req, res) => {
  try {
    const image = await Image.findByPk(req.params.id);

    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    await Comment.destroy({ where: { ImageId: image.id } });

    await image.destroy();

    try {
      const filePath = path.join(uploadDir, path.basename(image.url));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {}

    res.json({ message: "Image deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete image" });
  }
});
