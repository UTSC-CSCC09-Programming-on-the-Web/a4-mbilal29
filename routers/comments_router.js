import express from "express";
import { Router } from "express";
import { Comment } from "../models/comments.js";
import { Image } from "../models/images.js";
import { User } from "../models/users.js";
import { isAuthenticated, canDeleteComment } from "../middleware/auth.js";

export const router = Router();

function validateQueryParams(req, res, next) {
  const { imageId, page, limit } = req.query;
  if (!imageId || isNaN(parseInt(imageId))) {
    return res.status(422).json({ error: "Invalid imageId parameter" });
  }
  if (page && isNaN(parseInt(page))) {
    return res.status(422).json({ error: "Invalid page parameter" });
  }
  if (limit && isNaN(parseInt(limit))) {
    return res.status(422).json({ error: "Invalid limit parameter" });
  }
  next();
}

function validateCommentParams(req, res, next) {
  const { content, imageId } = req.body;
  if (!content || typeof content !== "string" || content.trim() === "") {
    return res.status(422).json({ error: "Invalid content" });
  }
  if (!imageId || isNaN(parseInt(imageId))) {
    return res.status(422).json({ error: "Invalid imageId" });
  }
  next();
}

router.get("/", isAuthenticated, validateQueryParams, async (req, res) => {
  const imageId = req.query.imageId;
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 10;
  const offset = page * limit;

  if (!imageId) {
    return res
      .status(400)
      .json({ error: "imageId query param required", comments: [] });
  }

  try {
    // Check if the image exists
    const image = await Image.findByPk(imageId);
    if (!image) {
      return res.json({ comments: [] });
    }

    // Get comments for the image
    const comments = await Comment.findAll({
      where: { ImageId: imageId },
      order: [["date", "DESC"]],
      offset,
      limit,
      include: [{ model: User, attributes: ["username", "id"] }],
    });

    const mappedComments = comments.map((comment) => {
      const commentJson = comment.toJSON();

      const isCommentOwner = comment.UserId === req.session.userId;
      const isGalleryOwner = image.UserId === req.session.userId;

      commentJson.canDelete = isCommentOwner || isGalleryOwner;

      return commentJson;
    });

    return res.json({ comments: mappedComments });
  } catch (err) {
    console.error("Error fetching comments:", err);
    return res
      .status(500)
      .json({ error: "Failed to fetch comments", comments: [] });
  }
});

router.post("/", isAuthenticated, validateCommentParams, async (req, res) => {
  const { content, imageId } = req.body;

  if (!content || !imageId) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const image = await Image.findByPk(imageId);
    if (!image) return res.status(404).json({ error: "Image not found" });

    const user = await User.findByPk(req.session.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const comment = await Comment.create({
      author: user.username,
      content,
      date: new Date(),
      ImageId: imageId,
      UserId: req.session.userId,
    });

    res.status(201).json(comment);
  } catch (err) {
    console.error("Error creating comment:", err);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

router.delete("/:id", isAuthenticated, canDeleteComment, async (req, res) => {
  const { id } = req.params;

  try {
    const comment = await Comment.findByPk(id);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    await comment.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});
