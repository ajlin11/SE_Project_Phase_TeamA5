# TESS Backend — Spring Boot REST API

**Tirana Employment Service for Students** — Team SmartShift A5

---

## Tech Stack

| Layer      | Technology                         |
|------------|------------------------------------|
| Language   | Java 17                            |
| Framework  | Spring Boot 3.2.5                  |
| Security   | Spring Security + JWT (jjwt 0.12)  |
| Database   | PostgreSQL (JPA / Hibernate)       |
| Real-time  | Spring WebSocket (STOMP + SockJS)  |
| API Docs   | Springdoc OpenAPI 3 (Swagger UI)   |
| Build      | Maven                              |

---

## Project Structure

```
src/main/java/com/tess/
├── TessApplication.java
├── config/
│   ├── AppConfig.java          # ModelMapper, OpenAPI beans
│   ├── SecurityConfig.java     # JWT filter chain, CORS
│   └── WebSocketConfig.java    # STOMP broker config
├── controller/
│   ├── AuthController.java
│   ├── StudentController.java
│   ├── EmployerController.java
│   ├── JobController.java
│   ├── ApplicationController.java
│   ├── InterviewController.java
│   ├── MessageController.java
│   ├── NotificationController.java
│   └── AdminController.java
├── dto/
│   ├── request/                # RegisterRequest, LoginRequest, JobRequest …
│   └── response/               # AuthResponse, JobResponse, ApiResponse<T> …
├── entity/
│   ├── User.java
│   ├── Student.java
│   ├── Employer.java
│   ├── Availability.java
│   ├── Job.java
│   ├── Application.java
│   ├── Interview.java
│   ├── Message.java
│   └── Notification.java
├── enums/
│   ├── Role.java               # STUDENT | EMPLOYER | ADMIN
│   ├── ApplicationStatus.java  # CREATED → PENDING → ACCEPTED/REJECTED → COMPLETED
│   ├── JobStatus.java          # DRAFT → ACTIVE → CLOSED / EXPIRED
│   ├── InterviewStatus.java    # SCHEDULED → ONGOING → COMPLETED / CANCELLED
│   ├── NotificationType.java
│   └── AvailabilityDay.java
├── exception/
│   ├── GlobalExceptionHandler.java
│   ├── ResourceNotFoundException.java
│   ├── BadRequestException.java
│   └── AccessDeniedException.java
├── repository/                 # JPA repositories (7 files)
├── security/
│   ├── JwtUtils.java
│   ├── AuthTokenFilter.java
│   ├── UserDetailsImpl.java
│   └── UserDetailsServiceImpl.java
└── service/
    ├── FileStorageService.java
    ├── NotificationService.java
    └── impl/
        ├── AuthService.java
        ├── StudentService.java
        ├── EmployerService.java
        ├── JobService.java
        ├── JobMatchingService.java  ← CORE ALGORITHM
        ├── ApplicationService.java
        ├── InterviewService.java
        ├── MessageService.java
        └── AdminService.java
```

---

## Setup & Run

### 1. Create PostgreSQL database
```sql
CREATE DATABASE tess_db;
CREATE USER postgres WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE tess_db TO postgres;
```

### 2. Configure `application.properties`
Edit `src/main/resources/application.properties` and set:
- `spring.datasource.url` / `username` / `password`
- `jwt.secret` (change to a 256-bit secret in production)
- `spring.mail.*` (your SMTP credentials)
- `tess.cors.allowed-origins` (your frontend URL)

### 3. Run
```bash
./mvnw spring-boot:run
```

### 4. Swagger UI
```
http://localhost:8080/api/swagger-ui.html
```

---

## Key API Endpoints

### Auth
| Method | Path              | Description           |
|--------|-------------------|-----------------------|
| POST   | /api/auth/register | Register user         |
| POST   | /api/auth/login    | Login, get JWT        |
| POST   | /api/auth/refresh  | Refresh access token  |

### Jobs
| Method | Path                    | Role     | Description                          |
|--------|-------------------------|----------|--------------------------------------|
| GET    | /api/jobs/public/active | Public   | Browse all active jobs               |
| GET    | /api/jobs/matching      | STUDENT  | Jobs matching student's schedule     |
| POST   | /api/jobs               | EMPLOYER | Create job posting                   |
| POST   | /api/jobs/{id}/publish  | EMPLOYER | Publish a draft job                  |

### Applications
| Method | Path                          | Role     | Description             |
|--------|-------------------------------|----------|-------------------------|
| POST   | /api/applications             | STUDENT  | Apply for a job         |
| GET    | /api/applications/my          | STUDENT  | My applications         |
| GET    | /api/applications/job/{jobId} | EMPLOYER | Applications per job    |
| PATCH  | /api/applications/{id}/status | EMPLOYER | Accept/Reject           |

### Interviews
| Method | Path                            | Role     | Description          |
|--------|---------------------------------|----------|----------------------|
| POST   | /api/interviews                 | EMPLOYER | Schedule interview   |
| PUT    | /api/interviews/{id}/reschedule | EMPLOYER | Reschedule           |
| POST   | /api/interviews/{id}/cancel     | EMPLOYER | Cancel               |
| GET    | /api/interviews/room/{roomId}   | Both     | Join by room ID      |

### Messages (REST + WebSocket)
| Method | Path                               | Description            |
|--------|------------------------------------|------------------------|
| POST   | /api/messages                      | Send message (REST)    |
| GET    | /api/messages/conversation/{userId}| Get conversation       |
| WS     | /ws → /app/chat.send               | Send via WebSocket     |
| WS     | /user/queue/messages               | Receive in real-time   |

### Admin
| Method | Path                             | Description                |
|--------|----------------------------------|----------------------------|
| GET    | /api/admin/stats                 | Platform statistics        |
| GET    | /api/admin/users                 | All users                  |
| POST   | /api/admin/users/{id}/toggle-active | Activate/deactivate    |
| POST   | /api/admin/students/{id}/verify  | Verify student             |

---

## Job Matching Algorithm

`JobMatchingService.getMatchingJobsForStudent()`:

1. Loads all the student's **busy slots** (class times) from `availabilities` table.
2. Iterates every **ACTIVE** job and checks for **schedule conflicts**:
   - A conflict occurs when the job's work day + shift hours **overlap** with any busy slot.
3. Non-conflicting jobs are ranked: **skill-matched jobs first**, then the rest.
4. Returns a paginated result.
5. `calculateCompatibilityScore()` returns 0–100 per job: 50pts (no conflict) + 40pts (skill match ratio) + 10pts (active status).

---

## WebSocket Real-Time

Connect with SockJS at `ws://localhost:8080/api/ws`:

```javascript
const socket = new SockJS('/api/ws');
const client = Stomp.over(socket);
client.connect({ Authorization: 'Bearer <token>' }, () => {
  // Listen for messages
  client.subscribe('/user/queue/messages', msg => {
    console.log(JSON.parse(msg.body));
  });
  // Listen for notifications
  client.subscribe('/user/queue/notifications', notif => {
    console.log(JSON.parse(notif.body));
  });
  // Send a message
  client.send('/app/chat.send', {}, JSON.stringify({ receiverId: 2, content: 'Hello!' }));
});
```

---

## Security

- Passwords hashed with **BCrypt**
- JWT access tokens (24h) + refresh tokens (7d)
- Role-based access via `@PreAuthorize`
- Student registration validates: institutional email domain, age 16–35, active student confirmation
- Admin can deactivate/delete any non-admin account
