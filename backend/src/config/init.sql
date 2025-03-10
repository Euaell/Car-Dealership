-- Drop tables if they exist (in reverse order of creation to handle foreign key constraints)
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS test_drives;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS spare_parts;
DROP TABLE IF EXISTS cars;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

-- Create roles table
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  permissions JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  roleId INT NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  lastLogin DATETIME,
  resetToken VARCHAR(255),
  resetTokenExpiry DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME,
  FOREIGN KEY (roleId) REFERENCES roles(id)
);

-- Create cars table
CREATE TABLE cars (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vin VARCHAR(17) NOT NULL UNIQUE,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  year INT NOT NULL,
  type ENUM('NEW', 'USED') NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  mileage INT,
  color VARCHAR(30),
  transmission ENUM('AUTOMATIC', 'MANUAL', 'CVT', 'SEMI-AUTOMATIC', 'DUAL-CLUTCH'),
  fuelType ENUM('GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'PLUG-IN HYBRID'),
  engineSize VARCHAR(20),
  description TEXT,
  features JSON,
  images JSON,
  status ENUM('AVAILABLE', 'SOLD', 'RESERVED', 'MAINTENANCE') DEFAULT 'AVAILABLE',
  isFeatured BOOLEAN DEFAULT FALSE,
  exteriorCondition ENUM('EXCELLENT', 'GOOD', 'FAIR', 'POOR'),
  interiorCondition ENUM('EXCELLENT', 'GOOD', 'FAIR', 'POOR'),
  previousOwners INT DEFAULT 0,
  serviceHistory BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME,
  INDEX idx_make_model (make, model),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_price (price),
  INDEX idx_year (year)
);

-- Create spare parts table
CREATE TABLE spare_parts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  partNumber VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  category VARCHAR(50) NOT NULL,
  compatibility JSON,
  manufacturer VARCHAR(50),
  weight FLOAT,
  dimensions VARCHAR(50),
  images JSON,
  isOriginal BOOLEAN DEFAULT TRUE,
  minStockLevel INT DEFAULT 5,
  location VARCHAR(50),
  warrantyPeriod INT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME,
  INDEX idx_name (name),
  INDEX idx_partNumber (partNumber),
  INDEX idx_category (category),
  INDEX idx_price (price),
  INDEX idx_stock (stock)
);

-- Create orders table
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  orderNumber VARCHAR(50) NOT NULL UNIQUE,
  carId INT,
  totalAmount DECIMAL(10, 2) NOT NULL,
  status ENUM('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED') DEFAULT 'PENDING',
  paymentStatus ENUM('UNPAID', 'PARTIAL', 'PAID', 'REFUNDED') DEFAULT 'UNPAID',
  paymentMethod VARCHAR(50),
  shippingAddress TEXT,
  billingAddress TEXT,
  shippingMethod VARCHAR(50),
  trackingNumber VARCHAR(50),
  notes TEXT,
  discountAmount DECIMAL(10, 2) DEFAULT 0,
  taxAmount DECIMAL(10, 2) DEFAULT 0,
  shippingCost DECIMAL(10, 2) DEFAULT 0,
  estimatedDeliveryDate DATETIME,
  actualDeliveryDate DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (carId) REFERENCES cars(id),
  INDEX idx_userId (userId),
  INDEX idx_orderNumber (orderNumber),
  INDEX idx_status (status),
  INDEX idx_paymentStatus (paymentStatus),
  INDEX idx_createdAt (createdAt)
);

-- Create order items table
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderId INT NOT NULL,
  sparePartId INT,
  quantity INT NOT NULL DEFAULT 1,
  unitPrice DECIMAL(10, 2) NOT NULL,
  totalPrice DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (orderId) REFERENCES orders(id),
  FOREIGN KEY (sparePartId) REFERENCES spare_parts(id),
  INDEX idx_orderId (orderId),
  INDEX idx_sparePartId (sparePartId)
);

-- Create test drives table
CREATE TABLE test_drives (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  carId INT NOT NULL,
  scheduledDate DATETIME NOT NULL,
  duration INT NOT NULL DEFAULT 30,
  status ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW') DEFAULT 'SCHEDULED',
  notes TEXT,
  salesPersonId INT,
  feedback TEXT,
  rating INT,
  followUpDate DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (carId) REFERENCES cars(id),
  FOREIGN KEY (salesPersonId) REFERENCES users(id),
  INDEX idx_userId (userId),
  INDEX idx_carId (carId),
  INDEX idx_scheduledDate (scheduledDate),
  INDEX idx_status (status),
  INDEX idx_salesPersonId (salesPersonId)
);

-- Create services table
CREATE TABLE services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  carId INT NOT NULL,
  serviceType ENUM('MAINTENANCE', 'REPAIR', 'INSPECTION', 'WARRANTY', 'RECALL') NOT NULL,
  description TEXT NOT NULL,
  scheduledDate DATETIME NOT NULL,
  completedDate DATETIME,
  status ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'SCHEDULED',
  cost DECIMAL(10, 2),
  technicianId INT,
  notes TEXT,
  partsUsed JSON,
  mileage INT,
  estimatedDuration INT,
  actualDuration INT,
  customerFeedback TEXT,
  customerRating INT,
  invoiceNumber VARCHAR(50) UNIQUE,
  paymentStatus ENUM('UNPAID', 'PARTIAL', 'PAID') DEFAULT 'UNPAID',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (carId) REFERENCES cars(id),
  FOREIGN KEY (technicianId) REFERENCES users(id),
  INDEX idx_userId (userId),
  INDEX idx_carId (carId),
  INDEX idx_serviceType (serviceType),
  INDEX idx_scheduledDate (scheduledDate),
  INDEX idx_status (status),
  INDEX idx_technicianId (technicianId),
  INDEX idx_invoiceNumber (invoiceNumber)
);

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
('ADMIN', 'Administrator with full access', '{"users":["create","read","update","delete"],"cars":["create","read","update","delete"],"spareParts":["create","read","update","delete"],"orders":["create","read","update","delete"],"services":["create","read","update","delete"],"reports":["read"],"dashboard":["read"]}'),
('STAFF', 'Staff with limited access', '{"users":["read"],"cars":["read","update"],"spareParts":["read","update"],"orders":["read","update"],"services":["create","read","update"],"reports":["read"],"dashboard":["read"]}'),
('CUSTOMER', 'Regular customer', '{"cars":["read"],"spareParts":["read"],"orders":["create","read"],"services":["create","read"],"dashboard":["read"]}'),
('SALESPERSON', 'Sales representative', '{"users":["read"],"cars":["read","update"],"spareParts":["read"],"orders":["create","read","update"],"services":["read"],"reports":["read"],"dashboard":["read"]}');

-- Insert admin user (password: admin123)
INSERT INTO users (name, email, password, roleId, phone, address, isActive) VALUES
('Admin User', 'admin@cardealership.com', '$2b$10$3euPcmQFCiblsZeEu5s7p.9MUZWg1IkU5Bo1fdIgDye9ZYxuQF64q', 1, '+1234567890', '123 Admin St, City', TRUE);

-- Insert demo cars
INSERT INTO cars (vin, make, model, year, type, price, mileage, color, transmission, fuelType, engineSize, description, features, images, status, isFeatured) VALUES
('1HGCM82633A123456', 'Honda', 'Accord', 2022, 'NEW', 32000.00, 0, 'Silver', 'AUTOMATIC', 'GASOLINE', '2.0L', 'Brand new Honda Accord with all features', '["Leather Seats", "Sunroof", "Navigation", "Bluetooth", "Backup Camera"]', '["accord1.jpg", "accord2.jpg", "accord3.jpg"]', 'AVAILABLE', TRUE),
('5YJSA1E47MF123456', 'Tesla', 'Model 3', 2023, 'NEW', 45000.00, 0, 'Red', 'AUTOMATIC', 'ELECTRIC', 'Dual Motor', 'Tesla Model 3 Long Range', '["Autopilot", "Premium Interior", "Heated Seats", "Glass Roof"]', '["tesla1.jpg", "tesla2.jpg"]', 'AVAILABLE', TRUE),
('1C4RJFAG2MC123456', 'Jeep', 'Grand Cherokee', 2020, 'USED', 35000.00, 25000, 'Black', 'AUTOMATIC', 'GASOLINE', '3.6L V6', 'Well-maintained Jeep Grand Cherokee', '["4WD", "Leather Seats", "Tow Package", "Bluetooth"]', '["jeep1.jpg", "jeep2.jpg"]', 'AVAILABLE', FALSE),
('WAUYGAFC9CN123456', 'Audi', 'A4', 2021, 'USED', 38000.00, 15000, 'White', 'AUTOMATIC', 'GASOLINE', '2.0L', 'Audi A4 in excellent condition', '["Leather Seats", "Navigation", "Premium Sound", "Sunroof"]', '["audi1.jpg", "audi2.jpg"]', 'AVAILABLE', TRUE);

-- Insert demo spare parts
INSERT INTO spare_parts (name, partNumber, description, price, stock, category, compatibility, manufacturer, isOriginal) VALUES
('Oil Filter', 'OF-12345', 'High-quality oil filter for various models', 15.99, 50, 'Filters', '["Honda", "Toyota", "Nissan"]', 'Bosch', TRUE),
('Brake Pad Set', 'BP-67890', 'Front brake pad set', 89.99, 30, 'Brakes', '["Honda Accord", "Honda Civic", "Toyota Camry"]', 'Brembo', TRUE),
('Air Filter', 'AF-54321', 'Engine air filter', 24.99, 40, 'Filters', '["Honda", "Toyota", "Ford", "Chevrolet"]', 'K&N', FALSE),
('Spark Plug Set', 'SP-98765', 'Set of 4 spark plugs', 45.99, 25, 'Ignition', '["Honda Accord", "Honda Civic", "Toyota Corolla"]', 'NGK', TRUE); 