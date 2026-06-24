FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /app
COPY backend/pom.xml .
COPY backend/src ./src
COPY backend/mvnw .
COPY backend/.mvn .mvn
RUN chmod +x mvnw && ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
