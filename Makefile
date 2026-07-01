.PHONY: build run dev clean frontend

frontend:
	cd frontend && npm install && npm run build

build: frontend
	go build -o perfumeria.exe .

run: build
	.\perfumeria.exe

dev:
	@echo "Backend: go run ."
	@echo "Frontend: cd frontend && npm run dev"
	@echo "Abrir http://localhost:5173"

clean:
	rm -f perfumeria.exe
	rm -rf frontend/dist
	rm -f *.db *.db-wal *.db-shm
