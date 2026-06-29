## Authentication Service

This service's routes live in `backend/authenticationService/src/routes/authRoutes.js`.

The project is called via the Node/Express API gateway (`backend/gatewayService`), which proxies these routes under:
- `/auth/*`
- `/api/auth/*`
