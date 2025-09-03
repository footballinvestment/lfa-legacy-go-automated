#!/usr/bin/env python3
# === WebSocket Connection Test ===

import asyncio
import socketio
import json
from datetime import datetime

async def test_websocket_connection():
    print("🔌 Testing WebSocket Connection")
    print("=" * 50)
    
    # Create a Socket.IO client
    sio = socketio.AsyncClient()
    
    # Define event handlers
    @sio.event
    async def connect():
        print("✅ Connected to WebSocket server")
        
        # Test authentication
        await sio.emit('authenticate', {
            'token': 'test_token',
            'user_id': 'test_user_123'
        })
    
    @sio.event
    async def disconnect():
        print("❌ Disconnected from WebSocket server")
    
    @sio.event
    async def authenticated(data):
        print(f"✅ Authentication successful: {data}")
        
        # Test joining global room
        await sio.emit('join_room', {'room': 'global_chat'})
        
        # Test sending a message
        await asyncio.sleep(1)
        await sio.emit('send_message', {
            'room': 'global_chat',
            'message': 'Hello from test script!',
            'username': 'TestUser'
        })
    
    @sio.event
    async def joined_room(data):
        print(f"🏠 Joined room: {data}")
    
    @sio.event
    async def new_message(data):
        print(f"💬 New message received: {data}")
    
    @sio.event
    async def error(data):
        print(f"❌ Error: {data}")
    
    @sio.event
    async def auth_error(data):
        print(f"🔐 Auth Error: {data}")
        
    # Connect to server
    try:
        await sio.connect('http://localhost:8000', socketio_path='/ws/socket.io/', transports=['websocket', 'polling'])
        print("🔌 Connection initiated...")
        
        # Keep connection alive for testing
        await asyncio.sleep(5)
        
        print("🧪 Test completed - disconnecting...")
        await sio.disconnect()
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    print(f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    asyncio.run(test_websocket_connection())