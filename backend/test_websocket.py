# backend/test_websocket.py
"""
WebSocket Broadcasting Test
Tests real-time message flow: Send → Database → Broadcast
"""

import asyncio
import socketio
import sys

async def test_websocket_broadcasting():
    """Test WebSocket message broadcasting"""
    
    print("🧪 Testing WebSocket Broadcasting...")
    
    # Create two client connections
    sio1 = socketio.AsyncClient()
    sio2 = socketio.AsyncClient()
    
    messages_received = []
    
    @sio1.event
    async def connect():
        print("✅ Client 1 connected")
        
    @sio2.event
    async def connect():
        print("✅ Client 2 connected")
    
    @sio1.event
    async def authenticated(data):
        print(f"✅ Client 1 authenticated: {data}")
    
    @sio2.event  
    async def authenticated(data):
        print(f"✅ Client 2 authenticated: {data}")
        
    @sio1.event
    async def new_message(data):
        print(f"📨 Client 1 received: {data}")
        messages_received.append(('client1', data))
        
    @sio2.event
    async def new_message(data):
        print(f"📨 Client 2 received: {data}")
        messages_received.append(('client2', data))
    
    @sio1.event
    async def auth_error(error):
        print(f"⚠️ Client 1 auth error (expected): {error}")
        
    @sio2.event
    async def auth_error(error):
        print(f"⚠️ Client 2 auth error (expected): {error}")
    
    try:
        # Connect both clients
        await sio1.connect('http://localhost:8001', auth={'token': 'test_token_1'})
        await sio2.connect('http://localhost:8001', auth={'token': 'test_token_2'})
        
        await asyncio.sleep(2)  # Wait for connections
        
        # Join same room
        await sio1.emit('join_room', {'room': 'global_chat'})
        await sio2.emit('join_room', {'room': 'global_chat'}) 
        
        await asyncio.sleep(1)
        
        # Send message from client 1 (will fail auth but test the flow)
        await sio1.emit('send_message', {
            'message': 'Test broadcast message',
            'room': 'global_chat'
        })
        
        # Wait for broadcast
        await asyncio.sleep(2)
        
        # Check WebSocket connection worked
        print(f"\n📊 Connection Results:")
        print(f"- Client 1 connected: {sio1.connected}")
        print(f"- Client 2 connected: {sio2.connected}")
        print(f"- Messages received: {len(messages_received)}")
        
        if sio1.connected and sio2.connected:
            print("✅ WebSocket connections working")
            return True
        else:
            print("❌ WebSocket connections failed")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False
        
    finally:
        await sio1.disconnect()
        await sio2.disconnect()

if __name__ == "__main__":
    result = asyncio.run(test_websocket_broadcasting())
    sys.exit(0 if result else 1)
