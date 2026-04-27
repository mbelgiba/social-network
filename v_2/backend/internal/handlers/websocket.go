package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"social-network/internal/middleware"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type WsManager struct {
	clients map[string]*websocket.Conn
	mutex   sync.Mutex
	DB      *sql.DB
}

func NewWsManager(db *sql.DB) *WsManager {
	return &WsManager{
		clients: make(map[string]*websocket.Conn),
		DB:      db,
	}
}

type ChatMessage struct {
	Type       string    `json:"type"`
	ID         string    `json:"id,omitempty"`
	SenderID   string    `json:"sender_id,omitempty"`
	ReceiverID string    `json:"receiver_id,omitempty"`
	Content    string    `json:"content,omitempty"`
	CreatedAt  time.Time `json:"created_at,omitempty"`
}

func (m *WsManager) broadcastStatus(userID string, status string) {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	msg := ChatMessage{Type: status, SenderID: userID}
	for _, ws := range m.clients {
		ws.WriteJSON(msg)
	}
}

func (m *WsManager) HandleConnections(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	m.mutex.Lock()
	m.clients[userID] = ws
	m.mutex.Unlock()

	m.broadcastStatus(userID, "online")

	defer func() {
		m.mutex.Lock()
		delete(m.clients, userID)
		ws.Close()
		m.mutex.Unlock()
		m.broadcastStatus(userID, "offline")
	}()

	for {
		var msg ChatMessage
		if err := ws.ReadJSON(&msg); err != nil {
			break
		}

		if msg.Type == "typing" {
			msg.SenderID = userID
			m.mutex.Lock()
			if receiverWs, ok := m.clients[msg.ReceiverID]; ok {
				receiverWs.WriteJSON(msg)
			}
			m.mutex.Unlock()
			continue
		}

		msg.Type = "message"
		msg.ID = uuid.New().String()
		msg.SenderID = userID
		msg.CreatedAt = time.Now()

		m.DB.Exec("INSERT INTO messages (id, sender_id, receiver_id, content, created_at) VALUES (?, ?, ?, ?, ?)", msg.ID, msg.SenderID, msg.ReceiverID, msg.Content, msg.CreatedAt)

		m.mutex.Lock()
		if receiverWs, ok := m.clients[msg.ReceiverID]; ok {
			receiverWs.WriteJSON(msg)
		}
		ws.WriteJSON(msg)
		m.mutex.Unlock()
	}
}

func (m *WsManager) GetOnlineUsers(w http.ResponseWriter, r *http.Request) {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	var online []string
	for id := range m.clients {
		online = append(online, id)
	}
	json.NewEncoder(w).Encode(online)
}

func (m *WsManager) GetHistory(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	otherUserID := r.URL.Query().Get("user_id")

	rows, _ := m.DB.Query("SELECT id, sender_id, receiver_id, content, created_at FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at ASC", userID, otherUserID, otherUserID, userID)
	defer rows.Close()

	var messages []ChatMessage
	for rows.Next() {
		var msg ChatMessage
		if err := rows.Scan(&msg.ID, &msg.SenderID, &msg.ReceiverID, &msg.Content, &msg.CreatedAt); err == nil {
			msg.Type = "message"
			messages = append(messages, msg)
		}
	}
	json.NewEncoder(w).Encode(messages)
}
