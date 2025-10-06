# Growcify Admin Backend

A Node.js backend API for the Growcify Admin Dashboard with authentication system.

## Features

- User Authentication (Login/Register)
- JWT Token-based Authentication
- Password Hashing with bcrypt
- MongoDB Database Integration
- Express.js Framework
- CORS Support
- Error Handling Middleware
- **Swagger API Documentation**
- JSDoc Comments for all endpoints

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/priyakashinagar/growcify-admin-backend.git
cd growcify-admin-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/growcify-admin
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:3000
```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### API Documentation
After starting the server, visit:
- **Swagger UI**: http://localhost:5000/api-docs
- **JSON Spec**: http://localhost:5000/api-docs.json

The interactive Swagger documentation provides:
- Complete API endpoint documentation
- Request/response schemas
- Try-it-out functionality
- Authentication testing with JWT tokens

## API Endpoints

### Authentication Routes

#### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "role": "user",
      "lastLogin": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "role": "user"
}
```

#### GET /api/auth/profile
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer jwt-token-here
```

#### POST /api/auth/change-password
Change user password (requires authentication).

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

#### POST /api/auth/logout
Logout user (requires authentication).

### Other Routes

#### GET /api/health
Health check endpoint.

#### GET /api/
API welcome message.

## Database Schema

### User Model
```javascript
{
  email: String (required, unique),
  password: String (required, hashed),
  name: String (required),
  role: String (enum: ['admin', 'user'], default: 'user'),
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Frontend Integration

For your React frontend, you can use the login endpoint like this:

```javascript
const handleLogin = async (email, password) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      // Store token in localStorage or secure storage
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      
      // Redirect to dashboard or update app state
      onLogin();
    } else {
      // Handle error
      console.error('Login failed:', data.message);
    }
  } catch (error) {
    console.error('Login error:', error);
  }
};
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error message here"
}
```

## Security Features

- Password hashing with bcrypt (salt rounds: 12)
- JWT token authentication
- Input validation
- CORS protection
- Error handling without sensitive information exposure

## License

ISC