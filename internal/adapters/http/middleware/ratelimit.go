package middleware

import (
	"net/http"
	"sync"
	"time"
)

type visitor struct {
	count    int
	lastSeen time.Time
}

type RateLimiter struct {
	mu       sync.Mutex
	visitors map[string]*visitor
	limit    int
	window   time.Duration
	stopCh   chan struct{}
}

// NewRateLimiter creates a rate limiter that allows `limit` requests per `window`.
// Starts a background goroutine that cleans up stale entries every minute.
// Call Stop() to free resources.
func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		visitors: make(map[string]*visitor),
		limit:    limit,
		window:   window,
		stopCh:   make(chan struct{}),
	}

	go rl.cleanup()
	return rl
}

// Stop terminates the background cleanup goroutine.
func (rl *RateLimiter) Stop() {
	close(rl.stopCh)
}

// Allow checks if the given key (usually IP) is allowed to make a request.
func (rl *RateLimiter) Allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	v, exists := rl.visitors[key]
	if !exists {
		rl.visitors[key] = &visitor{count: 1, lastSeen: now}
		return true
	}

	if now.Sub(v.lastSeen) > rl.window {
		// Window expired — reset
		v.count = 1
		v.lastSeen = now
		return true
	}

	v.lastSeen = now
	v.count++
	return v.count <= rl.limit
}

// Middleware returns an HTTP middleware that rate-limits by client IP.
func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr
		// Strip port if present
		for i := len(ip) - 1; i >= 0; i-- {
			if ip[i] == ':' {
				ip = ip[:i]
				break
			}
		}

		if !rl.Allow(ip) {
			w.Header().Set("Retry-After", "60")
			http.Error(w, `{"error":"demasiadas solicitudes, intentá de nuevo en un minuto"}`, http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			rl.mu.Lock()
			now := time.Now()
			for ip, v := range rl.visitors {
				if now.Sub(v.lastSeen) > rl.window*2 {
					delete(rl.visitors, ip)
				}
			}
			rl.mu.Unlock()
		case <-rl.stopCh:
			return
		}
	}
}
