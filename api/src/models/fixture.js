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
    homeTeamWinner: DataTypes.BOOLEAN,
    awayTeamId: DataTypes.INTEGER,
    awayTeamName: DataTypes.STRING,
    awayTeamLogo: DataTypes.STRING,
    awayTeamWinner: DataTypes.BOOLEAN,
    goalsHome: DataTypes.INTEGER,
    goalsAway: DataTypes.INTEGER,
    leagueId: DataTypes.INTEGER,
    leagueName: DataTypes.STRING,
    leagueCountry: DataTypes.STRING,
    leagueLogo: DataTypes.STRING,
    leagueFlag: DataTypes.STRING,
    leagueSeason: DataTypes.STRING,
    leagueRound: DataTypes.STRING,
    fixtureId: DataTypes.INTEGER,
    fixtureReferee: DataTypes.STRING,
    fixtureDate: DataTypes.DATE,
    fixtureTimezone: DataTypes.STRING,
    fixtureTimestamp: DataTypes.BIGINT,
    fixtureStatus: DataTypes.JSON,
    result: DataTypes.STRING,
    oddsId: DataTypes.INTEGER,
    oddsName: DataTypes.STRING,
    oddsHome: DataTypes.DECIMAL(10, 2),
    oddsDraw: DataTypes.DECIMAL(10, 2),
    oddsAway: DataTypes.DECIMAL(10, 2),
    bonusQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 40,
    },
  }, {
    sequelize,
    modelName: 'Fixture',
  });
  return Fixture;
};