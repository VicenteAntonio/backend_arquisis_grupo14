'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Fixture extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Fixture.init({
    homeTeamId: DataTypes.INTEGER,
    homeTeamName: DataTypes.STRING,
    homeTeamLogo: DataTypes.STRING,
    homeTeamWinner: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    awayTeamId: DataTypes.INTEGER,
    awayTeamName: DataTypes.STRING,
    awayTeamLogo: DataTypes.STRING,
    awayTeamWinner: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    goalsHome: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    goalsAway: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    leagueId: DataTypes.INTEGER,
    leagueName: DataTypes.STRING,
    leagueCountry: DataTypes.STRING,
    leagueLogo: DataTypes.STRING,
    leagueFlag: DataTypes.STRING,
    leagueSeason: DataTypes.STRING,
    leagueRound: DataTypes.STRING,
    fixtureId: DataTypes.INTEGER,
    fixtureReferee: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fixtureDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fixtureTimezone: DataTypes.STRING,
    fixtureTimestamp: DataTypes.BIGINT,
    fixtureStatus: DataTypes.JSON, 
    result: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Fixture',
  });
  return Fixture;
};