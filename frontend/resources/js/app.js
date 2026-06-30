/* ── QWebChannel bridge ── */
let ipc = null;
let notifications = null;
let activeChat = null;
let chats = {};
let messages = {};
let replyToMessage = null;
let typingTimeout = null;

function init() {
    new QWebChannel(qt.webChannelTransport, function(channel) {
        ipc = channel.objects.ipc;
        notifications = channel.objects.notifications;

        ipc.eventReceived.connect(onEvent);
        ipc.connected.connect(() => {
            setConnStatus(true);
            ipc.sendCommand('check_login');
        });
        ipc.disconnected.connect(() => setConnStatus(false));

        document.getElementById('btn-login').addEventListener('click', requestQR);
        document.getElementById('btn-logout').addEventListener('click', logout);
        document.getElementById('btn-compose').addEventListener('click', showComposeModal);
        document.getElementById('btn-compose-cancel').addEventListener('click', hideComposeModal);
        document.getElementById('btn-compose-start').addEventListener('click', startNewChat);
        document.getElementById('btn-send').addEventListener('click', sendMessage);
        document.getElementById('msg-input').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
        document.getElementById('msg-input').addEventListener('input', function() {
            document.getElementById('btn-send').disabled = !this.value.trim();
            if (activeChat) {
                ipc.sendCommand('chat_presence', { jid: activeChat, state: 'composing' });
                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                    ipc.sendCommand('chat_presence', { jid: activeChat, state: 'paused' });
                }, 2000);
            }
        });
        document.getElementById('compose-input').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') startNewChat();
        });
    });
}

document.addEventListener('DOMContentLoaded', init);

/* ── page navigation ── */
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function setConnStatus(ok) {
    const el = document.getElementById('connection-status');
    el.textContent = ok ? 'Connected' : 'Disconnected';
    el.className = ok ? 'bar-connected' : 'bar-disconnected';
}

/* ── login ── */
function requestQR() {
    ipc.sendCommand('login');
    setStatus('Requesting QR code...');
    document.getElementById('btn-login').disabled = true;
}

function setStatus(msg) {
    document.getElementById('login-status').textContent = msg;
}

function showQR(code) {
    const canvas = document.getElementById('qr-canvas');
    const placeholder = document.getElementById('qr-placeholder');
    canvas.style.display = 'block';
    placeholder.style.display = 'none';

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
    };
    img.src = code;

    setStatus('Scan the QR code with WhatsApp on your phone');
}

/* ── logout ── */
function logout() {
    ipc.sendCommand('logout');
    activeChat = null;
    chats = {};
    messages = {};
    document.getElementById('chat-list').innerHTML = '';
    document.getElementById('message-list').innerHTML = '';
    showPage('page-login');
}

/* ── receiving events ── */
function onEvent(event) {
    const type = event.type;
    const p = event.payload || {};

    switch (type) {
        case 'qr':
            showQR(p.code);
            break;
        case 'require_login':
            showPage('page-login');
            break;
        case 'login_ok':
            showPage('page-main');
            document.getElementById('btn-login').disabled = false;
            ipc.sendCommand('get_chats');
            break;
        case 'message':
            if (!p.text) break;
            addMessage(p.chat_jid, p.sender, p.text, p.timestamp, p.is_from_me, p.id, p.reply_to);
            if (!p.is_from_me && notifications)
                notifications.showNotification(p.sender || 'Unknown', p.text);
            break;
        case 'chat_presence':
            if (p.chat_jid === activeChat && p.sender && p.sender !== 'me') {
                const header = document.getElementById('chat-header');
                const chat = chats[activeChat];
                const name = chat ? chat.display_name || formatJid(activeChat) : formatJid(activeChat);
                if (p.state === 'composing') {
                    header.innerHTML = escapeHtml(name) + ' <span class="typing">typing...</span>';
                } else {
                    header.textContent = name;
                }
            }
            break;
        case 'chats':
            renderChats(p);
            break;
        case 'connected':
            setConnStatus(true);
            break;
        case 'disconnected':
            setConnStatus(false);
            break;
        case 'logged_out':
            logout();
            break;
        case 'error':
            console.error('Backend error:', p.message);
            setStatus('Error: ' + p.message);
            break;
    }
}

/* ── messages ── */
function addMessage(chatJid, sender, text, ts, isFromMe, id, replyId) {
    if (!messages[chatJid]) messages[chatJid] = [];
    messages[chatJid].push({ id, sender, text, ts, isFromMe, replyId });

    if (!chats[chatJid]) {
        const dummyChat = { jid: chatJid, display_name: formatJid(sender || chatJid) };
        chats[chatJid] = dummyChat;
        
        const el = document.getElementById('chat-list');
        const item = document.createElement('div');
        item.className = 'chat-item';
        item.dataset.jid = chatJid;
        const displayName = dummyChat.display_name;
        item.innerHTML = '<div class="chat-avatar">' + (displayName[0] ? displayName[0].toUpperCase() : '?') + '</div><div class="chat-info"><div class="chat-name">' + escapeHtml(displayName) +
            '</div><div class="chat-preview">' + escapeHtml(text) + '</div></div>';
        item.addEventListener('click', () => selectChat(chatJid));
        
        if (el.firstChild) {
            el.insertBefore(item, el.firstChild);
        } else {
            el.appendChild(item);
        }
    }

    if (chatJid === activeChat) renderMessages(chatJid);
    updateChatPreview(chatJid, text, ts);
}

function renderMessages(chatJid) {
    const el = document.getElementById('message-list');
    el.innerHTML = '';
    const list = messages[chatJid] || [];
    list.forEach(m => {
        const div = document.createElement('div');
        div.className = 'msg ' + (m.isFromMe ? 'out' : 'in');
        div.dataset.id = m.id;
        div.dataset.sender = m.sender;
        div.dataset.text = m.text;
        
        let replyHtml = '';
        if (m.replyId) {
            // Find quoted message text or show generic
            let quoteText = "Message";
            const quoted = list.find(qm => qm.id === m.replyId);
            if (quoted) quoteText = quoted.text;
            replyHtml = '<div class="msg-reply-context"><div class="sender">Reply</div>' + escapeHtml(quoteText) + '</div>';
        }
        
        div.innerHTML = replyHtml + '<div class="bubble">' + escapeHtml(m.text) +
            '</div><div class="time">' + formatTime(m.ts) + '</div>' + 
            '<div class="msg-actions"><button class="btn-reply" onclick="setReply(this.parentElement.parentElement)">Reply</button></div>';
        el.appendChild(div);
    });
    el.scrollTop = el.scrollHeight;
}

/* ── chats ── */
function renderChats(chatList) {
    const el = document.getElementById('chat-list');
    el.innerHTML = '';
    chatList.forEach(c => {
        chats[c.jid] = c;
        const item = document.createElement('div');
        item.className = 'chat-item' + (c.jid === activeChat ? ' active' : '');
        item.dataset.jid = c.jid;
        item.innerHTML = '<div class="chat-avatar">' + (c.display_name ? c.display_name[0].toUpperCase() : '?') +
            '</div><div class="chat-info"><div class="chat-name">' + escapeHtml(c.display_name || formatJid(c.jid)) +
            '</div><div class="chat-preview"></div></div>';
        item.addEventListener('click', () => selectChat(c.jid));
        el.appendChild(item);
    });
}

function selectChat(jid) {
    activeChat = jid;
    document.querySelectorAll('.chat-item').forEach(el => {
        el.classList.toggle('active', el.dataset.jid === jid);
    });
    const chat = chats[jid];
    document.getElementById('chat-header').textContent = chat ? (chat.display_name || formatJid(jid)) : formatJid(jid);
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('chat-view').style.display = 'flex';
    document.getElementById('msg-input').focus();
    renderMessages(jid);
}

function updateChatPreview(chatJid, text, ts) {
    const items = document.querySelectorAll('.chat-item');
    for (const item of items) {
        if (item.dataset.jid === chatJid) {
            const preview = item.querySelector('.chat-preview');
            if (preview) preview.textContent = text;
            break;
        }
    }
}

/* ── send ── */
function sendMessage() {
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    if (!text || !activeChat) return;
    
    let payload = { jid: activeChat, message: text };
    let replyIdForLocal = null;
    if (replyToMessage) {
        payload.reply_to = replyToMessage.id;
        payload.reply_participant = replyToMessage.sender;
        payload.reply_text = replyToMessage.text;
        replyIdForLocal = replyToMessage.id;
    }
    
    ipc.sendCommand('send_message', payload);
    
    // local echo
    addMessage(activeChat, 'me', text, Math.floor(Date.now() / 1000), true, 'local-' + Date.now(), replyIdForLocal);
    
    input.value = '';
    document.getElementById('btn-send').disabled = true;
    cancelReply();
    
    clearTimeout(typingTimeout);
    ipc.sendCommand('chat_presence', { jid: activeChat, state: 'paused' });
}

/* ── helpers ── */
function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts * 1000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatJid(jid) {
    if (!jid) return '';
    return jid.split('@')[0];
}

function setReply(msgDiv) {
    replyToMessage = {
        id: msgDiv.dataset.id,
        sender: msgDiv.dataset.sender,
        text: msgDiv.dataset.text
    };
    const banner = document.getElementById('reply-banner');
    banner.style.display = 'flex';
    document.getElementById('reply-text').textContent = replyToMessage.text;
    document.getElementById('msg-input').focus();
}

function cancelReply() {
    replyToMessage = null;
    const banner = document.getElementById('reply-banner');
    if (banner) banner.style.display = 'none';
}

/* ── compose ── */
function showComposeModal() {
    document.getElementById('compose-modal').style.display = 'flex';
    document.getElementById('compose-input').focus();
}

function hideComposeModal() {
    document.getElementById('compose-modal').style.display = 'none';
    document.getElementById('compose-input').value = '';
}

function startNewChat() {
    const input = document.getElementById('compose-input').value.trim();
    if (!input) return;
    
    let jid = input;
    if (!jid.includes('@')) {
        jid = jid.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    }
    
    hideComposeModal();
    
    if (!chats[jid]) {
        const dummyChat = { jid: jid, display_name: input };
        chats[jid] = dummyChat;
        
        const el = document.getElementById('chat-list');
        const item = document.createElement('div');
        item.className = 'chat-item';
        item.dataset.jid = jid;
        item.innerHTML = '<div class="chat-avatar">' + input[0].toUpperCase() + '</div><div class="chat-info"><div class="chat-name">' + escapeHtml(formatJid(jid)) +
            '</div><div class="chat-preview">New chat</div></div>';
        item.addEventListener('click', () => selectChat(jid));
        
        if (el.firstChild) {
            el.insertBefore(item, el.firstChild);
        } else {
            el.appendChild(item);
        }
    }
    
    selectChat(jid);
}
