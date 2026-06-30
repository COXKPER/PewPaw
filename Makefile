.PHONY: all build build-backend build-frontend clean run-backend run-frontend \
        run tidy-backend install install-frontend install-services \
        uninstall uninstall-frontend help

BACKEND_DIR  := backend
FRONTEND_DIR := frontend
BUILD_DIR    := build

all: build

# ── Build ──────────────────────────────────────────────────────────

build: build-backend build-frontend

build-backend:
	@echo "  TIDY    backend"
	@command -v go >/dev/null 2>&1 || { echo "  ERROR   go not found (install from https://go.dev/dl/)"; exit 1; }
	@cd $(BACKEND_DIR) && go mod tidy
	@echo "  BUILD   backend"
	@cd $(BACKEND_DIR) && go build -o ../pewpawd .

build-frontend:
build-frontend:
	@echo "  BUILD   frontend"
	@command -v cmake >/dev/null 2>&1 || { echo "  ERROR   cmake not found (install with: sudo apt install cmake)"; exit 1; }
	@mkdir -p $(FRONTEND_DIR)/$(BUILD_DIR) && cd $(FRONTEND_DIR)/$(BUILD_DIR) && cmake .. && cmake --build .
	@cp $(FRONTEND_DIR)/$(BUILD_DIR)/pewpaw .

# ── Run ────────────────────────────────────────────────────────────

run-backend: build-backend
	@echo "  RUN     backend (pewpawd)"
	@sudo ./pewpawd

run-frontend: build-frontend
	@echo "  RUN     frontend (pewpaw)"
	@./pewpaw

run: build-backend build-frontend
	@echo "  RUN     backend + frontend"
	@sudo ./pewpawd & sleep 1 && ./pewpaw; kill %1 2>/dev/null

# ── Clean ──────────────────────────────────────────────────────────

clean:
	@echo "  CLEAN"
	@rm -f pewpawd pewpaw
	@rm -rf $(FRONTEND_DIR)/$(BUILD_DIR)
	@rm -f /var/lib/pewpaw/*.db /var/lib/pewpaw/*.db-wal /var/lib/pewpaw/*.db-shm 2>/dev/null; true
	@rm -f /var/run/pewpaw-listener.sock 2>/dev/null; true

# ── Utility ────────────────────────────────────────────────────────

tidy-backend:
	@cd $(BACKEND_DIR) && go mod tidy

install: build install-frontend install-services

install-frontend:
	@install -m 755 pewpaw /usr/local/bin/pewpaw
	@install -m 755 pewpawd /usr/local/bin/pewpawd
	@echo "  INSTALL pewpaw + pewpawd -> /usr/local/bin"

install-services:
	@echo "  INSTALL systemd service"
	@install -m 644 packaging/pewpawd.service /etc/systemd/system/pewpawd.service
	@systemctl daemon-reload
	@systemctl enable pewpawd.service
	@echo "  Start with: sudo systemctl start pewpawd"

uninstall: uninstall-frontend uninstall-services

uninstall-frontend:
	@rm -f /usr/local/bin/pewpaw /usr/local/bin/pewpawd

uninstall-services:
	@echo "  UNINSTALL systemd service"
	@systemctl stop pewpawd.service 2>/dev/null || true
	@systemctl disable pewpawd.service 2>/dev/null || true
	@rm -f /etc/systemd/system/pewpawd.service
	@systemctl daemon-reload

help:
	@echo "Targets:"
	@echo "  all              Build backend + frontend (default)"
	@echo "  build            Same as 'all'"
	@echo "  build-backend    Build the Go backend -> pewpawd"
	@echo "  build-frontend   Build the GTK frontend -> pewpaw"
	@echo "  run-backend      Build & run the backend (requires sudo)"
	@echo "  run-frontend     Build & run the frontend"
	@echo "  run              Build & run both"
	@echo "  clean            Remove binaries, build dir, DBs, socket"
	@echo "  tidy-backend     Run go mod tidy"
	@echo "  install          Build + install binaries + systemd service"
	@echo "  install-frontend Copy binaries to /usr/local/bin"
	@echo "  install-services Install systemd service for pewpawd"
	@echo "  uninstall        Remove binaries + systemd service"
	@echo "  help             Show this help"
