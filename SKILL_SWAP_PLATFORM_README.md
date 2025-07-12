# Skill Swap Platform - Project Overview

## 📋 Problem Statement

The Skill Swap Platform is a mini application that enables users to exchange skills and knowledge with each other. Users can list their skills, request skills from others, and engage in skill-swapping activities. The platform includes user management, skill matching, request handling, and administrative oversight.

## 🎯 Project Objectives

- Create a platform for skill exchange between users
- Enable users to find and connect with others based on complementary skills
- Provide a system for managing skill swap requests and feedback
- Implement administrative controls for platform management

## 🚀 Core Features

### User Management
- **User Registration & Authentication**
  - Email/Password login system
  - Profile creation and management
  - Public/Private profile visibility settings

### User Profile Features
- **Basic Information**
  - Name (required)
  - Location (optional)
  - Profile photo (optional)
  - Availability settings (weekends, evenings, etc.)

- **Skills Management**
  - List of skills offered
  - List of skills wanted
  - Skill categorization and tagging

### Skill Discovery & Search
- **Browse & Search**
  - Search users by specific skills (e.g., "Photoshop", "Excel")
  - Filter by availability and location
  - View public profiles only

### Swap Request System
- **Request Management**
  - Send skill swap requests to other users
  - Accept or reject incoming requests
  - View pending, accepted, and cancelled requests
  - Delete unaccepted requests

- **Request Tracking**
  - Current active swaps
  - Pending requests (sent and received)
  - Swap history

### Feedback & Rating System
- **Post-Swap Feedback**
  - Rate swap experiences
  - Leave feedback comments
  - View feedback history

## 👑 Admin Features

### User Management
- **Content Moderation**
  - Reject inappropriate or spammy skill descriptions
  - Ban users who violate platform policies
  - Monitor user activity and reports

### Swap Monitoring
- **Request Oversight**
  - Monitor pending, accepted, and cancelled swaps
  - Track swap completion rates
  - Handle disputes and issues

### Communication
- **Platform Messaging**
  - Send platform-wide announcements
  - Feature updates notifications
  - Downtime alerts and maintenance notices

### Analytics & Reporting
- **Data Export**
  - Download user activity reports
  - Export feedback logs
  - Generate swap statistics
  - Platform usage analytics

## 📱 User Interface Flow

### Screen Flow (Based on Wireframes)

1. **Home Page (Screen 1)**
   - Platform branding
   - Login/Register options
   - Search functionality
   - User listings with pagination

2. **Login Page (Screen 2)**
   - Email and password fields
   - Login button
   - Forgot password link
   - Navigation to home

3. **User Profile Page (Screen 3)**
   - Complete profile information
   - Skills offered and wanted
   - Availability settings
   - Privacy controls
   - Action buttons (Save, Request, etc.)

4. **Skill Browse Page (Screen 4)**
   - Search and filter options
   - User cards with basic info
   - Skill tags and ratings
   - Request buttons

5. **Swap Request Page (Screen 5)**
   - Request form with skill selection
   - Message composition
   - Submit functionality

6. **Request Management Page (Screen 6)**
   - Pending requests view
   - Accept/Reject actions
   - Request status tracking
   - Pagination for multiple requests

## 🛠 Technical Requirements

### Frontend Technologies
- **Framework**: React.js or Vue.js
- **Styling**: CSS3, Bootstrap or Tailwind CSS
- **State Management**: Redux or Vuex
- **Routing**: React Router or Vue Router

### Backend Technologies
- **Server**: Node.js with Express or Python Django
- **Database**: PostgreSQL or MongoDB
- **Authentication**: JWT tokens
- **File Upload**: Multer or similar for profile photos


## 📊 Database Schema Overview

### Users Table
- User ID, Name, Email, Password Hash
- Location, Profile Photo, Availability
- Profile Visibility (Public/Private)
- Created/Updated timestamps

### Skills Table
- Skill ID, Name, Category, Description
- Created/Updated timestamps

### User Skills Table
- User ID, Skill ID, Type (Offered/Wanted)
- Proficiency Level, Notes

### Swap Requests Table
- Request ID, Requester ID, Requestee ID
- Offered Skill ID, Wanted Skill ID
- Status (Pending/Accepted/Rejected/Cancelled)
- Message, Created/Updated timestamps

### Feedback Table
- Feedback ID, Swap Request ID
- Reviewer ID, Reviewee ID
- Rating, Comments, Created timestamp

### Admin Actions Table
- Action ID, Admin ID, User ID
- Action Type, Reason, Timestamp


