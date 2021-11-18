'use strict';
const faker = require('faker')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Comments',
      Array.from({ length: 30 }).map((item, index) =>
      ({
        text: item,
        UserId: Math.floor(Math.random() * 3) * 10 + 3,
        RestaurantId: Math.floor(Math.random() * 50) * 10 + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      ), {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Comments', null, {})
  }
};