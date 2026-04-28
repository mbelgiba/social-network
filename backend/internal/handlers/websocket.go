package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"social-network/backend/internal/middleware"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Разрешаем соединения с фронтенда
	},
}

type WsManager struct {
	DB      *sql.DB
	Clients map[string]*websocket.Conn // userID -> connection
	Mu      sync.Mutex
}

func NewWsManager(db *sql.DB) *WsManager {
	return &WsManager{
		DB:      db,
		Clients: make(map[string]*websocket.Conn),
	}
}

type WsMessage struct {
	Type       string `json:"type"` // "message", "typing", "online", "offline"
	ID         string `json:"id,omitempty"`
	SenderID   string `json:"sender_id"`
	ReceiverID string `json:"receiver_id"`
	Content    string `json:"content"`
	CreatedAt  string `json:"created_at"`
}

func (m *WsManager) HandleConnections(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WS Upgrade Error: %v", err)
		return
	}

	m.Mu.Lock()
	m.Clients[userID] = conn
	m.Mu.Unlock()

	// Оповещаем всех, что узел вошел в сеть
	m.BroadcastStatus(userID, "online")

	defer func() {
		m.Mu.Lock()
		delete(m.Clients, userID)
		m.Mu.Unlock()
		m.BroadcastStatus(userID, "offline")
		conn.Close()
	}()

	for {
		var msg WsMessage
		err := conn.ReadJSON(&msg)
		if err != nil {
			break
		}

		msg.SenderID = userID
		msg.CreatedAt = time.Now().Format(time.RFC3339)

		if msg.Type == "message" {
			msg.ID = uuid.New().String()
			// Сохраняем в БД
			_, err := m.DB.Exec("INSERT INTO messages (id, sender_id, receiver_id, content, created_at) VALUES (?, ?, ?, ?, ?)",
				msg.ID, msg.SenderID, msg.ReceiverID, msg.Content, msg.CreatedAt)
			if err != nil {
				log.Printf("DB Message Error: %v", err)
				continue
			}
			m.SendMessage(msg.ReceiverID, msg)
			m.SendMessage(userID, msg) // Отправляем и себе для синхронизации
		} else if msg.Type == "typing" {
			m.SendMessage(msg.ReceiverID, msg)
		}
	}
}

func (m *WsManager) SendMessage(targetID string, msg WsMessage) {
	m.Mu.Lock()
	defer m.Mu.Unlock()
	if conn, ok := m.Clients[targetID]; ok {
		conn.WriteJSON(msg)
	}
}

func (m *WsManager) BroadcastStatus(userID string, status string) {
	m.Mu.Lock()
	defer m.Mu.Unlock()
	msg := WsMessage{
		Type:     status,
		SenderID: userID,
	}
	for _, conn := range m.Clients {
		conn.WriteJSON(msg)
	}
}

func (m *WsManager) GetOnlineUsers(w http.ResponseWriter, r *http.Request) {
	m.Mu.Lock()
	defer m.Mu.Unlock()
	online := []string{}
	for id := range m.Clients {
		online = append(online, id)
	}
	json.NewEncoder(w).Encode(online)
}

func (m *WsManager) GetHistory(w http.ResponseWriter, r *http.Request) {
	currentUserID := r.Context().Value(middleware.UserIDKey).(string)
	targetID := r.URL.Query().Get("user_id")

	rows, err := m.DB.Query(`
		SELECT id, sender_id, receiver_id, content, created_at 
		FROM messages 
		WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
		ORDER BY created_at ASC`, currentUserID, targetID, targetID, currentUserID)

	if err != nil {
		http.Error(w, "History retrieval failed", 500)
		return
	}
	defer rows.Close()

	var history []WsMessage
	for rows.Next() {
		var msg WsMessage
		if err := rows.Scan(&msg.ID, &msg.SenderID, &msg.ReceiverID, &msg.Content, &msg.CreatedAt); err == nil {
			msg.Type = "message"
			history = append(history, msg)
		}
	}
	json.NewEncoder(w).Encode(history)
}