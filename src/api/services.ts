import api from './axios';
import {
  AuthResponse, RegisterRequest, LoginRequest,
  Student, Employer, Job, JobRequest,
  Application, ApplicationRequest,
  Interview, InterviewRequest,
  Message, MessageRequest,
  Notification, Availability, AvailabilityRequest,
  ApiResponse, Page, User
} from '../types';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', data),
  login: (data: LoginRequest) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', data),
  refresh: (refreshToken: string) =>
    api.post<ApiResponse<AuthResponse>>(`/auth/refresh?refreshToken=${refreshToken}`),
  logout: () => api.post('/auth/logout'),
};

// ─── Students ─────────────────────────────────────────────────────────────────
export const studentApi = {
  getMe: () => api.get<ApiResponse<Student>>('/students/me'),
  getById: (id: number) => api.get<ApiResponse<Student>>(`/students/${id}`),
  updateProfile: (id: number, data: Partial<Student>) =>
    api.patch<ApiResponse<Student>>(`/students/${id}`, data),
  updateSkills: (id: number, skills: string[]) =>
    api.put<ApiResponse<Student>>(`/students/${id}/skills`, skills),
  uploadCv: (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<ApiResponse<Student>>(`/students/${id}/cv`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadStudentId: (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<ApiResponse<Student>>(`/students/${id}/student-id`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAvailability: (id: number) =>
    api.get<ApiResponse<Availability[]>>(`/students/${id}/availability`),
  setAvailability: (id: number, data: AvailabilityRequest[]) =>
    api.put<ApiResponse<Availability[]>>(`/students/${id}/availability`, data),
  deleteAvailabilitySlot: (studentId: number, slotId: number) =>
    api.delete(`/students/${studentId}/availability/${slotId}`),
};

// ─── Employers ────────────────────────────────────────────────────────────────
export const employerApi = {
  getMe: () => api.get<ApiResponse<Employer>>('/employers/me'),
  getById: (id: number) => api.get<ApiResponse<Employer>>(`/employers/${id}`),
  updateProfile: (id: number, data: Partial<Employer>) =>
    api.patch<ApiResponse<Employer>>(`/employers/${id}`, data),
};

// ─── Jobs ─────────────────────────────────────────────────────────────────────
export const jobApi = {
  getActive: (page = 0, size = 10) =>
    api.get<ApiResponse<Page<Job>>>(`/jobs/public/active?page=${page}&size=${size}`),
  search: (query: string, page = 0) =>
    api.get<ApiResponse<Page<Job>>>(`/jobs/public/search?query=${query}&page=${page}`),
  getById: (id: number) => api.get<ApiResponse<Job>>(`/jobs/${id}`),
  getMatching: (page = 0) =>
    api.get<ApiResponse<Page<Job>>>(`/jobs/matching?page=${page}`),
  getMyJobs: (page = 0) =>
    api.get<ApiResponse<Page<Job>>>(`/jobs/my-jobs?page=${page}`),
  create: (data: JobRequest) => api.post<ApiResponse<Job>>('/jobs', data),
  update: (id: number, data: JobRequest) => api.put<ApiResponse<Job>>(`/jobs/${id}`, data),
  delete: (id: number) => api.delete(`/jobs/${id}`),
  publish: (id: number) => api.post<ApiResponse<Job>>(`/jobs/${id}/publish`),
  close: (id: number) => api.post<ApiResponse<Job>>(`/jobs/${id}/close`),
};

// ─── Applications ─────────────────────────────────────────────────────────────
export const applicationApi = {
  apply: (data: ApplicationRequest) =>
    api.post<ApiResponse<Application>>('/applications', data),
  getMyApplications: (page = 0) =>
    api.get<ApiResponse<Page<Application>>>(`/applications/my?page=${page}`),
  getByJob: (jobId: number, page = 0) =>
    api.get<ApiResponse<Page<Application>>>(`/applications/job/${jobId}?page=${page}`),
  getById: (id: number) => api.get<ApiResponse<Application>>(`/applications/${id}`),
  updateStatus: (id: number, status: string, note?: string) =>
    api.patch<ApiResponse<Application>>(`/applications/${id}/status`, { status, note }),
};

// ─── Interviews ───────────────────────────────────────────────────────────────
export const interviewApi = {
  schedule: (data: InterviewRequest) =>
    api.post<ApiResponse<Interview>>('/interviews', data),
  reschedule: (id: number, data: InterviewRequest) =>
    api.put<ApiResponse<Interview>>(`/interviews/${id}/reschedule`, data),
  cancel: (id: number) => api.post<ApiResponse<Interview>>(`/interviews/${id}/cancel`),
  start: (id: number) => api.post<ApiResponse<Interview>>(`/interviews/${id}/start`),
  complete: (id: number) => api.post<ApiResponse<Interview>>(`/interviews/${id}/complete`),
  getById: (id: number) => api.get<ApiResponse<Interview>>(`/interviews/${id}`),
  getByRoom: (roomId: string) => api.get<ApiResponse<Interview>>(`/interviews/room/${roomId}`),
  getMy: (page = 0) => api.get<ApiResponse<Page<Interview>>>(`/interviews/my?page=${page}`),
};

// ─── Messages ─────────────────────────────────────────────────────────────────
export const messageApi = {
  send: (data: MessageRequest) => api.post<ApiResponse<Message>>('/messages', data),
  getConversation: (userId: number) =>
    api.get<ApiResponse<Message[]>>(`/messages/conversation/${userId}`),
  markAsRead: (userId: number) =>
    api.post(`/messages/conversation/${userId}/read`),
  getUnreadCount: () => api.get<ApiResponse<{ unreadCount: number }>>('/messages/unread-count'),
  getPartners: () => api.get<ApiResponse<number[]>>('/messages/partners'),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationApi = {
  getAll: (page = 0) =>
    api.get<ApiResponse<Page<Notification>>>(`/notifications?page=${page}`),
  getUnread: () => api.get<ApiResponse<Page<Notification>>>('/notifications/unread'),
  getUnreadCount: () => api.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),
  markAllRead: () => api.post('/notifications/read-all'),
  markRead: (id: number) => api.post(`/notifications/${id}/read`),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  getStats: () => api.get<ApiResponse<Record<string, number>>>('/admin/stats'),
  getUsers: (page = 0) =>
    api.get<ApiResponse<Page<User>>>(`/admin/users?page=${page}`),
  searchUsers: (query: string) =>
    api.get<ApiResponse<Page<User>>>(`/admin/users/search?query=${query}`),
  toggleActive: (userId: number) =>
    api.post<ApiResponse<User>>(`/admin/users/${userId}/toggle-active`),
  deleteUser: (userId: number) => api.delete(`/admin/users/${userId}`),
  verifyStudent: (studentId: number) =>
    api.post<ApiResponse<User>>(`/admin/students/${studentId}/verify`),
  verifyEmployer: (employerId: number) =>
    api.post<ApiResponse<User>>(`/admin/employers/${employerId}/verify`),
  getAllJobs: (page = 0) =>
    api.get<ApiResponse<Page<Job>>>(`/admin/jobs?page=${page}`),
  removeJob: (jobId: number) => api.post(`/admin/jobs/${jobId}/remove`),
};

export const reportApi = {
  submit: (data: { reportedUserId: number; reason: string; description: string }) =>
    api.post<ApiResponse<any>>('/notifications/report', data),
};
