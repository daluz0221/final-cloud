# Inventario cloud

Proyecto del curso de computación en la nube (UDEA). Es una aplicación sencilla para llevar un inventario de productos: puedes listarlos, crear nuevos, editarlos y eliminarlos.

**Autor:** Luis Felipe Echeverry Parra  
**Región AWS:** us-east-1

---

## ¿Qué hace?

La idea es tener una página web donde se vean los productos en una tabla y, desde ahí, administrarlos sin tocar la base de datos a mano. Por detrás todo corre en AWS: el frontend está en S3 con CloudFront, y la API en Lambda con DynamoDB.

---

## Estructura del repositorio

```
final/
├── frontend/     → Interfaz en React (Vite)
└── inventario/   → API con Express, desplegada con Serverless
```

---

## Tecnologías que usé

| Parte | Qué es |
|-------|--------|
| Frontend | React + Vite |
| Backend | Express.js dentro de una Lambda |
| Base de datos | DynamoDB (tabla `inventario-dev-productos`) |
| API pública | API Gateway (HTTP API) |
| Despliegue backend | Serverless Framework |
| Frontend en producción | S3 + CloudFront |

---

## Cómo correrlo en local

### 1. Backend (API)

Desde la carpeta `inventario`:

```bash
npm install
npx serverless deploy
```

Eso deja la API en AWS. La URL que tengo desplegada es:

`https://h3xfgsluoc.execute-api.us-east-1.amazonaws.com`

### 2. Frontend

Desde la carpeta `frontend`:

```bash
npm install
```

Crea un archivo `.env.local` (puedes guiarte con `.env.example`):

```
VITE_API_URL=https://h3xfgsluoc.execute-api.us-east-1.amazonaws.com
```

Luego:

```bash
npm run dev
```

Abre el enlace que muestra Vite (normalmente `http://localhost:5173`). El backend ya tiene CORS configurado para localhost y para CloudFront.

---

## API — rutas disponibles

| Método | Ruta | Para qué sirve |
|--------|------|----------------|
| GET | `/productos` | Ver todos los productos |
| POST | `/productos` | Crear uno nuevo |
| PUT | `/productos/{id}` | Actualizar por id |
| DELETE | `/productos/{id}` | Borrar por id |

Cada producto tiene: `id`, `nombre`, `categoria` (si no mandas nada, queda "General"), `cantidad` y `updatedAt`.

---

## Producción (lo que ya está desplegado)

- **Frontend (CloudFront):** https://d2m7470idjwjir.cloudfront.net  
- **API:** https://h3xfgsluoc.execute-api.us-east-1.amazonaws.com  
- **Tabla DynamoDB:** `inventario-dev-productos` 


---

## Build del frontend para subir a S3

```bash
cd frontend
npm run build
```

La carpeta `dist/` es la que se sube al bucket de S3 (el despliegue a S3/CloudFront lo hago aparte en la consola de AWS).



## Referencia rápida de comandos

```bash
# Backend
cd inventario && npx serverless deploy

# Frontend en desarrollo
cd frontend && npm run dev

# Frontend para producción
cd frontend && npm run build
```


