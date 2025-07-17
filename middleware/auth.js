import { Image } from "../models/images.js";
import { Comment } from "../models/comments.js";

export const isAuthenticated = function (req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

export const isImageOwner = async function (req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const imageId = req.params.id;

  try {
    const image = await Image.findByPk(imageId);

    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    if (image.UserId !== req.session.userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to modify this image" });
    }

    next();
  } catch (err) {
    console.error("Error in isImageOwner middleware:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const isCommentOwner = async function (req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const commentId = req.params.id;

  try {
    const comment = await Comment.findByPk(commentId);

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (comment.UserId !== req.session.userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this comment" });
    }

    next();
  } catch (err) {
    console.error("Error in isCommentOwner middleware:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const canDeleteComment = async function (req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const commentId = req.params.id;

  try {
    const comment = await Comment.findByPk(commentId, {
      include: [Image],
    });

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (comment.UserId === req.session.userId) {
      return next();
    }

    if (comment.Image && comment.Image.UserId === req.session.userId) {
      return next();
    }

    return res
      .status(403)
      .json({ error: "Not authorized to delete this comment" });
  } catch (err) {
    console.error("Error in canDeleteComment middleware:", err);
    res.status(500).json({ error: "Server error" });
  }
};
