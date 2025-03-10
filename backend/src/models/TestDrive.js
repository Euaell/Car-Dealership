'use strict';

module.exports = (sequelize, DataTypes) => {
  const TestDrive = sequelize.define('TestDrive', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    carId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'cars',
        key: 'id'
      }
    },
    scheduledDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        isAfterNow(value) {
          if (new Date(value) < new Date()) {
            throw new Error('Scheduled date must be in the future');
          }
        }
      }
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
      comment: 'Duration in minutes',
      validate: {
        min: 15,
        max: 120
      }
    },
    status: {
      type: DataTypes.ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'),
      defaultValue: 'SCHEDULED'
    },
    notes: {
      type: DataTypes.TEXT
    },
    salesPersonId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'ID of the salesperson assigned to this test drive'
    },
    feedback: {
      type: DataTypes.TEXT,
      comment: 'Customer feedback after the test drive'
    },
    rating: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
        max: 5
      },
      comment: 'Customer rating (1-5) after the test drive'
    },
    followUpDate: {
      type: DataTypes.DATE,
      comment: 'Date for sales follow-up'
    }
  }, {
    tableName: 'test_drives',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['carId']
      },
      {
        fields: ['scheduledDate']
      },
      {
        fields: ['status']
      },
      {
        fields: ['salesPersonId']
      }
    ]
  });

  TestDrive.associate = (models) => {
    TestDrive.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    TestDrive.belongsTo(models.Car, { foreignKey: 'carId', as: 'car' });
    TestDrive.belongsTo(models.User, { foreignKey: 'salesPersonId', as: 'salesPerson' });
  };

  return TestDrive;
};
