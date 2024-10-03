'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Fixtures', 'bonusQuantity', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 40 // Establece el valor por defecto aquí
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Fixtures', 'bonusQuantity', {
      type: Sequelize.INTEGER,
      allowNull: false,
      // Si deseas revertir la migración, puedes omitir el defaultValue o establecerlo a null
    });
  }
};
