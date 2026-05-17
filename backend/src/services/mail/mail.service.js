const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Sends a booking confirmation email.
 * @param {string} to - Patient's email.
 * @param {object} bookingDetails - Details of the booking.
 */
const sendBookingConfirmation = async (to, bookingDetails) => {
  const mailOptions = {
    from: `"AarogyaLink" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Booking Confirmed - AarogyaLink',
    html: `
      <h1>Your Consultation is Confirmed!</h1>
      <p>Namaste ${bookingDetails.patientName},</p>
      <p>Your appointment with <strong>${bookingDetails.doctorName}</strong> has been successfully booked.</p>
      <p><strong>Date:</strong> ${bookingDetails.date}</p>
      <p><strong>Time:</strong> ${bookingDetails.time}</p>
      <p>Please log in to the dashboard to track your live queue position.</p>
      <br/>
      <p>Stay Healthy,<br/>Team AarogyaLink</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${to}`);
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};

module.exports = {
  sendBookingConfirmation,
};
