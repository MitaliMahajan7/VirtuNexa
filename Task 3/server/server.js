const WebSocket = require('ws');
const http = require('http');
const express = require('express');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const rooms = new Map();

wss.on('connection', (ws) => {
    let currentUser = null;
    let currentRoom = null;

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        switch (data.type) {
            case 'join':
                handleJoin(ws, data);
                break;
            case 'message':
                broadcastMessage(data);
                break;
        }
    });

    function handleJoin(ws, data) {
        currentUser = data.user;
        currentRoom = data.room;

        if (!rooms.has(currentRoom)) {
            rooms.set(currentRoom, new Set());
        }
        
        rooms.get(currentRoom).add(currentUser);
        broadcastUsers();
        broadcastSystemMessage(`${currentUser} joined the room`);
    }

    function broadcastUsers() {
        const users = Array.from(rooms.get(currentRoom));
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'users',
                    users: users
                }));
            }
        });
    }

    function broadcastMessage(data) {
        data.timestamp = Date.now();
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'message',
                    ...data
                }));
            }
        });
    }

    function broadcastSystemMessage(content) {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'system',
                    content: content
                }));
            }
        });
    }

    ws.on('close', () => {
        if (currentRoom && currentUser) {
            const roomUsers = rooms.get(currentRoom);
            if (roomUsers) {
                roomUsers.delete(currentUser);
                if (roomUsers.size === 0) {
                    rooms.delete(currentRoom);
                } else {
                    broadcastUsers();
                    broadcastSystemMessage(`${currentUser} left the room`);
                }
            }
        }
    });
});

server.listen(8080, () => {
    console.log('Server running on port 8080');
});