# Skill Swap Platform - Installation & Setup Guide

## 🚀 Quick Start

This guide will help you set up the complete Skill Swap Platform on your local machine.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download here](https://www.mongodb.com/try/download/community)
- **Git** - [Download here](https://git-scm.com/)

## 🛠️ Installation Steps

### 1. Clone and Navigate to Project
```bash
cd "c:\Users\arvin\Downloads\Odoo PB"
```

### 2. Install Backend Dependencies
```bash
npm install
```

### 3. Install Frontend Dependencies
```bash
npm run install-client
```

### 4. Environment Setup

The `.env` file is already created with default values. Update the following variables as needed:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/skill-swap-platform

# JWT Secret (Change this in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Port
PORT=5000

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 5. Start MongoDB

Make sure MongoDB is running on your system:

**Windows:**
```bash
mongod
```

**macOS/Linux:**
```bash
sudo systemctl start mongod
```

### 6. Create Upload Directory
```bash
mkdir -p server/uploads/profiles
```

### 7. Start the Application

You can start both frontend and backend simultaneously:
```bash
npm run dev
```

Or start them separately:

**Backend only:**
```bash
npm run server
```

**Frontend only:**
```bash
npm run client
```

## 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## 👑 Admin Setup

To create an admin user, you can either:

1. **Register normally** and then manually update the user in MongoDB:
```javascript
// Connect to MongoDB
use skill-swap-platform

// Find your user and update role to admin
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

2. **Use MongoDB Compass** (GUI) to update the user role field to "admin"

## 🔧 Project Structure

```
skill-swap-platform/
├── server/                 # Backend (Node.js + Express)
│   ├── index.js           # Server entry point
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   └── uploads/           # File uploads
├── client/                # Frontend (React)
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   └── services/      # API services
│   └── public/            # Static files
├── package.json           # Root package.json
└── README.md             # This file
```

## 🧪 Testing the Application

1. **Register a new account** at http://localhost:3000/register
2. **Login** with your credentials
3. **Update your profile** and add skills
4. **Browse other users** and their skills
5. **Send swap requests** to other users
6. **Test admin features** (if you have admin role)

## 🔍 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/profile` - Update profile

### Skills
- `GET /api/skills` - Get all skills
- `POST /api/skills` - Create new skill
- `POST /api/skills/:id/add` - Add skill to user profile

### Swap Requests
- `GET /api/swaps` - Get user's swap requests
- `POST /api/swaps` - Create swap request
- `PUT /api/swaps/:id/accept` - Accept swap request

### Admin (Admin only)
- `GET /api/admin/stats` - Get dashboard stats
- `GET /api/admin/users` - Get all users for admin
- `PUT /api/admin/users/:id/ban` - Ban/unban user

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check the `MONGODB_URI` in your `.env` file
   - Verify MongoDB is accessible on the specified port

2. **Port Already in Use**
   - Change the `PORT` in `.env` file
   - Kill processes using the ports: `npx kill-port 3000 5000`

3. **Permission Errors**
   - Ensure you have write permissions for the uploads directory
   - Run with appropriate permissions on Linux/macOS

4. **Frontend Not Loading**
   - Check if both frontend and backend are running
   - Verify the proxy configuration in `client/package.json`

5. **API Requests Failing**
   - Check if backend server is running on port 5000
   - Verify API endpoints are correct
   - Check browser console for error messages

### Development Tips

- Use **MongoDB Compass** for easier database management
- Check **browser console** for frontend errors
- Check **server logs** for backend errors
- Use **Postman** or similar tools to test API endpoints

## 📚 Key Features Implemented

✅ **User Authentication** - Registration, login, JWT tokens
✅ **User Profiles** - Create and edit profiles with skills
✅ **Skill Management** - Add, remove, and categorize skills
✅ **User Discovery** - Browse and search users by skills
✅ **Swap Requests** - Send, accept, reject, and cancel requests
✅ **Admin Panel** - User management and content moderation
✅ **Responsive Design** - Works on desktop and mobile
✅ **File Uploads** - Profile photo upload functionality
✅ **Security** - Password hashing, JWT authentication, input validation

## 🚀 Production Deployment

For production deployment:

1. **Set environment variables** properly
2. **Use a production database** (MongoDB Atlas recommended)
3. **Configure email service** for notifications
4. **Set up proper CORS** origins
5. **Use HTTPS** for secure connections
6. **Set up proper logging** and monitoring

## 📞 Support

If you encounter any issues:

1. Check this README file
2. Review the console logs
3. Verify all prerequisites are installed
4. Check the API documentation
5. Ensure MongoDB is running and accessible

## 🎉 Success!

If everything is working correctly, you should see:
- ✅ Backend server running on port 5000
- ✅ Frontend application running on port 3000
- ✅ Database connected successfully
- ✅ API endpoints responding
- ✅ User registration and login working

Happy skill swapping! 🎯
