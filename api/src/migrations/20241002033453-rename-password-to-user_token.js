'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('Users', 'password', 'user_token');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('Users', 'user_token', 'password');
  },
};
