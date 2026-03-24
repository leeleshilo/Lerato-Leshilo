const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let payload = {};
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    // try parsing URLSearchParams
    try {
      const params = new URLSearchParams(event.body || '');
      payload = Object.fromEntries(params.entries());
    } catch (err) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
    }
  }

  const name = payload.name || 'Website visitor';
  const fromEmail = payload.email || 'noreply@example.com';
  const subject = payload.subject || 'Contact from website';
  const message = payload.message || '';

  const TO = process.env.TO_EMAIL || 'leeleshilo@gmail.com';
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = process.env.SMTP_PORT || 587;
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const SMTP_SECURE = (process.env.SMTP_SECURE === 'true');

  if(!SMTP_HOST || !SMTP_USER || !SMTP_PASS){
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables.' })
    };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  const mailOptions = {
    from: `"${name}" <${fromEmail}>`,
    to: TO,
    subject: subject,
    text: `Name: ${name}\nEmail: ${fromEmail}\n\n${message}`,
    html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${fromEmail}</p><p>${message.replace(/\n/g,'<br>')}</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
    return { statusCode: 200, body: JSON.stringify({ message: 'Message sent — thank you!' }) };
  } catch (err) {
    console.error('sendMail error', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to send email: ' + (err.message || err) }) };
  }
};
