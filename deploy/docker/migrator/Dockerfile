# Dockerfile for Migrator Service
FROM alpine:3.19

# Install mysql client, bash and coreutils (for sha256sum)
RUN apk add --no-cache mariadb-client bash coreutils

WORKDIR /app

# Copy migration script
COPY deploy/scripts/run-migrations.sh /app/run-migrations.sh
RUN chmod +x /app/run-migrations.sh

# Entrypoint updates
CMD ["bash", "/app/run-migrations.sh"]
