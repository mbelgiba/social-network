package sqlite

import (
	"database/sql"

	// SQLite драйверін импорттаймыз.
	// Алдында "_" (астын сызу) тұруы бұл пакеттің тек инициализация үшін (init() функциясы)
	// қажет екенін, бірақ кодта тікелей шақырылмайтынын білдіреді.
	_ "github.com/mattn/go-sqlite3"
)

// InitDB деректер қорына қосылуды іске қосады
func InitDB(dataSourceName string) (*sql.DB, error) {
	// .db файлымен байланыс орнатамыз
	db, err := sql.Open("sqlite3", dataSourceName)
	if err != nil {
		return nil, err
	}

	// Байланыстың шынымен орнатылғанын тексеру үшін Ping жасаймыз
	if err = db.Ping(); err != nil {
		return nil, err
	}

	return db, nil
}
