'use strict';

module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define('OrderItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    sparePartId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'spare_parts',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    notes: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'order_items',
    timestamps: true,
    hooks: {
      beforeValidate: (orderItem) => {
        // Calculate total price if not provided
        if (orderItem.unitPrice && orderItem.quantity) {
          orderItem.totalPrice = (parseFloat(orderItem.unitPrice) * orderItem.quantity) - parseFloat(orderItem.discount || 0);
        }
      }
    },
    indexes: [
      {
        fields: ['orderId']
      },
      {
        fields: ['sparePartId']
      }
    ]
  });

  OrderItem.associate = (models) => {
    OrderItem.belongsTo(models.Order, { foreignKey: 'orderId', as: 'order' });
    OrderItem.belongsTo(models.SparePart, { foreignKey: 'sparePartId', as: 'sparePart' });
  };

  return OrderItem;
}; 