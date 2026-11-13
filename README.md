# 🚗 RoadRescue AI

### Smart AI-Powered Roadside Assistance Application

RoadRescue AI is a roadside-assistance application designed to connect drivers with nearby mechanics whenever they experience vehicle problems or emergencies. It provides separate experiences for Drivers, Mechanics, and Admins through a mobile application and a Node.js backend. The platform combines location-based services, AI-assisted vehicle diagnosis, service request management, and real-time communication to make roadside assistance easier and more accessible.

---

## 🌟 Features

- **Role-Based Authentication:** Separate access and navigation for Drivers, Mechanics, and Admins.
- **Roadside Assistance Requests:** Drivers can create service requests when they face vehicle problems.
- **Nearby Mechanic Discovery:** Find available mechanics based on location.
- **Mechanic Availability:** Mechanics can manage their availability and service requests.
- **AI-Assisted Diagnosis:** Driver and mechanic interfaces support vehicle diagnosis using images and media.
- **GPS Tracking:** Location and tracking features for roadside assistance.
- **In-App Chat:** Communication between drivers and mechanics.
- **Admin Dashboard:** Monitor platform activities and manage users and requests.
- **Mechanic Verification:** Manage mechanic verification processes.
- **Notifications:** Support for service-related notifications.
- **Feedback & Reviews:** Drivers can provide feedback about completed services.
- **Support Tickets:** Support-related request management.
- **Cash-Based Services:** Cash payment support.

---

## 👥 User Roles

RoadRescue AI supports three main user roles.

### 1. Driver

- Register and log in.
- Manage personal profile.
- Add and manage vehicle information.
- Request roadside assistance.
- Find nearby mechanics.
- Track service request progress.
- Communicate with mechanics through chat.
- View service history.
- Submit ratings and feedback.

### 2. Mechanic

- Register and log in.
- Manage mechanic profile.
- Manage availability.
- Receive roadside assistance requests.
- Accept or manage service requests.
- Communicate with drivers.
- Manage service activities.
- View earnings and service information.

### 3. Admin

- Access the admin dashboard.
- Manage driver accounts.
- Manage mechanic accounts.
- Verify mechanics.
- Monitor roadside assistance requests.
- View platform statistics.
- Manage operational activities.
- Monitor support and platform operations.

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Mobile & Web Frontend | React Native, Expo |
| React Native Version | 0.85 |
| Expo SDK | 56 |
| Navigation | React Navigation |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JWT, Firebase Phone Auth |
| Programming Language | JavaScript |
| API Communication | REST APIs |
| Location Services | GPS / Location Tracking |

---

## 🔄 Application Workflow

1. User registers or logs in.
2. Driver submits a roadside assistance request.
3. The system identifies nearby available mechanics.
4. Mechanics receive and respond to requests.
5. The driver can track the service progress.
6. Driver and mechanic communicate through in-app chat.
7. Mechanic completes the requested service.
8. Driver provides feedback and ratings.

---

## 📂 Project Structure

```text
RoadRescue_AI/
│
├── App.js
├── app.json
│
├── assets/
│
├── src/
│   ├── components/       # Shared UI components
│   ├── config/           # Frontend API & Firebase configuration
│   ├── context/          # Authentication and session context
│   ├── navigation/       # Application navigators
│   │
│   ├── screens/
│   │   ├── admin/        # Admin screens
│   │   ├── auth/         # Authentication screens
│   │   ├── driver/       # Driver screens
│   │   └── mechanic/     # Mechanic screens
│   │
│   ├── services/         # Firebase phone auth services (web & native)
│   ├── theme/            # App styling and theme
│   └── utils/            # Helper utilities and secure API wrapper
│
├── backend/
│   ├── config/           # MongoDB connection
│   ├── middleware/       # Authentication middleware
│   ├── models/           # Mongoose models
│   ├── routes/
│   │   └── api.js        # Express API routes
│   ├── scripts/          # Admin creation and migration scripts
│   ├── services/         # Firebase Admin SDK service
│   └── server.js         # Backend entry point
│
└── README.md
```

---

## ⚙️ Requirements

Before running the project, make sure you have:

- Node.js (LTS recommended)
- npm
- MongoDB database connection
- Expo Go or an Android/iOS development environment
- Git

---

## 🚀 Setup & Installation

### 1. Install frontend dependencies

From the repository root:

```bash
npm install
```

### 2. Configure and start the backend

```bash
cd backend
npm install
```

Create `backend/.env` locally (do not commit this file to Git):

```dotenv
PORT=5000
MONGODB_URI=<your MongoDB connection string>
JWT_SECRET=<your secure JWT secret>
```

Start the API:

```bash
npm start
```

The server listens on port `5000` by default. Health endpoint: `http://localhost:5000/`.

### 3. Configure the frontend API address

Set the API base URL in `src/config/api.config.js`:
- **Android emulator:** `http://10.0.2.2:5000/api`
- **Physical device:** `http://<your-computer-lan-ip>:5000/api`
- **Web:** `http://localhost:5000/api`

### 4. Start the frontend

From the repository root:

```bash
npm start
```

Use the Expo CLI convenience commands:

```bash
npm run android
npm run ios
npm run web
```

---

## 🛡️ Admin Account Creation

To create an Admin account, run the interactive script from the `backend` directory:

```bash
cd backend
node scripts/createAdmin.js
```

---

## 🌐 API Routes Overview

| Route group | Purpose |
|---|---|
| `/api/auth` | Registration, login, account session, OTP verification, and password flows |
| `/api/requests` | Roadside service requests and status tracking |
| `/api/profile` | Profile, vehicles, and mechanic availability |
| `/api/earnings` | Mechanic earnings |
| `/api/feedback` | Service feedback and ratings |
| `/api/chat` | Request-related messaging |
| `/api/notifications` | In-app notifications |
| `/api/admin` | Admin statistics and management operations |
| `/api/support` | Support tickets |
| `/api/payments` | Payment-related routes |

---

## 🎯 Project Objectives

- Make roadside assistance more accessible.
- Reduce the time required to find nearby mechanics.
- Improve communication between drivers and mechanics.
- Support vehicle problem identification through AI-assisted diagnosis.
- Provide transparent service progress through location tracking.
- Build a secure and user-friendly roadside assistance platform.

---

## 🚀 Future Enhancements

- Improve AI-based vehicle diagnosis.
- Enhance mechanic matching and recommendations.
- Improve GPS tracking and ETA accuracy.
- Expand application security.
- Optimize backend performance.
- Improve third-party service integrations.

---

## 👩‍💻 Developed By

Intsaar Amjad

Software Engineering Final Year Project

GitHub: [Intsaar Amjad](https://github.com/intsaaramjad-max)

Repository: [RoadRescue AI](https://github.com/intsaaramjad-max/RoadRescue_AI)
