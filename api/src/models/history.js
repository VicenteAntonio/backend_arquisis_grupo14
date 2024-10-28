'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class History extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  History.init({
    goalsHome: DataTypes.INTEGER,
    goalsAway: DataTypes.INTEGER,
    fixtureId: DataTypes.INTEGER,
    fixtureReferee: DataTypes.STRING,
    fixtureDate: DataTypes.DATE,
    fixtureTimezone: DataTypes.STRING,
    fixtureTimestamp: DataTypes.BIGINT,
    fixtureStatus: DataTypes.JSON
  }, {
    sequelize,
    modelName: 'History',
  });
  return History;
};