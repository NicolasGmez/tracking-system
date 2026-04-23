# 🚚 Kondorito Tracking — Delivery PWA

Mobile-first Progressive Web App for real-time delivery tracking, 
built for the courier role within a larger food delivery platform.

## Overview

This module handles the courier-side experience of an order delivery 
system. It connects to a Node.js backend via WebSockets for real-time 
communication, tracks the courier's live location using the browser 
Geolocation API, and renders an interactive map with the optimal route 
between pickup and dropoff points.

## Features

- Real-time WebSocket connection with automatic courier registration
- Live location tracking via browser `watchPosition` API
- Interactive map with Leaflet — custom markers for courier, pickup and dropoff
- Optimal route rendering using OSRM (Open Source Routing Machine)
- Swipe gesture to confirm delivery and reset the interface
- Collapsible map for better mobile UX
- Connection status indicator

## Tech Stack

- **Frontend:** React, Leaflet, Socket.io client, CSS (mobile-first)
- **Backend:** Node.js, Express, Socket.io
- **Routing:** OSRM API
- **Type:** PWA with mobile-first design

## Status

Fully operational MVP. Pending: database persistence, 
authentication and order history.

## Context

This module is part of Kondorito, a full delivery management 
platform currently under development as a university final project.
