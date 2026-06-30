# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Local Video Generator

This app can connect to the local FastAPI video generation service in `frontend/src/api.py`.

1. From `frontend`, install dependencies and create a Python virtual environment:
   - Windows:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\activate
     pip install -r src/requirements.txt
     npm install
     ```
   - macOS/Linux:
     ```bash
     python -m venv .venv
     source .venv/bin/activate
     pip install -r src/requirements.txt
     npm install
     ```
2. Start the local video generator:
   ```bash
   npm run video:dev
   ```
3. In a separate terminal, start the frontend app:
   ```bash
   npm run dev
   ```

The frontend will use `http://localhost:8000` in development by default and send `/render-from-urls` requests to the local service.
