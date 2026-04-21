# 🚚 Kondorito — Delivery Tracking PWA

Aplicación web progresiva (PWA) para seguimiento de pedidos en tiempo real, pensada para domiciliarios.

## Demo

Próximamente

## Funcionalidades

- Visualización del pedido activo  
- ID dinámico del domiciliario (desde backend)  
- Mapa interactivo con ruta (Leaflet)  
- Ubicación en tiempo real  
- Swipe para marcar pedido como entregado  
- Expandir / minimizar mapa  
- Estado de conexión  

## Stack técnico

**Frontend:** React, Leaflet, CSS (mobile-first)  
**Backend:** Node.js / Express  
**Base de datos:** PostgreSQL  

## Correr localmente

### Backend
```bash
cd backend
npm install
npm run dev

Notas
Diseñado principalmente para uso en celular
El swipe completa el pedido y limpia la vista
Próximo paso: persistir entregas en base de datos

Autor
Juan Nicolás Gómez
