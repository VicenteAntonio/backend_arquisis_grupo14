'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Requests', 'wallet', {
      type: Sequelize.BOOLEAN,
      allowNull: true, // Permitir nulos, o puedes cambiar a false si es obligatorio
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Requests', 'wallet');
  }
  
};