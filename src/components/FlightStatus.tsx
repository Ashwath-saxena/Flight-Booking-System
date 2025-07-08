// frontend/src/components/FlightStatus.tsx
'use client';

import { useState } from 'react';
import { useFlightStatus } from '@/hooks/useFlightStatus';
import { format } from 'date-fns';

interface FlightStatusProps {
  flightId: string;
  flightNumber?: string;
  showAdminControls?: boolean;
}

export default function FlightStatus({ flightId, flightNumber, showAdminControls = false }: FlightStatusProps) {
  const { status, isConnected, lastUpdate, error, updateFlightStatus } = useFlightStatus(flightId);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    delay: 0,
    gate: '',
    message: ''
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled': return 'text-green-600 bg-green-100';
      case 'boarding': return 'text-blue-600 bg-blue-100';
      case 'delayed': return 'text-yellow-600 bg-yellow-100';
      case 'in flight': return 'text-purple-600 bg-purple-100';
      case 'arrived': return 'text-gray-600 bg-gray-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateFlightStatus(updateForm);
    setShowUpdateForm(false);
    setUpdateForm({ status: '', delay: 0, gate: '', message: '' });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">
          Real-time Flight Status {flightNumber && `- ${flightNumber}`}
        </h3>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {status ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status.status)}`}>
              {status.status}
            </span>
            <span className="text-gray-600">{status.message}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Estimated Departure:</span>
              <div className="text-gray-600">
                {format(new Date(status.estimatedDeparture), 'MMM d, yyyy • h:mm a')}
                {status.delay && status.delay > 0 && (
                  <span className="text-red-600 ml-2">(+{status.delay} min delay)</span>
                )}
              </div>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Estimated Arrival:</span>
              <div className="text-gray-600">
                {format(new Date(status.estimatedArrival), 'MMM d, yyyy • h:mm a')}
              </div>
            </div>

            {status.gate && (
              <div>
                <span className="font-medium text-gray-700">Gate:</span>
                <div className="text-gray-600">{status.gate}</div>
              </div>
            )}
          </div>

          {lastUpdate && (
            <div className="text-xs text-gray-500 border-t pt-3">
              Last updated: {format(new Date(lastUpdate), 'MMM d, yyyy • h:mm:ss a')} UTC
              {status.updatedBy && ` by ${status.updatedBy}`}
            </div>
          )}
        </div>
      ) : (
        <div className="text-gray-500">Loading flight status...</div>
      )}

      {showAdminControls && (
        <div className="mt-6 pt-4 border-t">
          <button
            onClick={() => setShowUpdateForm(!showUpdateForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
          >
            {showUpdateForm ? 'Cancel Update' : 'Update Status'}
          </button>

          {showUpdateForm && (
            <form onSubmit={handleUpdateSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({...updateForm, status: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select status</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Boarding">Boarding</option>
                  <option value="Delayed">Delayed</option>
                  <option value="In Flight">In Flight</option>
                  <option value="Arrived">Arrived</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Delay (minutes)</label>
                  <input
                    type="number"
                    value={updateForm.delay}
                    onChange={(e) => setUpdateForm({...updateForm, delay: Number(e.target.value)})}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Gate</label>
                  <input
                    type="text"
                    value={updateForm.gate}
                    onChange={(e) => setUpdateForm({...updateForm, gate: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="e.g., A12"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Message</label>
                <input
                  type="text"
                  value={updateForm.message}
                  onChange={(e) => setUpdateForm({...updateForm, message: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="Custom status message"
                  required
                />
              </div>

              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
              >
                Update Status
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}