# KodeKloud Lite

This is a lightweight version of the KodeKloud mobile app, built with React Native and TypeScript. It showcases modern mobile development practices like clean architecture, offline support, video playback, deep linking, push notifications, and thorough testing.

## Features

- **Browse Courses**: Scroll through a list of courses with thumbnails, titles, and authors.
- **View Course Details**: See in-depth info about any course and enroll or unenroll.
- **Watch Lessons:**: Vimeo video integration with progress tracking
- **Track Progress**: Track learning progress with API sync and local caching
- **Deep Link Support**: Navigate directly to courses and lessons via custom URLs
- **Stay Notified**: Local notifications for enrollment reminders and engagement
- **Offline Support**: Course list caching with MMKV and network status detection
- **Clean Codebase**: Built with clear separation of concerns and reusable components.
- **Clean Codebase**: Built with clear separation of concerns and reusable components.
- **Testing**: Comprehensive unit tests for all services and components
- **CI/CD Ready**: GitHub Actions workflow for linting, testing, and building

## Tech Stack

- React Native 0.80
- TypeScript 5
- Redux Toolkit
- React Navigation v7
- Axios for API calls
- MMKV + AsyncStorage for local data
- Vimeo video playback
- Push notifications
- Jest + React Native Testing Library

## Architecture

### Clean Architecture Layers

```
src/
├── api/           # Data Layer - API clients and interceptors
├── services/      # Domain Layer - Repositories and business logic
├── store/         # Presentation Layer - State management (Redux)
├── screens/       # Presentation Layer - UI screens
├── components/    # Presentation Layer - Reusable UI components
├── models/        # Domain Layer - TypeScript interfaces
├── hooks/         # Presentation Layer - Custom hooks
└── tests/         # Test files
```

### Design Patterns Implemented

1. **Repository Pattern**: `CourseRepository` abstracts data access
2. **Observer Pattern**: Redux for state changes and progress updates
3. **Dependency Injection**: Service locator with React Context
4. **MVVM**: ViewModels in Redux slices and custom hooks
5. **Singleton Pattern**: NotificationService for centralized notification management

## Core Features

### 1. Course Management

#### Browse Courses
- Paginated course list with infinite scroll
- Course cards with thumbnails, titles, authors, and progress
- Pull-to-refresh functionality
- Offline support with cached course data

#### Course Detail & Enrollment
- Detailed course information
- Enroll/unenroll functionality
- Automatic enrollment reminder scheduling
- Progress tracking integration

### 2. Video Playback

#### Vimeo Integration
- Seamless video playback with React Native Vimeo
- Progress tracking and resume functionality
- Lesson completion tracking
- Offline video position caching with MMKV

### 3. Progress Tracking

#### ProgressService
- Syncs progress with API and local cache
- Handles offline scenarios
- Provides real-time progress updates

### 4. Deep Linking

The app supports deep linking to navigate directly to specific courses and lessons.

### 5. Push Notifications

The app supports local push notifications for enhanced user engagement.

#### Features
- **Enrollment Reminders**: Automatic 24-hour reminders when enrolling in courses
- **Smart Cancellation**: Automatic cancellation when unenrolling
- **Permission Management**: Graceful handling of notification permissions
- **Multiple Notification Types**: Immediate, scheduled, and repeating notifications

### 6. Offline Support

#### Offline Banner
- Displays when device is offline
- Provides user feedback about connectivity status

#### Caching Strategy
- Course list cached with MMKV
- Last viewed lesson position cached
- Offline-first approach with sync when online

## Screenshots
