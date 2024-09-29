'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Fixtures', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      homeTeamId: {
        type: Sequelize.INTEGER
      },
      homeTeamName: {
        type: Sequelize.STRING
      },
      homeTeamLogo: {
        type: Sequelize.STRING
      },
      homeTeamWinner: {
        type: Sequelize.BOOLEAN
      },
      awayTeamId: {
        type: Sequelize.INTEGER
      },
      awayTeamName: {
        type: Sequelize.STRING
      },
      awayTeamLogo: {
        type: Sequelize.STRING
      },
      awayTeamWinner: {
        type: Sequelize.BOOLEAN
      },
      goalsHome: {
        type: Sequelize.INTEGER
      },
      goalsAway: {
        type: Sequelize.INTEGER
      },
      leagueId: {
        type: Sequelize.INTEGER
      },
      leagueName: {
        type: Sequelize.STRING
      },
      leagueCountry: {
        type: Sequelize.STRING
      },
      leagueLogo: {
        type: Sequelize.STRING
      },
      leagueFlag: {
        type: Sequelize.STRING
      },
      leagueSeason: {
        type: Sequelize.STRING
      },
      leagueRound: {
        type: Sequelize.STRING
      },
      fixtureId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      fixtureReferee: {
        type: Sequelize.STRING,
        allowNull: true
      },
      fixtureDate: {
        type: Sequelize.DATE
      },
      fixtureTimezone: {
        type: Sequelize.STRING
      },
      fixtureTimestamp: {
        type: Sequelize.BIGINT
      },
      fixtureStatus: {
        type: Sequelize.JSON
      },
      result: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Fixtures');
  }
};