# ── Build stage ──────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Resolve dependencies first so this layer is cached until pom.xml changes.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -q -DskipTests package \
    && cp target/*.jar /app/app.jar

# ── Runtime stage ────────────────────────────────────────────────
FROM eclipse-temurin:21-jre
WORKDIR /app

# Run as an unprivileged user.
RUN useradd --system --no-create-home kanban
COPY --from=build /app/app.jar app.jar
USER kanban

# Config comes from env vars at runtime (see application.properties):
#   dburl username pass googleclient googlepass jwtsecret frontendurl [PORT]
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
