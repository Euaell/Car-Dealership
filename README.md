# Car Dealership Management System

A modern, full-stack application for managing a car dealership business. This system includes features for inventory management, customer management, sales processing, service scheduling, and more.

## Features

- **User Management**

  - Role-based access control (Admin, Staff, Customer, Salesperson)
  - Secure authentication with JWT
  - User profiles and preferences

- **Inventory Management**

  - New and used car listings
  - Spare parts inventory
  - Advanced search and filtering
  - 360° view and virtual showroom

- **Sales Process**

  - Test drive scheduling
  - Digital documentation
  - Financing calculator
  - Trade-in value estimator
  - Payment processing

- **After-sales Service**

  - Service scheduling
  - Maintenance reminders
  - Service history tracking
  - Parts ordering

- **Analytics and Reporting**
  - Sales dashboard
  - Inventory reports
  - Customer analytics
  - Performance metrics

## Tech Stack

### Backend

- Node.js with Express
- MySQL database with Sequelize ORM
- Redis for caching and session management
- JWT for authentication
- Winston for logging

### Frontend

- Next.js with React
- Tailwind CSS for styling
- Zustand for state management
- SWR for data fetching
- Chart.js for analytics

### DevOps

- Docker and Docker Compose for containerization
- Environment-based configuration

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (v18+)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/car-dealership.git
   cd car-dealership
   ```

2. Start the development environment:

   ```bash
   docker-compose up
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/api-docs

### Default Credentials

- Admin:
  - Email: admin@cardealership.com
  - Password: admin123

## Project Structure

```
car-dealership/
├── backend/                # Node.js API
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── index.js        # Entry point
│   ├── .env                # Environment variables
│   └── package.json        # Dependencies
├── frontend/               # Next.js application
│   ├── app/                # Next.js app directory
│   ├── components/         # React components
│   ├── lib/                # Utility functions
│   ├── public/             # Static assets
│   └── package.json        # Dependencies
├── docker-compose.yml      # Docker configuration
└── README.md               # Project documentation
```

## API Documentation

The API documentation is available at http://localhost:3001/api-docs when the server is running.

## Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Express.js](https://expressjs.com/)
- [Next.js](https://nextjs.org/)
- [Sequelize](https://sequelize.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Docker](https://www.docker.com/)
