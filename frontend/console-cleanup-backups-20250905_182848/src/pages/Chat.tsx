// === Chat.tsx - Chat Page Component ===
import React from 'react';
import ChatWindow from '../components/chat/ChatWindow';
import { useSafeAuth } from '../SafeAuthContext';

const Chat: React.FC = () => {
  const { state } = useSafeAuth();

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        
        {/* Header */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ margin: 0, color: '#333' }}>
            💬 Real-time Chat
          </h1>
          <p style={{ margin: '8px 0 0', color: '#666', fontSize: '14px' }}>
            Connect with other players in real-time
          </p>
        </div>

        {/* Chat Interface */}
        <div style={{
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap'
        }}>
          
          {/* Main Chat */}
          <div style={{ 
            flex: 1, 
            minWidth: '400px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <ChatWindow 
              roomId="global_chat"
              height="600px"
            />
          </div>

          {/* Sidebar - Chat Info */}
          <div style={{
            width: '300px',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            alignSelf: 'flex-start'
          }}>
            <h3 style={{ margin: '0 0 16px', color: '#333' }}>
              Chat Information
            </h3>
            
            {state.isAuthenticated ? (
              <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
                <div style={{ marginBottom: '12px' }}>
                  <strong>Logged in as:</strong><br />
                  {state.user?.username || 'Unknown'}
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <strong>Room:</strong><br />
                  Global Chat
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <strong>Features:</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                    <li>Real-time messaging</li>
                    <li>Auto-reconnection</li>
                    <li>Message history</li>
                    <li>User presence</li>
                  </ul>
                </div>

                <div style={{ 
                  marginTop: '20px', 
                  padding: '12px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  <strong>Tips:</strong><br />
                  • Messages are limited to 500 characters<br />
                  • Be respectful to other players<br />
                  • Connection status is shown in the header
                </div>
              </div>
            ) : (
              <div style={{ 
                padding: '20px',
                textAlign: 'center',
                color: '#666',
                fontSize: '14px'
              }}>
                <p>Please log in to use the chat feature</p>
              </div>
            )}
          </div>
          
        </div>

        {/* Debug Information (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <h4 style={{ margin: '0 0 8px', color: '#856404' }}>
              🔧 Development Debug Info
            </h4>
            <div style={{ fontSize: '12px', color: '#856404', fontFamily: 'monospace' }}>
              <div>API URL: {process.env.REACT_APP_API_URL || 'default'}</div>
              <div>WebSocket URL: {process.env.REACT_APP_WEBSOCKET_URL || 'auto-detected'}</div>
              <div>User ID: {state.user?.id || 'not logged in'}</div>
              <div>Auth Status: {state.isAuthenticated ? 'authenticated' : 'not authenticated'}</div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default Chat;