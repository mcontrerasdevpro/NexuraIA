# nexuraia.com — web 2.0

Web estática de NexuraIA: portada bilingüe (ES/EN), chat de voz Nexura conectado a n8n,
laboratorio (VotifAI y Nexura) y páginas legales. Se despliega en Easypanel con Docker + nginx.

## Estructura

```
index.html              Portada (textos en español)
legal/                  Aviso legal, privacidad y cookies
404.html                Página de error
src/main.js             Idioma, señal animada, chat Nexura y formulario
src/i18n-en.js          Textos en inglés (claves = atributos data-i18n de index.html)
src/styles.css          Estilos (la fuente Archivo se sirve desde el propio dominio)
public/                 favicon, imagen para redes, robots.txt, sitemap.xml
.env.example            Configuración (webhooks y enlaces opcionales)
Dockerfile, nginx.conf  Compilación y servidor para Easypanel
```

## Trabajar en local

```
npm install
cp .env.example .env     # y rellena lo que tengas
npm run dev              # http://localhost:5173
npm run build            # genera dist/ para producción
npm run preview          # prueba la versión compilada
```

## Cambio de repositorio (sin cortar la web actual)

1. **Hostinger:** en Sitios web → nexuraia.com → Despliegues, desactiva el despliegue automático.
   La web actual sigue en línea tal cual; solo evitas que un push al repo nuevo la sobrescriba.
2. **Apunta las variables de entorno** que tiene configuradas la web actual, por si las necesitas.
3. **GitHub:** en el repo `NexuraIA` → Settings → General, renómbralo a `nexuraia-legacy`.
   Después, en la misma página, "Archive this repository" (queda en solo lectura con todo su historial).
4. **Crea el repo nuevo** `NexuraIA` (vacío, sin README) y sube este proyecto desde VS Code:

```
npm install              # genera package-lock.json: súbelo también
git init
git add .
git commit -m "NexuraIA web 2.0"
git branch -M main
git remote add origin https://github.com/mcontrerasdevpro/NexuraIA.git
git push -u origin main
```

## Despliegue en Easypanel

1. **Servicio:** en tu proyecto de Easypanel → + Service → App → nombre `nexuraia-web`.
2. **Origen:** GitHub → `mcontrerasdevpro/NexuraIA`, rama `main`, ruta `/`.
3. **Build:** tipo **Dockerfile** (ruta `Dockerfile`). Compila con Node y sirve la web con nginx.
4. **Environment:** pega las variables de `.env.example` con sus valores. Easypanel las pasa al build.
5. **Deploy.** Prueba la web en el dominio temporal que asigna Easypanel antes de tocar el DNS.
6. **Auto Deploy:** actívalo para que cada push a `main` publique automáticamente.
7. **Domains:** añade `nexuraia.com` y `www.nexuraia.com`, puerto **80**, HTTPS activado.

## Cambio de DNS (el momento en que la web nueva pasa a ser la oficial)

En Hostinger → Dominios → nexuraia.com → DNS:

- Registro **A** de `@` → IP del VPS.
- Registro de `www` → **A** a la IP del VPS (o CNAME a `nexuraia.com`).
- **No toques los registros MX ni TXT**: son los del correo contacto@nexuraia.com.

La propagación tarda de minutos a unas horas. Cuando la web nueva responda con HTTPS en ambos
dominios, ya puedes eliminar el despliegue antiguo de Hostinger. Si el correo está en Hostinger,
conserva ese servicio.

## Formulario de contacto con n8n

Flujo recomendado: **Webhook** (POST, respuesta con "Respond to Webhook") → **Send Email** a
contacto@nexuraia.com → (opcional) **Google Sheets** para guardar cada solicitud → **Respond to Webhook** 200.
Recibe JSON: `{ nombre, empresa, email, mensaje, lang }`. Pon su URL en `VITE_CONTACT_FORM_ENDPOINT`.
El formulario incluye un campo trampa invisible para frenar spam automático.

## Chat Nexura en producción

- El webhook debe ir por HTTPS con dominio. Lo más sencillo: en Easypanel, añade el dominio
  `n8n.nexuraia.com` a tu servicio de n8n y crea en el DNS un registro A `n8n` → IP del VPS.
- En cada nodo Webhook de n8n: *Allowed Origins (CORS)* = `https://www.nexuraia.com,https://nexuraia.com`.
- El webhook recibe `lang` ("es" o "en") para responder en el idioma del visitante.

## Pendiente de completar

- Páginas legales: rellena lo marcado en amarillo (titular, NIF, domicilio, proveedores, plazos) y
  haz que las revise un profesional.
- Fuente: el proyecto usa `@fontsource-variable/archivo/wdth.css` (pesos y anchos). Si al compilar no
  existiera esa ruta, cambia la primera línea de `src/styles.css` por
  `@import "@fontsource-variable/archivo";` (la web seguirá funcionando, sin la variación de ancho).
