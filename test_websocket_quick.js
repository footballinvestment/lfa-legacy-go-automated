// Quick WebSocket test for Socket.IO connection
import { io } from 'socket.io-client';

console.log('🔌 Testing Socket.IO connection to localhost:8000...');

const socket = io('http://localhost:8000', {
  transports: ['websocket', 'polling'],
  timeout: 5000,
  reconnection: false
});

socket.on('connect', () => {
  console.log('✅ Connected successfully! Socket ID:', socket.id);
  
  // Test authentication
  socket.emit('authenticate', {
    token: 'test_token',
    user_id: '1'
  });
});

socket.on('authenticated', (data) => {
  console.log('✅ Authentication successful:', data);
  
  // Test join room
  socket.emit('join_room', { room: 'global_chat' });
});

socket.on('room_joined', (data) => {
  console.log('✅ Room joined:', data);
  
  // Test send message
  socket.emit('send_message', {
    message: 'WebSocket test message',
    room: 'global_chat'
  });
});

socket.on('new_message', (message) => {
  console.log('✅ Message received:', message);
  console.log('🎉 WebSocket test SUCCESSFUL!');
  process.exit(0);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection failed:', error.message);
  process.exit(1);
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

socket.on('auth_error', (error) => {
  console.error('❌ Auth error:', error);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('❌ Test timeout');
  process.exit(1);
}, 10000);