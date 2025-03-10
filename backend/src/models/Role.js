'use strict';

module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.STRING
    },
    permissions: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  }, {
    tableName: 'roles',
    timestamps: true
  });

  Role.associate = (models) => {
    Role.hasMany(models.User, { foreignKey: 'roleId', as: 'users' });
  };

  // Define role constants
  Role.ADMIN = 'ADMIN';
  Role.STAFF = 'STAFF';
  Role.CUSTOMER = 'CUSTOMER';
  Role.SALESPERSON = 'SALESPERSON';

  // Helper to seed default roles
  Role.seedDefaultRoles = async () => {
    try {
      const roles = [
        { 
          name: Role.ADMIN, 
          description: 'Administrator with full access',
          permissions: {
            users: ['create', 'read', 'update', 'delete'],
            cars: ['create', 'read', 'update', 'delete'],
            spareParts: ['create', 'read', 'update', 'delete'],
            orders: ['create', 'read', 'update', 'delete'],
            services: ['create', 'read', 'update', 'delete'],
            reports: ['read'],
            dashboard: ['read']
          }
        },
        { 
          name: Role.STAFF, 
          description: 'Staff with limited access',
          permissions: {
            users: ['read'],
            cars: ['read', 'update'],
            spareParts: ['read', 'update'],
            orders: ['read', 'update'],
            services: ['create', 'read', 'update'],
            reports: ['read'],
            dashboard: ['read']
          }
        },
        { 
          name: Role.CUSTOMER, 
          description: 'Regular customer',
          permissions: {
            cars: ['read'],
            spareParts: ['read'],
            orders: ['create', 'read'],
            services: ['create', 'read'],
            dashboard: ['read']
          }
        },
        { 
          name: Role.SALESPERSON, 
          description: 'Sales representative',
          permissions: {
            users: ['read'],
            cars: ['read', 'update'],
            spareParts: ['read'],
            orders: ['create', 'read', 'update'],
            services: ['read'],
            reports: ['read'],
            dashboard: ['read']
          }
        }
      ];

      for (const role of roles) {
        await Role.findOrCreate({
          where: { name: role.name },
          defaults: role
        });
      }
      console.log('Default roles seeded successfully');
    } catch (error) {
      console.error('Error seeding default roles:', error);
    }
  };

  return Role;
}; 