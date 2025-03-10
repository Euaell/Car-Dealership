'use strict';

module.exports = (sequelize, DataTypes) => {
  const Car = sequelize.define('Car', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    vin: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [17, 17] // VIN is always 17 characters
      }
    },
    make: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1900,
        max: new Date().getFullYear() + 1 // Allow for next year models
      }
    },
    type: {
      type: DataTypes.ENUM('NEW', 'USED'),
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    mileage: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0
      }
    },
    color: {
      type: DataTypes.STRING
    },
    transmission: {
      type: DataTypes.ENUM('AUTOMATIC', 'MANUAL', 'CVT', 'SEMI-AUTOMATIC', 'DUAL-CLUTCH')
    },
    fuelType: {
      type: DataTypes.ENUM('GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'PLUG-IN HYBRID')
    },
    engineSize: {
      type: DataTypes.STRING
    },
    description: {
      type: DataTypes.TEXT
    },
    features: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    images: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('AVAILABLE', 'SOLD', 'RESERVED', 'MAINTENANCE'),
      defaultValue: 'AVAILABLE'
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    exteriorCondition: {
      type: DataTypes.ENUM('EXCELLENT', 'GOOD', 'FAIR', 'POOR'),
      allowNull: true
    },
    interiorCondition: {
      type: DataTypes.ENUM('EXCELLENT', 'GOOD', 'FAIR', 'POOR'),
      allowNull: true
    },
    previousOwners: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    serviceHistory: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'cars',
    timestamps: true,
    paranoid: true, // Soft-delete support
    indexes: [
      {
        fields: ['make', 'model']
      },
      {
        fields: ['type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['price']
      },
      {
        fields: ['year']
      }
    ]
  });

  Car.associate = (models) => {
    Car.hasMany(models.TestDrive, { foreignKey: 'carId', as: 'testDrives' });
    Car.hasMany(models.Order, { foreignKey: 'carId', as: 'orders' });
    Car.hasMany(models.Service, { foreignKey: 'carId', as: 'services' });
  };

  return Car;
}; 