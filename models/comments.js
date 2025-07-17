// images/comments.js
import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";

export const Comment = sequelize.define("Comment", {
  author: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
});

Comment.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());

  if (values.User) {
    values.author = values.User.username;
    values.isOwner = false;
    delete values.User;
  }

  return values;
};
