'use strict';

module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
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
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    carId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'cars',
        key: 'id'
      },
      comment: 'Only applicable for car orders, null for spare parts orders'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'),
      defaultValue: 'PENDING'
    },
    paymentStatus: {
      type: DataTypes.ENUM('UNPAID', 'PARTIAL', 'PAID', 'REFUNDED'),
      defaultValue: 'UNPAID'
    },
    paymentMethod: {
      type: DataTypes.STRING
    },
    shippingAddress: {
      type: DataTypes.TEXT
    },
    billingAddress: {
      type: DataTypes.TEXT
    },
    shippingMethod: {
      type: DataTypes.STRING
    },
    trackingNumber: {
      type: DataTypes.STRING
    },
    notes: {
      type: DataTypes.TEXT
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    shippingCost: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    estimatedDeliveryDate: {
      type: DataTypes.DATE
    },
    actualDeliveryDate: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'orders',
    timestamps: true,
    paranoid: true,
    hooks: {
      beforeCreate: (order) => {
        // Generate unique order number if not provided
        if (!order.orderNumber) {
          const prefix = 'ORD';
          const timestamp = Date.now().toString().slice(-8);
          const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          order.orderNumber = `${prefix}-${timestamp}-${random}`;
        }
      }
    },
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['orderNumber']
      },
      {
        fields: ['status']
      },
      {
        fields: ['paymentStatus']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  Order.associate = (models) => {
    Order.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Order.belongsTo(models.Car, { foreignKey: 'carId', as: 'car' });
    Order.hasMany(models.OrderItem, { foreignKey: 'orderId', as: 'items' });
  };

  return Order;
}; 