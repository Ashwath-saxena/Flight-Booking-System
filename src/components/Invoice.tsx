// frontend/src/components/invoice.tsx
'use client';

import { format } from 'date-fns';

type InvoiceProps = {
  bookingId: string;
  bookingDate: string;
  passengerCount: number;
  totalAmount: number;
  paymentMethod?: string;
  userEmail?: string;
};

export default function Invoice({
  bookingId,
  bookingDate,
  passengerCount,
  totalAmount,
  paymentMethod = "Credit Card",
  userEmail = "customer@example.com"
}: InvoiceProps) {
  const printInvoice = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden print:shadow-none print:border">
      <div className="flex justify-between items-center p-6 border-b">
        <h2 className="text-xl font-bold">Invoice</h2>
        <button 
          onClick={printInvoice}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors print:hidden"
        >
          Print
        </button>
      </div>
      
      <div className="p-6">
        <div className="mb-8 flex justify-between">
          <div>
            <div className="text-lg font-bold mb-1">Flight Booker</div>
            <div className="text-gray-600">123 Aviation Way</div>
            <div className="text-gray-600">Flight City, FC 12345</div>
            <div className="text-gray-600">support@flightbooker.com</div>
          </div>
          
          <div className="text-right">
            <div className="text-gray-600">Invoice #</div>
            <div className="font-medium">{bookingId.substring(0, 8).toUpperCase()}</div>
            <div className="text-gray-600 mt-2">Date</div>
            <div>{formatDate(bookingDate)}</div>
          </div>
        </div>
        
        <div className="mb-8">
          <div className="font-bold mb-1">Billed To:</div>
          <div>{userEmail}</div>
        </div>
        
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Description</th>
              <th className="text-right py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-4">
                <div className="font-medium">Flight Booking</div>
                <div className="text-gray-600">
                  {passengerCount} {passengerCount === 1 ? 'Passenger' : 'Passengers'}
                </div>
              </td>
              <td className="text-right py-4">₹{totalAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="py-4 text-right font-bold">Total</td>
              <td className="text-right py-4 font-bold">₹{totalAmount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
        
        <div className="mb-8">
          <div className="font-bold mb-1">Payment Information:</div>
          <div>Payment Method: {paymentMethod}</div>
          <div>Transaction Date: {formatDate(bookingDate)}</div>
          <div>Status: Paid</div>
        </div>
        
        <div className="text-sm text-gray-600 text-center pt-6 border-t">
          <p>Thank you for your business!</p>
          <p>For any questions or concerns regarding this invoice, please contact our customer support.</p>
        </div>
      </div>
    </div>
  );
}