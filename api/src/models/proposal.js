'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Proposal extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Proposal.init({
    auctionId: DataTypes.INTEGER,
    proposalId: DataTypes.INTEGER,
    fixtureId: DataTypes.INTEGER,
    leagueName: DataTypes.STRING,
    round: DataTypes.STRING,
    result: DataTypes.INTEGER,
    quantity: DataTypes.INTEGER,
    groupId: DataTypes.INTEGER,
    type: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Proposal',
  });
  return Proposal;
};