'use strict';
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
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
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Roles',
        key: 'id'
      }
    },
    phone: {
      type: DataTypes.STRING,
      validate: {
        is: /^[0-9\+\-\(\)]+$/
      }
    },
    address: {
      type: DataTypes.STRING
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastLogin: {
      type: DataTypes.DATE
    },
    resetToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetTokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    paranoid: true, // Soft-delete support
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });

  User.associate = (models) => {
    User.belongsTo(models.Role, { foreignKey: 'roleId', as: 'role' });
    User.hasMany(models.Order, { foreignKey: 'userId', as: 'orders' });
    User.hasMany(models.Service, { foreignKey: 'userId', as: 'services' });
    User.hasMany(models.TestDrive, { foreignKey: 'userId', as: 'testDrives' });
  };

  // Instance method to check password
  User.prototype.checkPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  };

  // Instance method to generate JWT payload
  User.prototype.toJWTPayload = function () {
    return {
      id: this.id,
      email: this.email,
      roleId: this.roleId
    };
  };

  return User;
}; 