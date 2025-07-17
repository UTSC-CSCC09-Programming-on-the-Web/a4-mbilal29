import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { sequelize } from "./datasource.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { Image } from "./models/images.js";
import { Comment } from "./models/comments.js";
import { User } from "./models/users.js";
import session from "express-session";

import { router as imagesRouter } from "./routers/images_router.js";
import { router as commentsRouter } from "./routers/comments_router.js";
import { router as usersRouter } from "./routers/users_router.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

Comment.belongsTo(Image);
Image.hasMany(Comment);

User.hasMany(Image);
Image.belongsTo(User);
User.hasMany(Comment);
Comment.belongsTo(User);

const app = express();
const PORT = 3000;

app.locals.models = { User, Image, Comment };

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "static")));
app.use("/uploads", express.static("uploads"));

app.use(
  session({
    secret: process.env.SECRET_KEY || "default_secret_key",
    resave: false,
    saveUninitialized: true,
  }),
);

try {
  await sequelize.authenticate();
  await sequelize.sync({ alter: { drop: false } });
} catch (error) {}

app.use((req, res, next) => {
  next();
});

app.use("/api/images", imagesRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/users", usersRouter);

app.listen(PORT, (err) => {
});

export { app };
