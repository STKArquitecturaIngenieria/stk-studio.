# STK Studio — GitHub Pages + Google Workspace

Este paquete conserva el sitio original como `index.html` y añade una capa independiente de integraciones. No se han reescrito las funciones originales de navegación, catálogo, modales, cotizador, cálculo de honorarios, enlaces `wa.me`, `mailto` ni Google Meet.

## Estructura

- `index.html`: copia del código original proporcionado.
- `integrations/config.js`: URL del backend y opciones públicas.
- `integrations/stk-integrations.js`: capa adicional; registra leads y cotizaciones, agrega fecha/hora opcional y enlace de Maps.
- `google-apps-script/Code.gs`: backend Google para Sheets, Drive, Gmail y Calendar.

## 1. Publicar en GitHub Pages

1. Crea un repositorio, por ejemplo `stk-studio`.
2. Sube el contenido completo de esta carpeta a la raíz del repositorio.
3. En GitHub abre **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**, rama `main`, carpeta `/ (root)` y guarda.
5. GitHub publicará el sitio en la URL que indique Pages.

## 2. Preparar Google Sheets

1. Crea una hoja de cálculo llamada `STK Studio - Prospectos`.
2. Copia su ID desde la URL: `https://docs.google.com/spreadsheets/d/ID/edit`.
3. Crea en Google Drive una carpeta raíz llamada `STK Studio - Expedientes` y copia su ID.

## 3. Desplegar Google Apps Script

1. En `script.google.com`, crea un proyecto nuevo.
2. Pega el contenido de `google-apps-script/Code.gs` en `Code.gs`.
3. En **Project Settings → Script Properties**, agrega:
   - `STK_SPREADSHEET_ID` = ID de la hoja de cálculo.
   - `STK_ROOT_FOLDER_ID` = ID de la carpeta raíz de Drive.
   - `STK_NOTIFY_EMAIL` = correo del despacho (por defecto `arquitecturastudiok@gmail.com`).
   - `STK_CALENDAR_ID` = `primary` o ID del calendario destino.
4. En **Project Settings**, activa la visualización del archivo `appsscript.json` y copia su contenido desde este paquete al manifiesto del proyecto.
5. Ejecuta una función de prueba desde el editor y autoriza los permisos solicitados.
6. Selecciona **Deploy → New deployment → Web app**.
7. Ejecutar como: **Me**. Acceso: **Anyone** (o la opción equivalente disponible para tu cuenta). Publica y copia la URL terminada en `/exec`.
8. En `integrations/config.js`, reemplaza `PEGA_AQUI_LA_URL_DE_IMPLEMENTACION_WEB_DE_APPS_SCRIPT` por esa URL.
9. Sube el cambio a GitHub.

El backend recibe solicitudes con autorización expresa para registrar datos del formulario. Las cotizaciones se registran cuando se usan los botones de envío del cotizador. La página conserva sus envíos originales a WhatsApp y correo.

## 4. Qué hace cada integración

- **Google Sheets:** crea la pestaña `Prospectos` si no existe y agrega cada solicitud/cotización.
- **Google Drive:** crea una carpeta individual por registro y guarda un JSON de la solicitud.
- **Gmail:** envía aviso al correo configurado.
- **Google Calendar:** si el cliente captura fecha y hora preferidas, crea un evento de una hora en el calendario configurado. Es una solicitud tentativa; confirma la cita con el cliente antes de considerarla reservada.
- **Google Maps:** agrega un enlace de búsqueda de la ubicación capturada. No requiere exponer una API key.
- **Google Meet:** se conserva el enlace original `https://meet.google.com/new`. La creación automática de enlaces Meet dentro de eventos requiere habilitar Google Calendar API avanzada y permisos adicionales; no se simula aquí.
- **WhatsApp Business:** se conserva el envío original mediante `wa.me`. La API oficial de WhatsApp Business Platform requiere alta de Meta Business, número aprobado y token secreto del lado servidor. No se coloca ningún token en el frontend ni se envían mensajes automáticos sin consentimiento.

## 5. Pruebas antes de producción

1. Abre la página publicada y comprueba menú móvil, pestañas, modales, cotizador y sus importes.
2. Comprueba que los botones de cotización sigan abriendo WhatsApp/correo como antes.
3. Envía un formulario de prueba y marca la casilla de autorización para el registro automático.
4. Comprueba la fila en Sheets, la carpeta/JSON en Drive y el correo de aviso.
5. Prueba fecha y hora preferidas con un calendario de pruebas.
6. Comprueba el enlace de Maps con una ubicación de prueba.

## Seguridad y límites

GitHub Pages es alojamiento estático; no guardes secretos en archivos JavaScript públicos. La URL de Apps Script será visible y el endpoint público puede recibir spam: para uso público real añade validación antiabuso (por ejemplo CAPTCHA/Turnstile), límites de frecuencia y validación adicional. No publiques datos personales en repositorios. Configura avisos de privacidad, consentimiento y retención de datos conforme a la normativa aplicable.

La API oficial de WhatsApp Cloud no se activa solo con un enlace `wa.me`; necesita credenciales y configuración de Meta. Nunca pegues tokens en `config.js` ni en GitHub.
