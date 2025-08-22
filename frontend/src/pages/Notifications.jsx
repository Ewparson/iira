// src/pages/Notifications.jsx
import React, { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function Notifications() {
  const [status, setStatus] = useState({ kyc_submitted: false, kyc_status: '' });
  const [messages, setMessages] = useState([]);

  const getTokenHdr = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  useEffect(() => {
    // Fetch user KYC status
    fetch(`${API_URL}/api/user/status`, { headers: getTokenHdr() })
      .then(res => res.json())
      .then(data => {
        setStatus({
          kyc_submitted: data.kyc_submitted,
          kyc_status: data.kyc_status,
        });
      })
      .catch(console.error);

    // Fetch inbox messages
    fetch(`${API_URL}/api/mail/inbox`, { headers: getTokenHdr() })
      .then(res => res.json())
      .then(data => setMessages(data.inbox || []))
      .catch(console.error);
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 text-text">
      <h1 className="text-2xl font-bold mb-6">Notifications &amp; Account Status</h1>

      {status.kyc_submitted && status.kyc_status === 'pending' && (
        <div className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded">
          <h2 className="text-lg font-semibold">KYC Pending</h2>
          <p className="mt-1">
            We’ve received your documents and they’re under review. You’ll be notified once verification completes.
          </p>
        </div>
      )}

      {messages.length > 0 ? (
        messages.map(msg => (
          <div key={msg.id} className="mb-4 p-4 bg-surface rounded shadow">
            <div className="flex justify-between mb-1 text-xs text-gray-500">
              <span>{new Date(msg.timestamp).toLocaleString()}</span>
              <span>{msg.read ? 'Read' : 'Unread'}</span>
            </div>
            <h3 className="text-md font-semibold text-primary">{msg.subject || '(No subject)'}</h3>
            <p className="mt-2 text-gray-300">{msg.body}</p>
          </div>
        ))
      ) : (
        <p className="text-gray-400">No messages at this time.</p>
      )}
    </div>
  );
}
