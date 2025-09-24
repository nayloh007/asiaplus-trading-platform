# Asia Plus Securities Trading Platform

A modern trading platform built with React, TypeScript, and Node.js.

## Features

- Real-time trading interface
- User authentication and management
- Portfolio tracking
- Transaction history
- Bank account integration
- Responsive design

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket connections

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/asiaplus2-trading.git
cd asiaplus2-trading
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your actual database credentials
```

4. Run database migrations:
```bash
npm run db:migrate
```

5. Start the development server:
```bash
npm run dev
```

## Environment Variables

Create a `.env` file based on `.env.example`:

- `DATABASE_URL`: PostgreSQL connection string
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`: Database connection details
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 3000)

## Security

- All sensitive data is stored in environment variables
- Database credentials are never committed to version control
- API endpoints are protected with authentication
- Input validation and sanitization implemented

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software of Asia Plus Securities.

## Support

For technical support, please contact the development team.