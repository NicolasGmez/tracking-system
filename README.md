# 🚚 Kondorito Tracking — Delivery PWA

Mobile-first PWA for real-time delivery tracking inside the Kondorito Postres y Pasteles platform.

## Live Demo

- Main web app: https://kondorito.onrender.com/
- Tracking service / courier PWA: https://kondorito-tracking.onrender.com/

## Overview

This module handles courier tracking for Kondorito. It connects to a Node.js + Socket.IO backend, receives orders assigned from the PHP admin panel, tracks the courier's live location with the browser Geolocation API, and displays pickup, delivery point and route on an interactive map.

The service is integrated with the main Kondorito web app, where customers create orders, administrators assign couriers, and users can follow deliveries in real time.

## Features

- Real-time communication with Socket.IO.
- Courier registration using `domiciliario_id`.
- Live GPS tracking with the browser Geolocation API.
- Interactive maps with Leaflet and OpenStreetMap.
- Route rendering with OSRM.
- Address search/geocoding with Nominatim.
- Admin order assignment and courier monitoring.
- Customer delivery tracking from `mis_pedidos.php`.
- Supabase PostgreSQL integration.

## Tech Stack

- Backend: Node.js, Express, Socket.IO, CORS, dotenv, pg, axios.
- PWA: HTML5, CSS3, Vanilla JavaScript, Web App Manifest, Service Worker.
- Maps: Leaflet, OpenStreetMap, Nominatim API, OSRM API.
- Integration: Supabase PostgreSQL, PHP main web app, Render.

## Main Flow

1. Customer creates and pays an order in the main Kondorito web app.
2. The order is stored in Supabase PostgreSQL.
3. Admin assigns a courier from the PHP admin panel.
4. The tracking service sends the order to the courier PWA.
5. The courier shares live location from the mobile browser.
6. Admin and customer receive the courier location in real time.

## Status

Functional and integrated with the Kondorito platform.

Future improvements:
- Stronger courier authentication.
- Recovery of active orders after page refresh.
- Courier delivery history.
- Push notifications for assigned orders.

## Context

Part of Kondorito Postres y Pasteles, a university final project for catalog, cart, payments, order management, inventory, courier assignment and real-time delivery tracking.
