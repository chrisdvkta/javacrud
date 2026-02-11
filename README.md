# Todo CRUD (Spring Boot + Postgres)

Minimal API with register/login using session cookies and Todo CRUD bound to the logged-in user.

## Prereqs
- Docker + Docker Compose
- JDK 17+
- Maven 3.9+

## Quick start
1) Start Postgres
```bash
docker compose up -d db
```
2) Run the app
```bash
./mvnw spring-boot:run   # or mvn spring-boot:run if wrapper unavailable
```
App listens on http://localhost:8080.

### API walkthrough (curl)
Register
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"secret123"}'
```
Login (stores JSESSIONID cookie)
```bash
curl -i -c cookies.txt -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"secret123"}'
```
Create todo
```bash
curl -b cookies.txt -X POST http://localhost:8080/api/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"Buy milk","description":"2% gallon","completed":false}'
```
List todos
```bash
curl -b cookies.txt http://localhost:8080/api/todos
```
Update
```bash
curl -b cookies.txt -X PUT http://localhost:8080/api/todos/1 \
  -H 'Content-Type: application/json' \
  -d '{"title":"Buy milk","description":"2% + bread","completed":true}'
```
Delete
```bash
curl -b cookies.txt -X DELETE http://localhost:8080/api/todos/1
```

## Notes
- Session cookie is `JSESSIONID`; CSRF is disabled for simplicity.
- Persistence uses JPA auto-migrations (`spring.jpa.hibernate.ddl-auto=update`).
- DB defaults: database `todo`, user `todo`, password `todo` (see `docker-compose.yml`).
