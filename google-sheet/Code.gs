/**
 * Saints Closet · order log
 *
 * Every order placed on the Saints Closet site is sent here at the same moment WhatsApp opens for the customer.
 * This script adds one row to "Orders" and one row per piece to "Order lines".
 *
 * Setup (once): see google-sheet/SETUP.md. In short: paste this file into Extensions → Apps Script of the
 * Sheet, run setup(), then Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone),
 * and put the /exec link in site/js/shop-data.js → sheetUrl.
 *
 * The site cannot read replies from this script (browsers block that across sites), so it never waits for it:
 * WhatsApp is the order; this Sheet is the record.
 */

const ORDERS_SHEET = 'Orders';
const LINES_SHEET = 'Order lines';
const STATUSES = ['New', 'Confirmed', 'Delivered', 'Picked up', 'Cancelled', 'No reply'];
const MAX_ORDERS_PER_MINUTE = 30;

const ORDER_HEADERS = ['Received', 'Reference', 'Status', 'Name', 'Phone', 'WhatsApp', 'Method', 'Area', 'Address',
  'Items', 'Pieces', 'Subtotal', 'Delivery', 'Total', 'Currency', 'Test', 'Check', 'Staff notes'];
const LINE_HEADERS = ['Received', 'Reference', 'Product', 'SKU', 'Colour', 'Size', 'Quantity', 'Unit price', 'Line total', 'Test'];

/** Run once from the editor: creates both tabs with headers, formats and the status dropdown. */
function setup() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  book.setSpreadsheetTimeZone('Asia/Beirut');
  const orders = prepareSheet_(book, ORDERS_SHEET, ORDER_HEADERS);
  const lines = prepareSheet_(book, LINES_SHEET, LINE_HEADERS);

  // Text columns stay text, so a phone like +961 or 03 keeps its leading characters.
  orders.getRange('B:I').setNumberFormat('@');
  orders.getRange('J:J').setNumberFormat('@').setWrap(true);
  orders.getRange('L:N').setNumberFormat('#,##0.00');
  orders.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm');
  lines.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm');
  lines.getRange('B:F').setNumberFormat('@');
  lines.getRange('H:I').setNumberFormat('#,##0.00');

  const rule = SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(false).build();
  orders.getRange('C2:C').setDataValidation(rule);
  orders.setColumnWidths(1, ORDER_HEADERS.length, 120);
  orders.setColumnWidth(9, 240);
  orders.setColumnWidth(10, 320);
  orders.setColumnWidth(18, 240);

  const defaultSheet = book.getSheetByName('Sheet1');
  if (defaultSheet && defaultSheet.getLastRow() === 0 && book.getSheets().length > 2) book.deleteSheet(defaultSheet);
  return 'Ready: ' + ORDERS_SHEET + ' and ' + LINES_SHEET;
}

function prepareSheet_(book, name, headers) {
  const sheet = book.getSheetByName(name) || book.insertSheet(name);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#0a0907').setFontColor('#d4ae5a');
  sheet.setFrozenRows(1);
  return sheet;
}

/** Opening the /exec link in a browser shows this, so you can check the deployment is live. */
function doGet() {
  return ContentService.createTextOutput('Saints Closet order log is running.');
}

function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents;
    if (!raw || raw.length > 20000) return reply_(false, 'empty or too large');
    const data = JSON.parse(raw);
    if (data.website) return reply_(true, 'ok'); // spam trap: real customers never fill this
    if (!underRateLimit_()) return reply_(false, 'busy');

    const order = clean_(data);
    if (!order) return reply_(false, 'invalid');

    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      const book = SpreadsheetApp.getActiveSpreadsheet();
      const orders = book.getSheetByName(ORDERS_SHEET);
      const lines = book.getSheetByName(LINES_SHEET);
      if (!orders || !lines) throw new Error('Run setup() first.');
      if (alreadySaved_(orders, order.reference)) return reply_(true, 'duplicate');

      const received = new Date();
      const row = orders.getLastRow() + 1;
      orders.getRange(row, 1, 1, ORDER_HEADERS.length).setValues([[
        received, order.reference, 'New', order.name, order.phone, 'Chat', order.fulfilment === 'delivery' ? 'Delivery' : 'Pick up',
        order.zone, order.address, order.itemsText, order.pieces, order.subtotal, order.deliveryFee, order.total,
        order.currency, order.test ? 'TEST' : '', order.check, '',
      ]]);
      const link = 'https://wa.me/' + whatsappDigits_(order.phone);
      orders.getRange(row, 6).setRichTextValue(SpreadsheetApp.newRichTextValue().setText('Chat').setLinkUrl(link).build());

      const lineRows = order.items.map(item => [received, order.reference, item.name, item.sku || item.id, item.colour, item.size, item.quantity, item.unitPrice, item.lineTotal, order.test ? 'TEST' : '']);
      if (lineRows.length) lines.getRange(lines.getLastRow() + 1, 1, lineRows.length, LINE_HEADERS.length).setValues(lineRows);
    } finally {
      lock.releaseLock();
    }
    return reply_(true, 'saved');
  } catch (error) {
    console.error(error);
    return reply_(false, 'error');
  }
}

/** Checks the shape of an order and returns a safe copy, or null. */
function clean_(data) {
  const reference = text_(data.reference, 20);
  if (!/^SC-\d{4}-[2-9A-Z]{4}$/.test(reference)) return null;
  const name = text_(data.name, 100);
  const phone = text_(data.phone, 30);
  const fulfilment = data.fulfilment === 'delivery' ? 'delivery' : data.fulfilment === 'pickup' ? 'pickup' : '';
  if (name.length < 2 || phone.replace(/\D/g, '').length < 7 || !fulfilment) return null;
  if (!Array.isArray(data.items) || data.items.length < 1 || data.items.length > 50) return null;

  const items = [];
  for (const raw of data.items) {
    const quantity = Math.floor(Number(raw && raw.quantity));
    const unitPrice = money_(raw && raw.unitPrice);
    if (!(quantity >= 1 && quantity <= 99) || unitPrice === null) return null;
    items.push({ id: text_(raw.id, 60), sku: text_(raw.sku, 40), colour: text_(raw.colour, 20), name: text_(raw.name, 100), size: text_(raw.size, 20), quantity: quantity, unitPrice: unitPrice, lineTotal: money_(raw.lineTotal) });
  }
  const subtotal = money_(data.subtotal), deliveryFee = money_(data.deliveryFee), total = money_(data.total);
  if (subtotal === null || deliveryFee === null || total === null) return null;

  // The Sheet records what the customer's page sent. Flag anything that does not add up so staff check it on WhatsApp.
  const problems = [];
  items.forEach(item => { if (item.lineTotal === null || Math.abs(item.lineTotal - item.unitPrice * item.quantity) > 0.005) problems.push('line total'); });
  if (Math.abs(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) - subtotal) > 0.005) problems.push('subtotal');
  if (Math.abs(subtotal + deliveryFee - total) > 0.005) problems.push('total');

  return {
    reference: reference, name: name, phone: phone, fulfilment: fulfilment,
    zone: fulfilment === 'delivery' ? text_(data.zone, 60) : '',
    address: fulfilment === 'delivery' ? text_(data.address, 500) : '',
    items: items,
    itemsText: items.map(item => item.quantity + ' × ' + item.name + (item.colour ? ' ' + item.colour : '') + ' (' + item.size + ')' + (item.sku ? ' · ' + item.sku : '')).join('\n'),
    pieces: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: subtotal, deliveryFee: deliveryFee, total: total,
    currency: text_(data.currency, 3) || 'USD',
    test: data.test === true,
    check: problems.length ? 'Check totals: ' + problems.join(', ') : 'OK',
  };
}

/** Trims, caps the length and stops text being read as a formula (=, +, -, @). */
function text_(value, max) {
  let s = String(value == null ? '' : value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function money_(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n < 1e7 ? Math.round(n * 100) / 100 : null;
}

/** Turns what the customer typed into a wa.me number. Local Lebanese numbers (03…, 71…) get 961 in front. */
function whatsappDigits_(phone) {
  let d = String(phone).replace(/\D/g, '');
  if (d.indexOf('00') === 0) d = d.slice(2);
  else if (d.indexOf('961') !== 0 && d.length <= 8) d = '961' + d.replace(/^0/, '');
  return d;
}

function alreadySaved_(sheet, reference) {
  const last = sheet.getLastRow();
  if (last < 2) return false;
  const from = Math.max(2, last - 500);
  return sheet.getRange(from, 2, last - from + 1, 1).createTextFinder(reference).matchEntireCell(true).findNext() !== null;
}

function underRateLimit_() {
  const cache = CacheService.getScriptCache();
  const key = 'orders-' + Math.floor(Date.now() / 60000);
  const count = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(count), 120);
  return count <= MAX_ORDERS_PER_MINUTE;
}

function reply_(ok, message) {
  return ContentService.createTextOutput(JSON.stringify({ ok: ok, message: message })).setMimeType(ContentService.MimeType.JSON);
}

/** Optional: run from the editor to add a fake order and check the tabs fill in. Delete the rows afterwards. */
function testOrder() {
  const response = doPost({ postData: { contents: JSON.stringify({
    reference: 'SC-0000-TEST', name: 'Test Customer', phone: '+961 3 000 000', fulfilment: 'delivery', zone: 'Beirut', address: 'Test street',
    items: [{ id: 'archangel', sku: 'SC-HD-BLK-ARC-M', name: 'Archangel', colour: 'Black', size: 'M', quantity: 2, unitPrice: 75, lineTotal: 150 }],
    subtotal: 150, deliveryFee: 3, total: 153, currency: 'USD', test: true,
  }) } });
  return response.getContent();
}
