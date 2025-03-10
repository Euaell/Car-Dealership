# Car Dealership Management System

A comprehensive management system for car dealerships, featuring inventory management, sales tracking, customer management, service scheduling, and spare parts inventory.

## Features

- **User Management**: Role-based access control with different permissions for administrators, staff, and customers
- **Car Inventory**: Manage new and used cars with detailed specifications, images, and pricing
- **Spare Parts Inventory**: Track spare parts with stock levels, pricing, and compatibility information
- **Sales Management**: Process sales transactions, generate invoices, and track commissions
- **Service Department**: Schedule and manage service appointments, track repairs, and maintenance
- **Customer Management**: Maintain customer records, purchase history, and preferences
- **Dashboard & Reports**: Comprehensive analytics and reporting for business insights
- **Responsive UI**: Modern, mobile-friendly interface for both staff and customers

## Tech Stack

### Backend

- Node.js with Express
- MySQL database with Sequelize ORM
- JWT authentication
- RESTful API design
- Winston for logging

### Frontend

- Next.js (React framework)
- Tailwind CSS for styling
- React Hook Form for form handling
- Recharts for data visualization
- Responsive design with mobile support

## Project Structure

```
car-dealership/
├── backend/                # Backend API server
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Custom middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── index.js        # Application entry point
│   ├── .env                # Environment variables (not in repo)
│   └── package.json        # Backend dependencies
│
├── frontend/               # Next.js frontend
│   ├── app/                # Next.js app directory
│   │   ├── api/            # API routes
│   │   ├── components/     # Reusable components
│   │   ├── dashboard/      # Dashboard pages
│   │   ├── inventory/      # Inventory management pages
│   │   ├── login/          # Authentication pages
│   │   ├── orders/         # Order management pages
│   │   ├── services/       # Service management pages
│   │   ├── users/          # User management pages
│   │   └── page.tsx        # Home page
│   ├── lib/                # Utility functions and hooks
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
│
└── README.md               # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MySQL (v8 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:

   ```
   cd backend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file with the following variables:

   ```
   PORT=3001
   NODE_ENV=development

   # Database
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=your_password
   DB_NAME=car_dealership

   # JWT
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=1d
   ```

4. Start the development server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```
   cd frontend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env.local` file with the following variables:

   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

4. Start the development server:

   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Documentation

The API follows RESTful principles and uses JWT for authentication.

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate a user and get a token
- `POST /api/auth/refresh` - Refresh an authentication token
- `GET /api/auth/me` - Get the current authenticated user

### Car Endpoints

- `GET /api/cars` - Get all cars with filtering and pagination
- `GET /api/cars/:id` - Get a specific car by ID
- `POST /api/cars` - Create a new car (Admin/Staff only)
- `PUT /api/cars/:id` - Update a car (Admin/Staff only)
- `DELETE /api/cars/:id` - Delete a car (Admin only)

### Spare Parts Endpoints

- `GET /api/spare-parts` - Get all spare parts with filtering and pagination
- `GET /api/spare-parts/:id` - Get a specific spare part by ID
- `POST /api/spare-parts` - Create a new spare part (Admin/Staff only)
- `PUT /api/spare-parts/:id` - Update a spare part (Admin/Staff only)
- `DELETE /api/spare-parts/:id` - Delete a spare part (Admin only)
- `POST /api/spare-parts/:id/stock` - Adjust stock levels (Admin/Staff only)

### Order Endpoints

- `GET /api/orders` - Get all orders (Admin/Staff only)
- `GET /api/orders/:id` - Get a specific order
- `POST /api/orders` - Create a new order
- `PUT /api/orders/:id/status` - Update order status (Admin/Staff only)
- `POST /api/orders/:id/cancel` - Cancel an order

### Service Endpoints

- `GET /api/services` - Get all service appointments (Admin/Staff only)
- `GET /api/services/:id` - Get a specific service appointment
- `POST /api/services` - Create a new service appointment
- `PUT /api/services/:id` - Update a service appointment (Admin/Staff only)
- `POST /api/services/:id/cancel` - Cancel a service appointment

### User Endpoints

- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get a specific user
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user (Admin only)
- `GET /api/users/:id/orders` - Get orders for a specific user
- `GET /api/users/:id/services` - Get services for a specific user

### Dashboard Endpoints

- `GET /api/dashboard/summary` - Get summary statistics (Admin/Staff only)
- `GET /api/dashboard/sales` - Get sales data for charts (Admin/Staff only)
- `GET /api/dashboard/inventory` - Get inventory status (Admin/Staff only)
- `GET /api/dashboard/upcoming` - Get upcoming activities (Admin/Staff only)

## License

This project is licensed under the ISC License.
