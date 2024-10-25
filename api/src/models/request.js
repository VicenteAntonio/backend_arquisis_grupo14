'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Request extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Request.init({
    request_id: DataTypes.UUID,
    group_id: DataTypes.STRING,
    fixture_id: DataTypes.INTEGER,
    league_name: DataTypes.STRING,
    round: DataTypes.STRING,
    date: DataTypes.DATE,
    result: DataTypes.STRING,
    deposit_token: DataTypes.STRING,
    user_token: DataTypes.STRING,
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
  });
  return Request;
};