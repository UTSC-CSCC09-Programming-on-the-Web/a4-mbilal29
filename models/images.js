// images/images.js
import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";

export const Image = sequelize.define("Image", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
});

Image.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());

  if (values.User) {
    values.author = values.User.username;
    delete values.User;
  }

  return values;
};
