# MJ · Portafolio de ingeniería de software

Portafolio de MJ con cuatro casos de estudio, un catálogo consultado por API y un flujo de entrega para GitHub Actions.

| Capa | Tecnología | Responsabilidad |
| --- | --- | --- |
| Interfaz | React, TypeScript, Vite, Tailwind CSS y Lucide | Portada, perfiles, navegación y vistas de proyectos |
| API | Node.js 24 y Express | Listado, detalle y estado de salud |
| Datos | SQLite mediante `node:sqlite` | Catálogo en un volumen de Docker, inicializado desde `server/projects.json` |
| Entrega | GitHub Actions, Docker Hub, Terraform, Ansible, Caddy y Cloudflare | Pruebas, publicación, aprovisionamiento y HTTPS |

La configuración de perfil está en `src/profile.ts`. Completa el nombre oficial de la carrera, universidad, cursos, correo, GitHub y LinkedIn cuando los confirmes. Los casos están en `server/projects.json`. Agrega `demo` y `repository` a cada caso cuando tengas URLs reales. La tecnología del hotel queda pendiente. Las imágenes de las interfaces son representaciones conceptuales.

## Ejecutar en Windows

Instala Node.js 24. Desde la carpeta del proyecto en PowerShell:

```powershell
npm.cmd install
npm.cmd run build
npm.cmd start
```

Abre [http://localhost:3000](http://localhost:3000). Agrega el `package-lock.json` generado por npm al repositorio para que CI y Docker usen las mismas dependencias con `npm ci`. Si estás editando el frontend, ejecuta `npm.cmd run api` en una terminal y `npm.cmd run dev` en otra. Vite usa la API del puerto 3000 durante el desarrollo.

## Pruebas y Docker

```powershell
npm.cmd run test:unit
npm.cmd run test:integration
npm.cmd run build
npx.cmd playwright install chromium
npm.cmd run test:e2e
docker compose -f compose.yml -f compose.local.yml up --build -d --wait
curl.exe --fail http://localhost:3000/api/health
docker compose -f compose.yml -f compose.local.yml down
```

Ejecuta Docker después de cerrar el servidor local si los dos usarán el puerto 3000.

| Prueba | Cobertura |
| --- | --- |
| 3 unitarias | Identificadores válidos e inválidos y proyección pública del catálogo |
| 3 de integración | Salud de SQLite a través de HTTP, listado ordenado y detalle junto con el 404 |
| 3 E2E | Navegación al catálogo, apertura y recarga del caso hotelero y navegación móvil |

Cada push a `dev` activa las pruebas en GitHub Actions. Cada push a `main` construye y publica la imagen Docker. Una vez configurada la VM y las variables de AWS, el workflow también despliega por digest y espera el resultado de SSM.

Sigue la [guía de despliegue](DEPLOY.md) para configurar tus cuentas, crear tú la VM, habilitar VNC si lo necesitas y activar la URL en Cloudflare.
