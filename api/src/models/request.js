'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Request extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Request.belongsTo(models.User, {
        foreignKey: 'user_id',
        targetKey: 'id',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
    }
  }
  Request.init({
    request_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    group_id: DataTypes.STRING,
    fixture_id: DataTypes.INTEGER,
    league_name: DataTypes.STRING,
    round: DataTypes.STRING,
    date: DataTypes.DATE,
    result: DataTypes.STRING,
    deposit_token: DataTypes.STRING,
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_token: DataTypes.STRING,
    wallet: DataTypes.BOOLEAN,
    reviewed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    datetime: DataTypes.STRING,
    quantity: DataTypes.INTEGER,
    seller: DataTypes.INTEGER,
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
    },
  }, {
    sequelize,
    modelName: 'Request',
  }
);
  return Request;
};
