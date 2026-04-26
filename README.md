# Backend Portfolio App

Aplicacion full stack orientada a mostrar autenticacion con JWT, manejo de usuarios y CRUD de proyectos por usuario.

## Demo

- Frontend: https://backend-portafolio-nine.vercel.app
- Backend: https://backend-portafolio-r87v.onrender.com

## Que incluye

- Registro de usuarios
- Login con JWT
- Rutas protegidas
- Persistencia de sesion en frontend
- CRUD de proyectos
- Eliminacion de cuenta propia

## Stack

- Node.js
- Express
- MongoDB
- JWT
- bcrypt
- dotenv
- cors
- HTML, CSS y JavaScript para la interfaz

## Variables de entorno

Crear un archivo `.env` con:

```env
MONGO_URI=tu_uri_de_mongodb
JWT_SECRET=tu_clave_secreta
PORT=3000
```

## Ejecutar en local

```bash
npm install
npm start
```

Luego abrir `http://localhost:3000`.

## Vista previa

![Vista previa principal](./vistaPrevia.png)
![Vista previa secundaria](./vistaPrevia2.png)
