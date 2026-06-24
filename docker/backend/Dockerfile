FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY backend/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
