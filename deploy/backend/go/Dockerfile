# Multi-stage build for Go services
# Stage 1: Build the Go application
FROM golang:1.24-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata make

# Set working directory
WORKDIR /build

# Set Go environment
ENV GO111MODULE=on \
    GOPROXY=https://goproxy.cn,direct \
    CGO_ENABLED=0 \
    GOOS=linux \
    GOARCH=amd64

# Accept build argument for service name
ARG SERVICE_NAME=system-service

# Copy go.work and go module files first (for better caching)
COPY go.work* ./
COPY services/app/${SERVICE_NAME}/go.mod services/app/${SERVICE_NAME}/go.sum ./services/app/${SERVICE_NAME}/

# Download dependencies
WORKDIR /build/services/app/${SERVICE_NAME}
RUN go mod download

# Copy the entire source code
WORKDIR /build
COPY . .

# Build the service
WORKDIR /build/services/app/${SERVICE_NAME}
RUN go build -ldflags="-s -w" -o /app/service ./api/

# Stage 2: Create minimal runtime image
FROM alpine:3.19

# Install runtime dependencies
RUN apk --no-cache add ca-certificates tzdata curl

# Set timezone
ENV TZ=Asia/Shanghai

# Create app user
RUN addgroup -g 1000 app && \
    adduser -D -u 1000 -G app app

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/service ./service

# Copy configuration files and web assets
ARG SERVICE_NAME=system-service
COPY --from=builder /build/services/app/${SERVICE_NAME}/api/etc ./etc
COPY --from=builder /build/services/app/${SERVICE_NAME}/api/web ./web
COPY --from=builder /build/services/app/${SERVICE_NAME}/api/doc ./doc

# Change ownership
RUN chown -R app:app /app

# Switch to app user
USER app

# Expose port (default for most services)
EXPOSE 8888

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8888/health || exit 1

# Run the service
CMD ["./service", "-f", "etc/api.yaml"]
