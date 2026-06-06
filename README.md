# SideGurus Backend API

A complete authentication system for the SideGurus platform with user management, JWT authentication, OTP verification, and soft delete functionality.

## ✨ Features

### Authentication & Security
- ✅ **User Registration** - Full name, email, password with country/region selection
- ✅ **Login System** - JWT-based authentication
- ✅ **Forgot Password** - OTP-based password reset
- ✅ **OTP Verification** - 5-digit code with 15min expiry
- ✅ **Change Password** - For authenticated users
- ✅ **Password Hashing** - Bcrypt encryption
- ✅ **JWT Tokens** - Secure authentication with 7-day expiry

### User Management
- ✅ **User Profiles** - View and update user information
- ✅ **Role-based Access** - USER and ADMIN roles
- ✅ **Soft Delete** - Users, listings, and support tickets
- ✅ **Profile Images** - Support for user avatars

### Database Features
- ✅ **Soft Delete** - Records stay in database with `deletedAt` timestamp
- ✅ **Automatic Filtering** - Soft-deleted records excluded from queries
- ✅ **Audit Trail** - Track when records were deleted
- ✅ **Restore Capability** - Can restore soft-deleted records

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Update `.env` file with your database connection:
```env
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET="your-secret-key"
```

### 3. Generate Prisma Client
```bash
npm run prisma:generate
```

### 4. Run Database Migrations
```bash
npm run prisma:migrate
```

### 5. Seed Database
```bash
npm run seed
```

### 6. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

Server runs on: `http://localhost:3000`

## 📚 API Endpoints

### Public Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset OTP
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/reset-password` - Reset password with OTP

### Protected Routes (Require JWT Token)
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Health Check
- `GET /health` - Server health status

## 🧪 Test Accounts

### Admin Account
```
Email: admin@sidegurus.com
Password: Admin@123
Role: ADMIN
```

### User Accounts
```
Email: john.doe@example.com | Password: User@123
Email: jane.smith@example.com | Password: User@123
Email: kevin@example.com | Password: User@123
```

## 📖 Detailed Documentation

- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference with request/response examples
- **[POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md)** - Postman collection usage guide

## 📮 Postman Collection

Import `SideGurus_API_Postman_Collection.json` into Postman for easy API testing:
- ✅ Auto-saves authentication tokens
- ✅ Separate folders for Admin and User endpoints
- ✅ Pre-configured test accounts
- ✅ Ready-to-use request examples

See [POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md) for detailed instructions.

## 🗄️ Database Schema

### Models
- **User** - User accounts with authentication
- **Listing** - Service and event listings
- **Category** - Service/event categories
- **SubCategory** - Category subdivisions
- **Country** - Countries supported
- **Region** - Regions within countries
- **Payment** - Payment tracking
- **Subscription** - Listing subscriptions
- **PricingPlan** - Available pricing plans
- **SupportTicket** - Customer support

### Soft Delete Support
- User (`deletedAt`)
- Listing (`deletedAt`)
- SupportTicket (`deletedAt`)

## 🛠️ Tech Stack

- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma 5.x
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** Bcryptjs
- **Environment:** dotenv
- **CORS:** Enabled

## 📁 Project Structure

```
cbreezy_backend_web_safari/
├── src/
│   ├── app.js              # Express app configuration
│   ├── server.js           # Server entry point
│   ├── config/
│   │   └── prisma.js       # Prisma client instance
│   ├── controllers/
│   │   └── auth.controller.js
│   ├── services/
│   │   └── auth.service.js
│   ├── routes/
│   │   └── auth.routes.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   └── errorHandler.js
│   └── utils/
│       ├── jwtUtils.js     # JWT helper functions
│       └── otpStore.js     # OTP storage (in-memory)
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Database migrations
│   └── seed.js            # Database seeder
├── .env                    # Environment variables
└── package.json
```

## 🔒 Security Features

1. **Password Requirements**
   - Minimum 8 characters
   - Hashed using bcrypt (10 rounds)

2. **JWT Tokens**
   - 7-day expiration
   - Includes userId, email, and role
   - Validated on protected routes

3. **OTP System**
   - 5-digit random code
   - 15-minute expiration
   - Logged to console in development

4. **Soft Delete**
   - Data preserved for audit/compliance
   - Automatic filtering in queries
   - Restore capability

## 🎯 Available Scripts

```bash
npm run dev              # Start development server
npm start               # Start production server
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run database migrations
npm run prisma:studio   # Open Prisma Studio (DB GUI)
npm run seed           # Seed database with test data
```

## 🐛 Development Notes

### OTP in Development
OTPs are logged to console for testing:
```
📧 OTP for user@example.com: 12345 (expires in 15 minutes)
```

### Soft Delete Behavior
- Queries automatically exclude `deletedAt IS NOT NULL`
- Use `getAllUsersIncludingDeleted()` for admin views
- Restore with `restoreUser(id)` or `restoreListing(id)`

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret key for JWT signing | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `OTP_EXPIRES_IN_MINUTES` | OTP validity duration | `15` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |

## 🤝 Contributing

1. Make changes in feature branches
2. Test all endpoints thoroughly
3. Update documentation as needed
4. Ensure migrations are tested

## 📧 Support

For issues or questions, create a support ticket or contact the development team.

---

**Built with ❤️ for SideGurus**

*Last updated: March 28, 2026*
