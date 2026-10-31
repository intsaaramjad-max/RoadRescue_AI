# RoadRescue AI — Frontend Log & Documentation

This log file outlines the frontend architecture, implemented screens, routing flows, and responsiveness features of the RoadRescue AI mobile application.

---

## 1. Technical Architecture & Tech Stack

* **Framework:** React Native (Expo v56.0.0 SDK)
* **Navigation:** React Navigation (v7)
  * `@react-navigation/native`
  * `@react-navigation/native-stack` (Native navigation stacks)
  * `@react-navigation/bottom-tabs` (Dashboard & profile bottom tabs)
* **UI Components & Icons:**
  * `@expo/vector-icons` (Ionicons)
  * `expo-linear-gradient` (Premium gradient cards)
  * `react-native-safe-area-context` (Safe area handling)
* **Storage:** `@react-native-async-storage/async-storage` (Token & profile session persistence)
* **Styling System:** Vanilla StyleSheet with central HSL design tokens from `src/theme/theme.js`.

---

## 2. Navigation Flow & Stacks

The routing is divided based on roles and authentication status:

### A. Authentication Stack
Users register or log in before they can access dashboard functions:
* **LoginScreen:** Entry point for credentials.
* **SignUpScreen:** Captures user role (Driver or Mechanic) and credentials.
* **ForgotPasswordScreen / OtpVerificationScreen:** Verification flows.

### B. Driver Stacks (`src/navigation/DriverNavigator.js`)
* **HomeStack:**
  * **DriverDashboard:** Action cards for services (Tow Truck, Battery, Tire change).
  * **CreateRequestScreen:** Triggers a live help request.
  * **LiveTrackingScreen:** Real-time map monitoring of the mechanic's location.
  * **ChatScreen:** Chat support between driver and mechanic.
  * **FeedbackScreen:** Rating & review submission.
* **History:** Service history listing.
* **ProfileStack:**
  * **DriverProfileScreen:** Vehicle details and personal info.
  * **PaymentScreen:** Saved cards management.
  * **NotificationsScreen:** Alerts history.
  * **PrivacySecurityScreen:** Password settings.
  * **HelpSupportScreen:** 24/7 FAQs and contact support channels.

### C. Mechanic Stacks
* **MechanicDashboard:** Incoming requests monitoring, job acceptance.
* **MechanicRegistrationScreen / MechanicVerificationScreen:** Upload CNIC, workshop photos, and police character certificate.
* **MechanicProfileScreen:** View credentials, ratings, and job statistics.

---

## 3. Implemented Active Screens

| Screen Name | Location | Primary Purpose | Key Features |
| :--- | :--- | :--- | :--- |
| **LoginScreen** | `src/screens/auth/` | Authenticates users (Drivers/Mechanics) | Hashed login, session saving |
| **SignUpScreen** | `src/screens/auth/` | Registers new accounts with roles | Role picker, phone validation |
| **DriverDashboard** | `src/screens/driver/` | Main hub for drivers to request help | Clean grid layout, service shortcuts |
| **ChatScreen** | `src/screens/driver/` | Chat engine with mechanic | Optimistic UI updates, quick-replies |
| **DriverProfileScreen** | `src/screens/driver/` | Manage profile details & vehicles | Dynamic list, add/remove vehicles |
| **FeedbackScreen** | `src/screens/driver/` | Submits reviews for services | Star ratings, quick tags, animations |
| **HelpSupportScreen** | `src/screens/driver/` | FAQ documentation & phone help | Interactive accordion, quick-call buttons |
| **NotificationsScreen** | `src/screens/driver/` | Logs push notification alerts | Clear all read, unread count badge |
| **MechanicDashboard** | `src/screens/mechanic/` | Driver request matching for mechanics | Pending request list, interactive map |
| **MechanicVerificationScreen**| `src/screens/mechanic/` | Verification document upload | CNIC / Police cert upload simulator |

---

## 4. Responsiveness System (`src/components/ScreenWrapper.js`)

Centralized layout responsive engine used by all screens:
* **Web (Desktop) & Tablet View:**
  * Caps layout width dynamically to `520px` max-width.
  * Centers layout on wide screens.
  * Adds elegant borders and shadows on desktop screens, with custom outer space margins (`#090d16`).
* **Mobile View:**
  * Scales seamlessly to occupy `100%` width on standard smartphones (iOS/Android).

---

## 5. API Integration & Configs

All screens communicate with a central API base URL pointing to the live production server hosted on Vercel:
* **Production API Base URL:** `https://road-rescue-ai-poc2.vercel.app/api`
* **Local Fallbacks:** Emulators fallback to `localhost:5000/api` or `10.0.2.2:5000/api` (Android) during development.
