const ws = new WebSocket('ws://localhost:8080');
let currentUser = '';
let currentRoom = '';

const elements = {
    username: document.getElementById('username'),
    room: document.getElementById('room'),
    joinBtn: document.getElementById('join-btn'),
    messageForm: document.getElementById('message-form'),
    messageInput: document.getElementById('message-input'),
    messages: document.getElementById('messages'),
    usersList: document.getElementById('users-list')
};

// Join room handler
elements.joinBtn.addEventListener('click', (e) => {
    e.preventDefault();
    currentUser = elements.username.value.trim();
    currentRoom = elements.room.value.trim();
    
    if (!currentUser || !currentRoom) {
        alert('Please fill in all fields');
        return;
    }
    
    ws.send(JSON.stringify({
        type: 'join',
        user: currentUser,
        room: currentRoom
    }));
    
    elements.messageInput.disabled = false;
    elements.messageForm.querySelector('button').disabled = false;
});

// Message submission
elements.messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = elements.messageInput.value.trim();
    
    if (message) {
        ws.send(JSON.stringify({
            type: 'message',
            user: currentUser,
            room: currentRoom,
            content: message
        }));
        elements.messageInput.value = '';
    }
});

// WebSocket handlers
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
        case 'message':
            appendMessage(data);
            break;
        case 'users':
            updateUsersList(data.users);
            break;
        case 'system':
            appendSystemMessage(data.content);
            break;
    }
};

function appendMessage(data) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${data.user === currentUser ? 'own-message' : ''}`;
    messageDiv.innerHTML = `
        <strong>${data.user}</strong>
        <p>${data.content}</p>
        <small>${new Date(data.timestamp).toLocaleTimeString()}</small>
    `;
    elements.messages.appendChild(messageDiv);
    elements.messages.scrollTop = elements.messages.scrollHeight;
}

function appendSystemMessage(content) {
    const systemDiv = document.createElement('div');
    systemDiv.className = 'message system';
    systemDiv.textContent = content;
    elements.messages.appendChild(systemDiv);
}

function updateUsersList(users) {
    elements.usersList.innerHTML = users
        .map(user => `<li>${user}</li>`)
        .join('');
}