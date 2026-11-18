/** STK Studio - Backend Google Apps Script.
 * Configura las propiedades indicadas en README.md antes de desplegar.
 * La hoja registra prospectos/cotizaciones; Drive crea carpeta por solicitud;
 * Gmail envía aviso al despacho; Calendar crea evento si se indicó fecha y hora.
 */
const CFG = {
  SPREADSHEET_ID: PropertiesService.getScriptProperties().getProperty('STK_SPREADSHEET_ID'),
  ROOT_FOLDER_ID: PropertiesService.getScriptProperties().getProperty('STK_ROOT_FOLDER_ID'),
  NOTIFY_EMAIL: PropertiesService.getScriptProperties().getProperty('STK_NOTIFY_EMAIL') || 'arquitecturastudiok@gmail.com',
  CALENDAR_ID: PropertiesService.getScriptProperties().getProperty('STK_CALENDAR_ID') || 'primary',
  TIMEZONE: 'America/Mexico_City'
};

function doGet() {
  return json_({ ok: true, service: 'STK Studio Integrations', version: '1.0.0' });
}

function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents;
    if (!raw) throw new Error('Solicitud vacía.');
    const data = JSON.parse(raw);
    if (data.action !== 'newLead') throw new Error('Acción no reconocida.');
    if (!data.consent && data.source === 'contact-form') throw new Error('No existe autorización para registrar los datos.');
    const lead = sanitize_(data);
    const folder = createLeadFolder_(lead);
    appendLead_(lead, folder ? folder.getUrl() : '');
    sendNotification_(lead, folder ? folder.getUrl() : '');
    const eventInfo = createCalendarEvent_(lead);
    return json_({ ok: true, folderUrl: folder ? folder.getUrl() : '', calendarEvent: eventInfo });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function sanitize_(d) {
  const clean = v => String(v == null ? '' : v).replace(/[<>]/g, '').slice(0, 4000);
  return {
    source: clean(d.source), createdAt: clean(d.createdAt), name: clean(d.name),
    phone: clean(d.phone), email: clean(d.email), service: clean(d.service),
    property: clean(d.property), areaM2: clean(d.areaM2), totalEstimate: clean(d.totalEstimate),
    summary: clean(d.summary), extras: clean(d.extras), location: clean(d.location),
    message: clean(d.message), preferredDate: clean(d.preferredDate),
    preferredTime: clean(d.preferredTime), page: clean(d.page)
  };
}

function appendLead_(d, folderUrl) {
  if (!CFG.SPREADSHEET_ID) throw new Error('Falta configurar STK_SPREADSHEET_ID.');
  const ss = SpreadsheetApp.openById(CFG.SPREADSHEET_ID);
  let sh = ss.getSheetByName('Prospectos');
  if (!sh) {
    sh = ss.insertSheet('Prospectos');
    sh.appendRow(['Fecha de registro','Origen','Nombre','Teléfono','Correo','Servicio','Inmueble','Superficie m²','Estimación','Ubicación','Descripción','Fecha preferida','Hora preferida','Extras','Carpeta Drive','Página']);
    sh.setFrozenRows(1);
  }
  sh.appendRow([new Date(), d.source, d.name, d.phone, d.email, d.service, d.property, d.areaM2, d.totalEstimate, d.location, d.message, d.preferredDate, d.preferredTime, d.extras, folderUrl, d.page]);
}

function createLeadFolder_(d) {
  if (!CFG.ROOT_FOLDER_ID) return null;
  const root = DriveApp.getFolderById(CFG.ROOT_FOLDER_ID);
  const label = (d.name || d.service || 'Prospecto').replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 60);
  const stamp = Utilities.formatDate(new Date(), CFG.TIMEZONE, 'yyyyMMdd-HHmmss');
  const folder = root.createFolder('STK-' + stamp + '-' + (label || 'Prospecto'));
  folder.createFile('solicitud.json', JSON.stringify(d, null, 2), MimeType.PLAIN_TEXT);
  return folder;
}

function sendNotification_(d, folderUrl) {
  if (!CFG.NOTIFY_EMAIL) return;
  const subject = 'STK Studio | Nueva solicitud: ' + (d.service || 'Cotización');
  const body = [
    'Nueva solicitud recibida desde el sitio STK Studio.', '',
    'Nombre: ' + d.name, 'Teléfono: ' + d.phone, 'Correo: ' + d.email,
    'Servicio: ' + d.service, 'Inmueble: ' + d.property,
    'Superficie: ' + d.areaM2 + ' m²', 'Estimación: ' + d.totalEstimate,
    'Ubicación: ' + d.location, 'Descripción: ' + d.message,
    'Fecha preferida: ' + d.preferredDate, 'Hora preferida: ' + d.preferredTime,
    'Extras: ' + d.extras, 'Carpeta: ' + folderUrl, 'Origen: ' + d.source
  ].join('\n');
  GmailApp.sendEmail(CFG.NOTIFY_EMAIL, subject, body, { name: 'STK Studio - Sitio web' });
}

function createCalendarEvent_(d) {
  if (!d.preferredDate || !d.preferredTime) return 'Sin fecha/hora solicitada';
  const start = new Date(d.preferredDate + 'T' + d.preferredTime + ':00');
  if (isNaN(start.getTime())) return 'Fecha u hora no válida';
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const calendar = CalendarApp.getCalendarById(CFG.CALENDAR_ID);
  const event = calendar.createEvent('Consulta STK Studio - ' + (d.name || d.service), start, end, {
    description: ['Teléfono: ' + d.phone, 'Correo: ' + d.email, 'Servicio: ' + d.service, 'Ubicación: ' + d.location, d.message].join('\n')
  });
  return event.getId();
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
