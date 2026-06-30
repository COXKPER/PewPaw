package database

import "time"

type Session struct {
	ID        int64     `json:"id"`
	JID       string    `json:"jid"`
	DeviceID  int       `json:"device_id"`
	Token     []byte    `json:"-"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Contact struct {
	JID      string `json:"jid"`
	Name     string `json:"name"`
	PushName string `json:"push_name"`
	Verified bool   `json:"verified"`
}

type Chat struct {
	JID           string `json:"jid"`
	DisplayName   string `json:"display_name"`
	UnreadCount   int    `json:"unread_count"`
	LastMessage   string `json:"last_message,omitempty"`
	LastTimestamp int64  `json:"last_timestamp"`
	Archived      bool   `json:"archived"`
	MutedUntil    int64  `json:"muted_until"`
}

type Message struct {
	ID          string `json:"id"`
	ChatJID     string `json:"chat_jid"`
	SenderJID   string `json:"sender_jid"`
	Content     string `json:"content"`
	MessageType string `json:"message_type"`
	Timestamp   int64  `json:"timestamp"`
	IsFromMe    bool   `json:"is_from_me"`
	IsRead      bool   `json:"is_read"`
	MediaPath   string `json:"media_path,omitempty"`
	QuotedMsgID string `json:"quoted_msg_id,omitempty"`
}
