# Inventario cloud

**Región:** us-east-1  
**Autor:** Luis Felipe Echeverry Parra

## Fase 1 — API serverless

- **IaC:** Serverless Framework (`inventario/serverless.yml`)
- **Deploy:** `cd inventario && npx serverless deploy`
- **API base:** https://h3xfgsluoc.execute-api.us-east-1.amazonaws.com

| Método | Ruta |
|--------|------|
| GET | /productos |
| POST | /productos |
| PUT | /productos/{id} |
| DELETE | /productos/{id} |

**Tabla DynamoDB:** `inventario-dev-productos` (on-demand)