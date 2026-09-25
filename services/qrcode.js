const QRCode = require('qrcode');

async function generateQrDataUrl(text) {
  return QRCode.toDataURL(text, { width: 320, margin: 2 });
}

module.exports = { generateQrDataUrl };
