// ─── Enums ───────────────────────────────────────────────────────────────────
export type Role = 'STUDENT' | 'EMPLOYER' | 'ADMIN';
export type ApplicationStatus = 'CREATED' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
export type JobStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'EXPIRED';
export type InterviewStatus = 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type NotificationType =
  | 'APPLICATION_SUBMITTED' | 'APPLICATION_ACCEPTED' | 'APPLICATION_REJECTED'
  | 'INTERVIEW_SCHEDULED' | 'INTERVIEW_CANCELLED'
  | 'MESSAGE_RECEIVED' | 'JOB_POSTED' | 'ACCOUNT_DEACTIVATED';
export type AvailabilityDay = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  profileId: number;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
  // Student
  age?: number;
  university?: string;
  faculty?: string;
  major?: string;
  yearOfStudy?: number;
  activeStudent?: boolean;
  // Employer
  companyName?: string;
  industry?: string;
  website?: string;
  address?: string;
  city?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  active: boolean;
  phone?: string;
  createdAt: string;
}

// ─── Student ──────────────────────────────────────────────────────────────────
export interface Student {
  id: number;
  user: User;
  age: number;
  university: string;
  faculty?: string;
  major?: string;
  yearOfStudy?: number;
  bio?: string;
  cvPath?: string;
  studentIdPath?: string;
  studentVerified: boolean;
  activeStudent: boolean;
  skills: string[];
  availabilities: Availability[];
}

// ─── Employer ─────────────────────────────────────────────────────────────────
export interface Employer {
  id: number;
  user: User;
  companyName: string;
  companyDescription?: string;
  industry?: string;
  website?: string;
  address?: string;
  city?: string;
  verified: boolean;
}

// ─── Availability ─────────────────────────────────────────────────────────────
export interface Availability {
  id: number;
  dayOfWeek: AvailabilityDay;
  startTime: string;
  endTime: string;
  busy: boolean;
  description?: string;
}

export interface AvailabilityRequest {
  dayOfWeek: AvailabilityDay;
  startTime: string;
  endTime: string;
  busy: boolean;
  description?: string;
}

// ─── Job ──────────────────────────────────────────────────────────────────────
export interface Job {
  id: number;
  title: string;
  description: string;
  location?: string;
  hourlyRate?: number;
  hoursPerWeek?: number;
  status: JobStatus;
  requiredSkills: string[];
  workDays: AvailabilityDay[];
  shiftStartTime?: string;
  shiftEndTime?: string;
  applicationDeadline?: string;
  maxApplicants?: number;
  createdAt: string;
  updatedAt: string;
  employerId: number;
  companyName: string;
  industry?: string;
  applicationCount: number;
  alreadyApplied: boolean;
}

export interface JobRequest {
  title: string;
  description: string;
  location?: string;
  hourlyRate?: number;
  hoursPerWeek?: number;
  status?: JobStatus;
  requiredSkills?: string[];
  workDays?: AvailabilityDay[];
  shiftStartTime?: string;
  shiftEndTime?: string;
  applicationDeadline?: string;
  maxApplicants?: number;
}

// ─── Application ──────────────────────────────────────────────────────────────
export interface Application {
  id: number;
  status: ApplicationStatus;
  coverLetter?: string;
  employerNote?: string;
  appliedAt: string;
  updatedAt: string;
  jobId: number;
  jobTitle: string;
  companyName: string;
  studentId: number;
  studentFullName: string;
  studentEmail: string;
  studentUniversity: string;
  interview?: Interview;
}

export interface ApplicationRequest {
  jobId: number;
  coverLetter?: string;
}

// ─── Interview ────────────────────────────────────────────────────────────────
export interface Interview {
  id: number;
  applicationId: number;
  meetingLink: string;
  roomId: string;
  scheduledAt: string;
  durationMinutes: number;
  status: InterviewStatus;
  notes?: string;
  createdAt: string;
  studentFullName: string;
  employerCompanyName: string;
  jobTitle: string;
}

export interface InterviewRequest {
  applicationId: number;
  scheduledAt: string;
  durationMinutes?: number;
  notes?: string;
}

// ─── Message ──────────────────────────────────────────────────────────────────
export interface Message {
  id: number;
  senderId: number;
  senderFullName: string;
  receiverId: number;
  receiverFullName: string;
  content: string;
  read: boolean;
  sentAt: string;
}

export interface MessageRequest {
  receiverId: number;
  content: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  read: boolean;
  referenceId?: number;
  referenceType?: string;
  createdAt: string;
}

// ─── API Wrapper ──────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
