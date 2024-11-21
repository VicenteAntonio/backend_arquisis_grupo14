'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Users', [
      {
        username: 'admin@uc.cl',
        email: 'admin@uc.cl',
        user_token: '673f8f681f3f67a1b4c8ede2',
        wallet: 0,
        requests: JSON.stringify([]),
        admin: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
  }
};