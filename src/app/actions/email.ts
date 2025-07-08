// frontend/src/app/actions/email.ts
'use server';

import { Resend } from 'resend';
import type { EmailData } from '@/utils/types';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set in environment variables');
}

const resend = new Resend(process.env.RESEND_API_KEY);
const CURRENT_TIMESTAMP = "2025-07-07 09:03:14";
const CURRENT_USER = "Ashwath-saxena";

// New interface for flight status update emails
interface FlightStatusUpdateEmailData {
  userEmail: string;
  userName: string;
  flightNumber: string;
  flightId: string;
  bookingId: string;
  route: string;
  departureTime: string;
  arrivalTime: string;
  statusUpdate: {
    previousStatus?: string;
    newStatus: string;
    message: string;
    delay?: number;
    gate?: string;
    updatedBy: string;
    timestamp: string;
  };
}

export async function sendServerEmail(emailData: EmailData, type: 'confirmation' | 'cancellation') {
  try {
    const result = await resend.emails.send({
      from: 'Flight Booking System <onboarding@resend.dev>',
      to: emailData.userEmail,
      subject: type === 'confirmation' 
        ? `Booking Confirmation - ${emailData.booking.flight.airline} ${emailData.booking.flight.flight_number}`
        : `Booking Cancellation Confirmation - ${emailData.booking.flight.airline} ${emailData.booking.flight.flight_number}`,
      html: type === 'confirmation'
        ? generateConfirmationEmailHtml(emailData)
        : generateCancellationEmailHtml(emailData),
    });

    console.log(`Booking ${type} email sent successfully`);
    return { success: true, result };
  } catch (error) {
    console.error(`Error sending ${type} email:`, error);
    return { success: false, error };
  }
}

// New function for flight status update emails
export async function sendFlightStatusUpdateEmail(emailData: FlightStatusUpdateEmailData) {
  try {
    const result = await resend.emails.send({
      from: 'Flight Booking System <onboarding@resend.dev>',
      to: emailData.userEmail,
      subject: `Flight Status Update - ${emailData.flightNumber} | ${emailData.statusUpdate.newStatus}`,
      html: generateFlightStatusUpdateEmailHtml(emailData),
    });

    console.log(`Flight status update email sent successfully to ${emailData.userEmail}`);
    return { success: true, result };
  } catch (error) {
    console.error(`Error sending flight status update email:`, error);
    return { success: false, error };
  }
}

function generateFlightStatusUpdateEmailHtml(emailData: FlightStatusUpdateEmailData): string {
  const { statusUpdate } = emailData;
  const departureDate = new Date(emailData.departureTime).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata'
  });
  
  const arrivalDate = new Date(emailData.arrivalTime).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata'
  });

  const updateTime = new Date(statusUpdate.timestamp).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled': return '#4CAF50';
      case 'boarding': return '#2196F3';
      case 'delayed': return '#FF9800';
      case 'in flight': return '#9C27B0';
      case 'arrived': return '#607D8B';
      case 'cancelled': return '#F44336';
      default: return '#666';
    }
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Flight Status Update - ${emailData.flightNumber}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a73e8; margin-bottom: 10px;">🚨 Flight Status Update</h1>
          <p style="font-size: 18px; color: ${getStatusColor(statusUpdate.newStatus)}; margin-top: 0; font-weight: bold;">
            ${emailData.flightNumber} - ${statusUpdate.newStatus}
          </p>
        </div>

        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #856404; margin-bottom: 15px; font-size: 20px;">⚠️ Important Update</h2>
          <p style="margin: 5px 0; color: #856404; font-size: 16px; font-weight: bold;">
            ${statusUpdate.message}
          </p>
          <p style="margin: 5px 0; color: #856404; font-size: 14px;">
            <strong>Updated:</strong> ${updateTime} by ${statusUpdate.updatedBy}
          </p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1a73e8; margin-bottom: 15px; font-size: 20px;">Flight Details</h2>
          <p style="margin: 5px 0;"><strong>Flight:</strong> ${emailData.flightNumber}</p>
          <p style="margin: 5px 0;"><strong>Route:</strong> ${emailData.route}</p>
          <p style="margin: 5px 0;"><strong>Booking Reference:</strong> ${emailData.bookingId}</p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1a73e8; margin-bottom: 15px; font-size: 20px;">Status Change Details</h2>
          ${statusUpdate.previousStatus ? `<p style="margin: 5px 0;"><strong>Previous Status:</strong> <span style="color: #666;">${statusUpdate.previousStatus}</span></p>` : ''}
          <p style="margin: 5px 0;"><strong>New Status:</strong> <span style="color: ${getStatusColor(statusUpdate.newStatus)}; font-weight: bold;">${statusUpdate.newStatus}</span></p>
          ${statusUpdate.delay && statusUpdate.delay > 0 ? `<p style="margin: 5px 0;"><strong>Delay:</strong> <span style="color: #FF9800; font-weight: bold;">+${statusUpdate.delay} minutes</span></p>` : ''}
          ${statusUpdate.gate ? `<p style="margin: 5px 0;"><strong>Gate:</strong> <span style="color: #2196F3; font-weight: bold;">${statusUpdate.gate}</span></p>` : ''}
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1a73e8; margin-bottom: 15px; font-size: 20px;">Schedule Information</h2>
          <p style="margin: 5px 0;"><strong>Departure:</strong> ${departureDate}</p>
          <p style="margin: 5px 0;"><strong>Arrival:</strong> ${arrivalDate}</p>
          ${statusUpdate.delay && statusUpdate.delay > 0 ? `
            <p style="margin: 15px 0 5px 0; color: #FF9800;"><strong>Updated Times:</strong></p>
            <p style="margin: 5px 0; color: #FF9800;"><strong>New Departure:</strong> ${new Date(new Date(emailData.departureTime).getTime() + statusUpdate.delay * 60000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
            <p style="margin: 5px 0; color: #FF9800;"><strong>New Arrival:</strong> ${new Date(new Date(emailData.arrivalTime).getTime() + statusUpdate.delay * 60000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
          ` : ''}
        </div>

        <!-- Real-time Flight Tracking Section -->
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2196f3;">
          <h2 style="color: #1976d2; margin-bottom: 15px; font-size: 20px;">📱 Continue Tracking Your Flight</h2>
          <p style="margin: 5px 0; color: #1565c0;">Stay updated with real-time changes using your Flight Tracking ID:</p>
          <div style="background-color: white; padding: 12px; border-radius: 4px; border: 2px dashed #2196f3; margin: 10px 0;">
            <code style="font-size: 14px; font-weight: bold; color: #1976d2; letter-spacing: 1px; word-break: break-all;">${emailData.flightId}</code>
          </div>
          <p style="margin: 10px 0 0 0; color: #1565c0; font-size: 12px;">
            <em>Visit our Flight Status page and enter this ID for continuous real-time updates</em>
          </p>
        </div>

        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <h3 style="color: #155724; margin-bottom: 10px;">What should you do?</h3>
          <ul style="color: #155724; margin: 5px 0; padding-left: 20px;">
            <li>Check your email regularly for further updates</li>
            <li>Arrive at the airport as per original schedule unless advised otherwise</li>
            <li>Visit our Flight Status page for real-time tracking</li>
            <li>Contact customer service if you have any concerns</li>
          </ul>
        </div>

        <div style="text-align: center; margin-top: 30px; color: #666;">
          <p style="margin: 5px 0;">We apologize for any inconvenience and appreciate your patience.</p>
          <p style="margin: 5px 0;">For assistance, please contact our customer service team.</p>
          <p style="margin-top: 20px; font-size: 12px; color: #999;">This is an automated notification. Please do not reply to this email.</p>
          <p style="margin-top: 5px; font-size: 12px; color: #999;">Update sent: ${new Date(CURRENT_TIMESTAMP).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
          <p style="margin-top: 5px; font-size: 12px; color: #999;">Updated by: ${CURRENT_USER}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateConfirmationEmailHtml(emailData: EmailData): string {
  const { booking } = emailData;
  const departureDate = new Date(booking.flight.departure_time).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata'
  });
  
  const arrivalDate = new Date(booking.flight.arrival_time).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata'
  });

  const bookingDate = new Date(booking.booking_date).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  return `
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
          <p style="margin: 5px 0;"><strong>From:</strong> ${booking.flight.origin.city} (${booking.flight.origin.code})</p>
          <p style="margin: 5px 0;"><strong>To:</strong> ${booking.flight.destination.city} (${booking.flight.destination.code})</p>
          <p style="margin: 5px 0;"><strong>Departure:</strong> ${departureDate}</p>
          <p style="margin: 5px 0;"><strong>Arrival:</strong> ${arrivalDate}</p>
        </div>

        <!-- Real-time Flight Tracking Section -->
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2196f3;">
          <h2 style="color: #1976d2; margin-bottom: 15px; font-size: 20px;">📱 Track Your Flight in Real-time</h2>
          <p style="margin: 5px 0; color: #1565c0;"><strong>Flight Tracking ID:</strong></p>
          <div style="background-color: white; padding: 12px; border-radius: 4px; border: 2px dashed #2196f3; margin: 10px 0;">
            <code style="font-size: 16px; font-weight: bold; color: #1976d2; letter-spacing: 1px; word-break: break-all;">${booking.flight.id}</code>
          </div>
          <p style="margin: 10px 0 5px 0; color: #1565c0; font-size: 14px;">
            <strong>How to track:</strong>
          </p>
          <ol style="margin: 5px 0; padding-left: 20px; color: #1565c0; font-size: 14px;">
            <li>Copy the Flight Tracking ID above</li>
            <li>Visit our Flight Status page</li>
            <li>Paste the ID and track your flight in real-time</li>
          </ol>
          <p style="margin: 10px 0 0 0; color: #1565c0; font-size: 12px;">
            <em>Get real-time updates on delays, gate changes, and boarding status!</em>
          </p>
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
          <p style="margin-top: 5px; font-size: 12px; color: #999;">Generated on: ${new Date(CURRENT_TIMESTAMP).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
          <p style="margin-top: 5px; font-size: 12px; color: #999;">Generated by: ${CURRENT_USER}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateCancellationEmailHtml(emailData: EmailData): string {
  const { booking } = emailData;
  const departureDate = new Date(booking.flight.departure_time).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata'
  });
  
  const arrivalDate = new Date(booking.flight.arrival_time).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata'
  });

  const cancellationDate = new Date(CURRENT_TIMESTAMP).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  return `
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
          <p style="margin: 5px 0;"><strong>Flight Tracking ID:</strong> <code style="background: #fff; padding: 2px 4px; border: 1px solid #ddd; word-break: break-all;">${booking.flight.id}</code></p>
          <p style="margin: 5px 0;"><strong>Status:</strong> Cancelled</p>
          <p style="margin: 5px 0;"><strong>Cancellation Date:</strong> ${cancellationDate}</p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #dc3545; margin-bottom: 15px; font-size: 20px;">Cancelled Flight Details</h2>
          <p style="margin: 5px 0;"><strong>Flight:</strong> ${booking.flight.airline} ${booking.flight.flight_number}</p>
          <p style="margin: 5px 0;"><strong>From:</strong> ${booking.flight.origin.city} (${booking.flight.origin.code})</p>
          <p style="margin: 5px 0;"><strong>To:</strong> ${booking.flight.destination.city} (${booking.flight.destination.code})</p>
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
          <p style="margin-top: 5px; font-size: 12px; color: #999;">Generated on: ${new Date(CURRENT_TIMESTAMP).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
          <p style="margin-top: 5px; font-size: 12px; color: #999;">Cancelled by: ${CURRENT_USER}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}