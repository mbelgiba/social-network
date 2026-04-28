package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/google/uuid"
)

func UploadFile(w http.ResponseWriter, r *http.Request) {
	r.ParseMultipartForm(10 << 20) // 10MB
	file, handler, err := r.FormFile("image")
	if err != nil {
		return
	}
	defer file.Close()

	os.MkdirAll("uploads", os.ModePerm)
	filename := uuid.New().String() + filepath.Ext(handler.Filename)
	dst, _ := os.Create("uploads/" + filename)
	defer dst.Close()
	io.Copy(dst, file)

	json.NewEncoder(w).Encode(map[string]string{"url": "http://localhost:8080/uploads/" + filename})
}
