# CampFlow Campground Booking and Reservation Platform

CampFlow is a full stack campground reservation platform built for a fictional client with four campground locations offering RV camping, tent sites, cabins, and glamping. It replaces manual, phone and email based booking with a centralized online reservation system for guests, customers, campground managers, and administrators.

Built as part of the BranDive Media Solutions weekly development sprint.

## Tech Stack

Frontend
* React and Vite
* Tailwind CSS
* React Router
* Axios

Backend
* Node.js and Express
* TypeScript
* MongoDB Atlas with Mongoose
* JWT authentication with access and refresh tokens

Tooling
* pnpm workspaces (monorepo)
* Git and GitHub

## Project Structure

The project root contains an artifacts folder holding two workspaces. The campflow folder inside artifacts is the frontend, built with React and Vite. The api server folder inside artifacts is the backend, built with Node and Express. A scripts folder at the root holds seed and utility scripts. The root also contains the workspace package.json and pnpm workspace configuration.

## User Roles

Guest Visitor can browse campgrounds, view pricing, search availability, and register.

Registered Customer can book campsites, manage their profile, view booking history, leave reviews, cancel or edit reservations, and download invoices.

Campground Manager can manage reservations including approving or rejecting bookings, update campsite availability, manage pricing, and view customer information.

Administrator can manage all locations, manage users and assign roles, configure seasonal pricing and promotions, and view reports and revenue analytics.

## Core Features

The public website includes Home, About, Campgrounds, Campground Details, Campsite Categories, Activities, Amenities, Pricing, Gallery, FAQ, and Contact pages.

The reservation system includes date overlap conflict prevention and server side pricing calculation, so pricing cannot be altered by the client.

An interactive campsite map allows filtering by availability and connects directly into the reservation flow.

The customer dashboard includes upcoming reservations, booking history, favorites, reviews, invoices, and cancellation.

The manager and admin operations dashboard includes reservation approval, a booking calendar, campsite and campground management, pricing management, user management with role assignment, and a revenue and analytics reporting dashboard.

In app notifications cover booking, cancellation, and payment confirmations.

Authentication and authorization are role based and JWT backed.

## Getting Started

Prerequisites needed are Node.js, pnpm (installable with npm install g pnpm), and a MongoDB connection string from Atlas or a local instance.

### Installation

From the project root, run:

pnpm install

### Environment Variables

Create a .env file in the project root containing at minimum:

MONGODB_URI, set to your MongoDB connection string
JWT_ACCESS_SECRET, set to your own secret value
JWT_REFRESH_SECRET, set to your own secret value
PORT, set to 5000
CLIENT_URL, set to http://localhost:5173

### Seeding an Admin and Manager Account

The database starts empty. Run the seed script once to create initial test accounts:

pnpm --filter @workspace/api-server run seed:admin

This creates an Administrator account with email admin@campflow.test and password TestAdmin123, and a Manager account with email manager@campflow.test and password TestManager123.

These are development and demo credentials only and should be changed or removed before any real production use.

### Running Locally

Two terminals are needed at the same time.

For the backend, which runs on port 5000, open a terminal, move into artifacts/api server, and run pnpm run dev.

For the frontend, which runs on port 5173, open a second terminal, move into artifacts/campflow, and run pnpm run dev.

Then open http://localhost:5173 in your browser.

### Building for Production

From artifacts/api server, run pnpm run build.
From artifacts/campflow, run pnpm run build.

## Known Limitations

Payments are UI only. No real payment processor is integrated, by design and in line with project scope.

Notifications are UI only and stored client side. No real email delivery is implemented.

JWT tokens are currently stored in browser local storage. Migrating to httpOnly cookies is recommended for a genuine production deployment.

Invoice download uses the browser print and save as PDF function rather than a generated file, since a backend invoice endpoint was outside project scope.

## Author

Built as a solo intern project for the BranDive Media Solutions sprintt.
