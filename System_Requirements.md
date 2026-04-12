## 1. Chosen Development Model

The project follows the Agile development model.

### Justification:
We chose Agile because the project requirements are continuously evolving during development. Agile model leaves room for flexibility, 
continuous improvement and frequent updates. It supports iterative development, enabling us to adapt to changes,
test features early and improve the system based on feedback. Contrary Waterfall tends to be more hectic with all requirements 
needed to be clearly specified from the beginning.

## 2. User Requirements

### a. Stakeholders

- Students: Primary users who search and apply for part-time jobs based on their availability and skills.
- Employers (Companies): Users who post job opportunities and select suitable student candidates.
- Administrators: Responsible for managing users, monitoring job postings and ensuring system security.
- Development Team: Responsible for designing, developing and maintaining the system.

### b. User Stories

#### Students
1. As a student, I want to create an account so that I can access job opportunities.
2. As a student, I want to add my availability schedule so that I can find jobs that match my free time.
3. As a student, I want to apply for jobs so that I can get part-time work.
4. As a student, I want to track my application status so that I know if I am accepted or rejected.
5. As a student, I want to communicate with employers so that I can ask questions about jobs.

#### Employers
1. As an employer, I want to post job opportunities so that I can find suitable candidates.
2. As an employer, I want to view student applications so that I can select the best candidates.
3. As an employer, I want to filter candidates based on availability so that I can find suitable employees.
4. As an employer, I want to schedule interviews so that I can evaluate candidates.
5. As an employer, I want to communicate with students so that I can discuss job details.

#### Administrators
1. As an admin, I want to manage user accounts so that the system remains secure.
2. As an admin, I want to monitor job postings so that inappropriate content is removed.
3. As an admin, I want to manage system data so that the platform runs efficiently.
4. As an admin, I want to control user roles so that access is properly managed.

## 3. Functional Requirements

### a. Description

1. The system shall allow users to register accounts.
2. The system shall allow users to log in securely.
3. The system shall allow students to create and update profiles.
4. The system shall allow students to define availability schedules.
5. The system shall allow employers to create job postings.
6. The system shall allow users to search for jobs.
7. The system shall allow students to apply for jobs.
8. The system shall allow employers to view applications.
9. The system shall allow employers to accept or reject candidates.
10. The system shall allow messaging between users.
11. The system shall allow scheduling of interviews.
12. The system shall generate a unique meeting link for interviews.
13. The system shall allow users to join virtual interview rooms.
14. The system shall send notifications for important actions.
15. The system shall allow admins to manage users.
16. The system shall allow admins to manage job postings.
17. The system shall allow role-based access control.
18. The system shall store user and job data in a database.
19. The system shall allow users to view application status.
20. The system shall allow employers to filter candidates.

### b. Acceptance Criteria

#### User Login
- User enters valid email and password
- System verifies credentials
- User is redirected to dashboard
- Error message is shown for invalid input

#### Job Application
- Student selects a job and clicks apply
- System stores the application
- Employer can view the application
- Student sees application status

#### Messaging
- User sends a message
- Message is stored in the system
- Receiver receives message in real-time
- Chat history is visible

#### Interview Scheduling
- Employer selects a candidate
- System generates meeting link
- Both users can access the link
- Interview starts successfully

#### Job Posting
- Employer enters job details
- System saves the job
- Job appears in job listings

## 4. Non-Functional Requirements

### a. Description

1. The system should load pages quickly.
2. The system should respond to user actions without delay.
3. The system should be available at all times.
4. The system should handle multiple users simultaneously.
5. The system should ensure secure user authentication.
6. The system should protect user data from unauthorized access.
7. The system should be easy to use and navigate.
8. The system should have a clear and simple interface.
9. The system should provide clear feedback after user actions.
10. The system should ensure reliable data storage and retrieval.
11. The system should ensure data consistency.
12. The system should prevent data loss.
13. The system should provide error messages when failures occur.
14. The system should recover quickly from system errors.
15. The system should support future scalability.
16. The system should allow easy maintenance and updates.
17. The system should log important system activities.
18. The system should ensure fast database queries.
19. The system should support real-time communication efficiently.
20. The system should ensure reliable message delivery.
21. The system should ensure smooth interview performance.
22. The system should minimize downtime.
23. The system should provide notification delivery in real time.
24. The system should maintain performance under load.
25. The system should ensure secure API communication.

### b. Acceptance Criteria

#### Speed
- Pages load in less than 3 seconds
- API responses return within 2 seconds

#### Availability
- System uptime is at least 98%
- System is accessible 24/7

#### Security
- Passwords are encrypted in the database
- Only authenticated users can access protected features

#### Usability
- Users can complete main actions (login, apply) within few steps
- Interface is consistent across pages

#### Real-Time Communication
- Messages are delivered instantly 
- Interview connects successfully without major delay

## 5. Application Specifications

### a. Architecture

The system follows a three-tier architecture consisting of:

- Frontend (React): Handles the user interface and user interactions.
- Backend (Spring Boot/Python): Manages business logic, APIs and communication between components.
- Database (PostgreSQL): Stores all persistent system data.

The frontend sends requests to the backend through REST APIs. The backend processes the requests, applies business logic
and communicates with the database. The system also supports real-time communication for messaging and interview features.

### b. Database Model

The system uses a PostgreSQL database with the following main tables:

- Users: Stores general user information (id, email, password, role etc)
- Students: Stores student-specific data (skills, availability etc)
- Employers: Stores company information
- Jobs: Contains job postings (title, description, schedule)
- Applications: Links students to jobs and tracks application status
- Messages: Stores communication between users
- Interviews: Stores interview details and meeting links

Relationships:
- A user can be a student or employer
- A student can apply to multiple jobs
- Each job belongs to one employer
- Each application links one student to one job
- Messages are exchanged between users

Constraints:
- Email must be unique
- Each application must reference a valid student and job
- Each job must be linked to a valid employer
- A user must have a defined role (student, employer, admin)
- Messages must include a valid sender and receiver
- Each interview must be linked to a valid application
- Application status must be one of: pending, accepted, rejected
- Required fields (email, password) cannot be empty

### c. Technologies Used

- Backend: Java with Spring Boot/Python (chosen for its structure and scalability)
- Frontend: React (for building a responsive and dynamic user interface)
- Database: PostgreSQL (for reliable data storage and relationships)
- Version Control: GitHub (for collaboration and version management)

The system runs on modern operating systems such as Windows and can be deployed on web servers for online access.

### d. User Interface Design

The system provides a simple, clean and user-friendly interface designed for three types of users: students, employers and administrators.

#### Main Pages and Components:

- Login / Registration Page:
  Users can create an account or log in using their credentials. The page includes input fields for email and password and buttons for login and registration.

- Student Dashboard:
  Students can view available jobs, manage their profile, update their availability schedule, and track their applications. The dashboard includes:
  - Job list with filters (by time, skills)
  - “Apply” button for each job
  - Profile and schedule editing options
  - Application status section (pending, accepted, rejected)

- Employer Dashboard:
  Employers can manage job postings and applicants. The dashboard includes:
  - “Create Job” button
  - List of posted jobs
  - List of applicants for each job
  - “Accept / Reject” buttons
  - “Schedule Interview” option

- Job Listings Page:
  Displays all available jobs with details such as title, description, required skills and working hours. 
  Students can browse and apply directly.

- Messaging Interface:
  A chat-style interface where students and employers can communicate in real time. It includes:
  - Message list
  - Input field to send messages
  - Send button

- Interview Page:
  Users can join a virtual meeting using a generated link. The page includes:
  - Video/audio interface
  - Join/leave buttons

- Admin Dashboard:
  Administrators can manage users and job postings. It includes:
  - User management options
  - Job monitoring tools

The interface uses clear navigation menus, buttons for key actions and a responsive design.

### e. Security Measures

The system implements several security measures to protect user data and ensure safe operation:

- Authentication:
  Users must register and log in to access the system. Only authenticated users can perform actions.

- Password Protection:
  User passwords are encrypted before being stored in the database to prevent unauthorized access.

- Role-Based Access Control:
  Different user roles (student, employer, admin) have different permissions, ensuring that users can only access allowed features.

- Secure Communication:
  Data exchanged between the frontend and backend is protected to prevent unauthorized interception.

- Input Validation:
  All user inputs are validated to prevent invalid data from entering the system.

- Data Protection:
  User information is stored securely and only accessible by authorized users.

These measures ensure that the system remains secure and reliable to common security threats.
