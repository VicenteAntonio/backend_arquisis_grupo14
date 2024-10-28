const {
    Model,
  } = require('sequelize');
  
  module.exports = (sequelize, DataTypes) => {
    class Recommendation extends Model {
      /**
       * Helper method for defining associations.
       * This method is not a part of Sequelize lifecycle.
       * The `models/index` file will call this method automatically.
       */
      static associate(models) {
        // define association here
        this.belongsTo(models.Fixture, {
          foreignKey: 'fixtureId',
          as: 'fixture',
        });
      }
    }
    Recommendation.init({
      username: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fixtureId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    }, {
      sequelize,
      modelName: 'Recommendation',
    });
    return Recommendation;
  };