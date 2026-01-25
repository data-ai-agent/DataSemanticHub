# Multi-stage build for Java services
# Stage 1: Build the Java application
FROM maven:3.8.6-openjdk-8 AS builder

# Set working directory
WORKDIR /build

# Accept build argument for service name
ARG SERVICE_NAME=data-connection

# Copy pom files first (for better caching)
COPY services/app/${SERVICE_NAME}/pom.xml ./

# Configure Maven to use Aliyun mirror for better download reliability
RUN mkdir -p /root/.m2 && \
    echo '<?xml version="1.0" encoding="UTF-8"?><settings><mirrors><mirror><id>aliyun</id><name>Aliyun Maven</name><url>https://maven.aliyun.com/repository/public</url><mirrorOf>central</mirrorOf></mirror></mirrors></settings>' > /root/.m2/settings.xml

# Download dependencies
RUN mvn dependency:go-offline -B || true

# Copy entire source code
COPY services/app/${SERVICE_NAME} .

# Build service (skip tests for faster builds)
# Add retry logic for network issues
RUN mvn clean package -DskipTests -B || (\
    mvn clean package -DskipTests -B || \
    mvn clean package -DskipTests -B \
) && \
    mkdir -p /tmp && \
    mv dc-main/target/data-connection.jar /tmp/

# Stage 2: Create minimal runtime image
FROM eclipse-temurin:8-jre

# Set timezone
ENV TZ=Asia/Shanghai
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:InitialRAMPercentage=70.0 -XX:MaxRAMPercentage=70.0 -XX:MaxMetaspaceSize=512M -XX:MetaspaceSize=128M -XX:+UseG1GC -XX:InitiatingHeapOccupancyPercent=30 -XX:ParallelGCThreads=8 -XX:+ExitOnOutOfMemoryError"

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    && ln -sf /usr/share/zoneinfo/$TZ /etc/localtime \
    && echo $TZ > /etc/timezone \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN groupadd -r app && useradd -r -g app app

# Create working directory
RUN mkdir -p /opt/vega/config && \
    chown -R app:app /opt/vega

WORKDIR /opt/vega

# Copy jar from builder
ARG SERVICE_NAME=data-connection
COPY --from=builder /tmp/data-connection.jar ./data-connection.jar

# Change ownership
RUN chown app:app /opt/vega/*

# Switch to app user
USER app

# Expose port (default 8892 for data-connection)
EXPOSE 8892

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8892/health || exit 1

# Run the service
CMD java -Dfile.encoding=UTF-8 $JAVA_OPTS -jar -server data-connection.jar --spring.config.location=./config/
