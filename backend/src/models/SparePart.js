'use strict';

module.exports = (sequelize, DataTypes) => {
  const SparePart = sequelize.define('SparePart', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    partNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    compatibility: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    manufacturer: {
      type: DataTypes.STRING
    },
    weight: {
      type: DataTypes.FLOAT
    },
    dimensions: {
      type: DataTypes.STRING
    },
    images: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    isOriginal: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    minStockLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      validate: {
        min: 0
      }
    },
    location: {
      type: DataTypes.STRING,
      comment: 'Storage location in the warehouse'
    },
    warrantyPeriod: {
      type: DataTypes.INTEGER,
      comment: 'Warranty period in months',
      validate: {
        min: 0
      }
    }
  }, {
    tableName: 'spare_parts',
    timestamps: true,
    paranoid: true, // Soft-delete support
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['partNumber']
      },
      {
        fields: ['category']
      },
      {
        fields: ['price']
      },
      {
        fields: ['stock']
      }
    ]
  });

  SparePart.associate = (models) => {
    SparePart.hasMany(models.OrderItem, { foreignKey: 'sparePartId', as: 'orderItems' });
  };

  return SparePart;
}; 