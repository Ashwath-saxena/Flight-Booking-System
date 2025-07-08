// File: frontend/src/utils/emailUtils.ts

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface FlightDetails {
  flight_number: string;
  airline: string; // Required, no longer optional
  departure_time: string;
  arrival_time: string;
  origin: {
    code: string;
    city: string;
  } | { code: string; city: string; }[];
  destination: {
    code: string;
    city: string;
  } | { code: string; city: string; }[];
}

interface Passenger {
  first_name: string;
  last_name: string;
  passenger_type: string;
  cabin_class: string;
}

interface BookingDetails {
  id: string;
  booking_status: string;
  total_amount: number;
  booking_date: string;
  flight: FlightDetails;
  passengers: Passenger[];
}

interface EmailData {
  booking: BookingDetails;
  userEmail: string;
}




export async function sendBookingConfirmationEmail({ booking, userEmail }: EmailData) {
  const departureDate = new Date(booking.flight.departure_time).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata'
  });
  
  const arrivalDate = new Date(booking.flight.arrival_time).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata'
  });

  // Handle origin and destination that might be arrays
  const origin = Array.isArray(booking.flight.origin) 
    ? booking.flight.origin[0] 
    : booking.flight.origin;

  const destination = Array.isArray(booking.flight.destination) 
    ? booking.flight.destination[0] 
    : booking.flight.destination;

  const bookingDate = new Date(booking.booking_date).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Flight Booking Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a73e8; margin-bottom: 10px;">Booking Confirmation</h1>
          <p style="font-size: 18px; color: #4CAF50; margin-top: 0;">Your flight has been successfully booked!</p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1a73e8; margin-bottom: 15px; font-size: 20px;">Booking Details</h2>
          <p style="margin: 5px 0;"><strong>Booking Reference:</strong> ${booking.id}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> ${booking.booking_status}</p>
          <p style="margin: 5px 0;"><strong>Booking Date:</strong> ${bookingDate}</p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1a73e8; margin-bottom: 15px; font-size: 20px;">Flight Details</h2>
          <p style="margin: 5px 0;"><strong>Flight:</strong> ${booking.flight.airline} ${booking.flight.flight_number}</p>
          <p style="margin: 5px 0;"><strong>From:</strong> ${origin.city} (${origin.code})</p>
          <p style="margin: 5px 0;"><strong>To:</strong> ${destination.city} (${destination.code})</p>
          <p style="margin: 5px 0;"><strong>Departure:</strong> ${departureDate}</p>
          <p style="margin: 5px 0;"><strong>Arrival:</strong> ${arrivalDate}</p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1a73e8; margin-bottom: 15px; font-size: 20px;">Passenger Information</h2>
          ${booking.passengers.map(passenger => `
            <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #dee2e6;">
              <p style="margin: 5px 0;"><strong>Name:</strong> ${passenger.first_name} ${passenger.last_name}</p>
              <p style="margin: 5px 0;"><strong>Type:</strong> ${passenger.passenger_type}</p>
              <p style="margin: 5px 0;"><strong>Class:</strong> ${passenger.cabin_class}</p>
            </div>
          `).join('')}
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #1a73e8; margin-bottom: 15px; font-size: 20px;">Payment Information</h2>
          <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${booking.total_amount.toLocaleString('en-IN')}</p>
        </div>

        <div style="text-align: center; margin-top: 30px; color: #666;">
          <p style="margin: 5px 0;">Thank you for choosing our service!</p>
          <p style="margin: 5px 0;">If you have any questions, please don't hesitate to contact us.</p>
          <p style="margin-top: 20px; font-size: 12px; color: #999;">This is an automated message, please do not reply to this email.</p>
          <p style="margin-top: 5px; font-size: 12px; color: #999;">Generated on: ${new Date("2025-07-06 19:47:23").toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: 'Flight Booking System <onboarding@resend.dev>',
      to: userEmail,
      subject: `Booking Confirmation - ${booking.flight.airline} ${booking.flight.flight_number}`,
      html: emailHtml,
    });
    console.log('Booking confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    throw error;
  }
}

export async function sendBookingCancellationEmail({ booking, userEmail }: EmailData) {
  const departureDate = new Date(booking.flight.departure_time).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata'
  });
  
  const arrivalDate = new Date(booking.flight.arrival_time).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata'
  });

  // Handle origin and destination that might be arrays
  const origin = Array.isArray(booking.flight.origin) 
    ? booking.flight.origin[0] 
    : booking.flight.origin;

  const destination = Array.isArray(booking.flight.destination) 
    ? booking.flight.destination[0] 
    : booking.flight.destination;

  const cancellationDate = new Date("2025-07-06 19:47:23").toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Cancellation Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc3545; margin-bottom: 10px;">Booking Cancellation Confirmation</h1>
          <p style="font-size: 18px; color: #666; margin-top: 0;">Your flight booking has been cancelled</p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #dc3545; margin-bottom: 15px; font-size: 20px;">Cancellation Details</h2>
          <p style="margin: 5px 0;"><strong>Booking Reference:</strong> ${booking.id}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> Cancelled</p>
          <p style="margin: 5px 0;"><strong>Cancellation Date:</strong> ${cancellationDate}</p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #dc3545; margin-bottom: 15px; font-size: 20px;">Cancelled Flight Details</h2>
          <p style="margin: 5px 0;"><strong>Flight:</strong> ${booking.flight.airline} ${booking.flight.flight_number}</p>
          <p style="margin: 5px 0;"><strong>From:</strong> ${origin.city} (${origin.code})</p>
          <p style="margin: 5px 0;"><strong>To:</strong> ${destination.city} (${destination.code})</p>
          <p style="margin: 5px 0;"><strong>Departure:</strong> ${departureDate}</p>
          <p style="margin: 5px 0;"><strong>Arrival:</strong> ${arrivalDate}</p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #dc3545; margin-bottom: 15px; font-size: 20px;">Passenger Information</h2>
          ${booking.passengers.map(passenger => `
            <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #dee2e6;">
              <p style="margin: 5px 0;"><strong>Name:</strong> ${passenger.first_name} ${passenger.last_name}</p>
              <p style="margin: 5px 0;"><strong>Type:</strong> ${passenger.passenger_type}</p>
              <p style="margin: 5px 0;"><strong>Class:</strong> ${passenger.cabin_class}</p>
            </div>
          `).join('')}
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #dc3545; margin-bottom: 15px; font-size: 20px;">Refund Information</h2>
          <p style="margin: 5px 0;"><strong>Refund Amount:</strong> ₹${booking.total_amount.toLocaleString('en-IN')}</p>
          <p style="margin: 5px 0;">The refund will be processed to your original payment method within 5-7 business days.</p>
        </div>

        <div style="text-align: center; margin-top: 30px; color: #666;">
          <p style="margin: 5px 0;">If you did not request this cancellation, please contact us immediately.</p>
          <p style="margin: 5px 0;">We hope to serve you again in the future.</p>
          <p style="margin-top: 20px; font-size: 12px; color: #999;">This is an automated message, please do not reply to this email.</p>
          <p style="margin-top: 5px; font-size: 12px; color: #999;">Generated on: ${new Date("2025-07-06 19:47:23").toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
          <p style="margin-top: 5px; font-size: 12px; color: #999;">Cancelled by: Ashwath-saxena</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: 'Flight Booking System <onboarding@resend.dev>',
      to: userEmail,
      subject: `Booking Cancellation Confirmation - ${booking.flight.airline} ${booking.flight.flight_number}`,
      html: emailHtml,
    });
    console.log('Booking cancellation email sent successfully');
  } catch (error) {
    console.error('Error sending booking cancellation email:', error);
    throw error;
  }
}