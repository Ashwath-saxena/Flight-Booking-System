// frontend/src/components/AuthDebug.tsx
'use client';

import { useAuth } from '../contexts/AuthContext';

export default function AuthDebug() {
  const { user, session, loading } = useAuth();

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-gray-800 text-white rounded-lg text-sm">
      <p>Loading: {loading ? 'true' : 'false'}</p>
      <p>User: {user ? user.email : 'null'}</p>
      <p>Session: {session ? 'active' : 'null'}</p>
    </div>
  );
}