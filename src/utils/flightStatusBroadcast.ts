// Utility for broadcasting flight status updates
interface FlightUpdate {
  status?: string;
  delay?: number;
  gate?: string;
  message?: string;
  timestamp: string;
  updatedBy: string;
}

// Store active connections
const connections = new Map<string, ReadableStreamDefaultController>();

export function addConnection(connectionId: string, controller: ReadableStreamDefaultController) {
  connections.set(connectionId, controller);
}

export function removeConnection(connectionId: string) {
  connections.delete(connectionId);
}

export function broadcastFlightUpdate(flightId: string, update: FlightUpdate) {
  const message = `data: ${JSON.stringify({
    type: 'flight_update',
    flightId: flightId,
    update: update,
    timestamp: '2025-07-07 08:33:03',
    updatedBy: 'Ashwath-saxena'
  })}\n\n`;
  
  const encodedMessage = new TextEncoder().encode(message);
  
  // Send to all relevant connections
  connections.forEach((controller, connectionId) => {
    if (connectionId.includes(flightId) || connectionId.includes('all')) {
      try {
        controller.enqueue(encodedMessage);
      } catch (error) {
        console.error('Error sending update to connection:', error);
        connections.delete(connectionId);
      }
    }
  });
}