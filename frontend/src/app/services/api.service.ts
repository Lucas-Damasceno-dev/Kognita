import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User, CreateUserRequest } from '../models/user';
import { Subject, CreateSubjectRequest } from '../models/subject';
import { StudySession, CreateStudySessionRequest } from '../models/study-session';
import { Task, CreateTaskRequest } from '../models/task';
import { StudyGoal, CreateGoalRequest } from '../models/study-goal';
import { PageResponse } from '../models/page-response';
import { ChallengeAttempt, CreateChallengeAttemptRequest, ChallengeStats } from '../models/challenge-attempt';
import { ChallengeGoal, CreateChallengeGoalRequest } from '../models/challenge-goal';
import { ErrorLog, CreateErrorLogRequest } from '../models/error-log';
import { ImportRequest, RoadmapRequest, CategoryTasks } from '../models/import-models';
import { JobAnalysis } from '../models/job-analysis';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly api = '/api';

  constructor(private http: HttpClient) {}

  // Users
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.api}/users`);
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.api}/users/${id}`);
  }

  createUser(req: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.api}/users`, req);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/users/${id}`);
  }

  updateUser(id: string, req: { name?: string; email?: string; currentPassword?: string; newPassword?: string; avatarUrl?: string }): Observable<User> {
    return this.http.put<User>(`${this.api}/users/${id}`, req);
  }

  // Subjects
  getSubjects(userId: string): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.api}/subjects`, { params: { userId } });
  }

  getSubjectsPage(userId: string, page: number, size: number): Observable<PageResponse<Subject>> {
    return this.http.get<PageResponse<Subject>>(`${this.api}/subjects/page`, { params: { userId, page: page.toString(), size: size.toString() } });
  }

  getSubject(id: string): Observable<Subject> {
    return this.http.get<Subject>(`${this.api}/subjects/${id}`);
  }

  createSubject(req: CreateSubjectRequest): Observable<Subject> {
    return this.http.post<Subject>(`${this.api}/subjects`, req);
  }

  updateSubject(id: string, req: CreateSubjectRequest): Observable<Subject> {
    return this.http.put<Subject>(`${this.api}/subjects/${id}`, req);
  }

  deleteSubject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/subjects/${id}`);
  }

  // Study Sessions
  getSessions(): Observable<StudySession[]> {
    return this.http.get<StudySession[]>(`${this.api}/study-sessions`);
  }

  getSessionsPage(userId: string, page: number, size: number, subjectId?: string, startDate?: string, endDate?: string): Observable<PageResponse<StudySession>> {
    let params: any = { userId, page: page.toString(), size: size.toString() };
    if (subjectId) params['subjectId'] = subjectId;
    if (startDate) params['startDate'] = startDate;
    if (endDate) params['endDate'] = endDate;
    return this.http.get<PageResponse<StudySession>>(`${this.api}/study-sessions/page`, { params });
  }

  createSession(req: CreateStudySessionRequest, userId: string): Observable<StudySession> {
    return this.http.post<StudySession>(`${this.api}/study-sessions`, { ...req, userId });
  }

  updateSession(id: string, req: CreateStudySessionRequest): Observable<StudySession> {
    return this.http.put<StudySession>(`${this.api}/study-sessions/${id}`, req);
  }

  deleteSession(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/study-sessions/${id}`);
  }

  // Tasks
  getTasks(userId: string, status?: string, priority?: string, search?: string): Observable<Task[]> {
    let params: any = { userId };
    if (status) params['status'] = status;
    if (priority) params['priority'] = priority;
    if (search) params['search'] = search;
    return this.http.get<PageResponse<Task>>(`${this.api}/tasks`, { params }).pipe(
      map(res => res.content)
    );
  }

  getTasksPage(userId: string, page: number, size: number, status?: string, priority?: string, search?: string): Observable<PageResponse<Task>> {
    let params: any = { userId, page: page.toString(), size: size.toString() };
    if (status) params['status'] = status;
    if (priority) params['priority'] = priority;
    if (search) params['search'] = search;
    return this.http.get<PageResponse<Task>>(`${this.api}/tasks`, { params });
  }

  getPracticeTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.api}/tasks/practice`);
  }

  getTask(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.api}/tasks/${id}`);
  }

  createTask(req: CreateTaskRequest, userId: string): Observable<Task> {
    return this.http.post<Task>(`${this.api}/tasks`, { ...req, userId });
  }

  updateTask(id: string, req: CreateTaskRequest): Observable<Task> {
    return this.http.put<Task>(`${this.api}/tasks/${id}`, req);
  }

  updateTaskStatus(id: string, status: string): Observable<Task> {
    return this.http.patch<Task>(`${this.api}/tasks/${id}/status`, { status });
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/tasks/${id}`);
  }

  // Goals
  getGoals(userId: string): Observable<StudyGoal[]> {
    return this.http.get<StudyGoal[]>(`${this.api}/goals`, { params: { userId } });
  }

  getGoalsPage(userId: string, page: number, size: number): Observable<PageResponse<StudyGoal>> {
    return this.http.get<PageResponse<StudyGoal>>(`${this.api}/goals/page`, { params: { userId, page: page.toString(), size: size.toString() } });
  }

  createGoal(req: CreateGoalRequest, userId: string): Observable<StudyGoal> {
    return this.http.post<StudyGoal>(`${this.api}/goals`, { ...req, userId });
  }

  updateGoal(id: string, req: CreateGoalRequest): Observable<StudyGoal> {
    return this.http.put<StudyGoal>(`${this.api}/goals/${id}`, req);
  }

  updateGoalProgress(id: string, hours: number): Observable<StudyGoal> {
    return this.http.patch<StudyGoal>(`${this.api}/goals/${id}/progress`, hours);
  }

  deleteGoal(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/goals/${id}`);
  }

  // Challenge Goals
  getChallengeGoals(): Observable<ChallengeGoal[]> {
    return this.http.get<ChallengeGoal[]>(`${this.api}/challenge-goals`);
  }

  createChallengeGoal(req: CreateChallengeGoalRequest): Observable<ChallengeGoal> {
    return this.http.post<ChallengeGoal>(`${this.api}/challenge-goals`, req);
  }

  deleteChallengeGoal(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/challenge-goals/${id}`);
  }

  // Challenge Attempts
  updateChallengeAttempt(id: string, req: CreateChallengeAttemptRequest): Observable<ChallengeAttempt> {
    return this.http.put<ChallengeAttempt>(`${this.api}/challenge-attempts/${id}`, req);
  }

  createChallengeAttempt(req: CreateChallengeAttemptRequest, userId: string): Observable<ChallengeAttempt> {
    return this.http.post<ChallengeAttempt>(`${this.api}/challenge-attempts`, { ...req, userId });
  }

  getChallengeStats(): Observable<ChallengeStats> {
    return this.http.get<ChallengeStats>(`${this.api}/challenge-attempts/stats`);
  }

  getHistory(skillCategory?: string): Observable<ChallengeAttempt[]> {
    let params: any = {};
    if (skillCategory) params['skillCategory'] = skillCategory;
    return this.http.get<ChallengeAttempt[]>(`${this.api}/challenge-attempts/history`, { params });
  }

  // Error Logs
  getErrorLogs(): Observable<ErrorLog[]> {
    return this.http.get<ErrorLog[]>(`${this.api}/error-logs`);
  }

  getErrorLogCount(): Observable<number> {
    return this.http.get<number>(`${this.api}/error-logs/count`);
  }

  createErrorLog(req: CreateErrorLogRequest, userId: string): Observable<ErrorLog> {
    return this.http.post<ErrorLog>(`${this.api}/error-logs`, { ...req, userId });
  }

  updateErrorLog(id: string, req: CreateErrorLogRequest): Observable<ErrorLog> {
    return this.http.put<ErrorLog>(`${this.api}/error-logs/${id}`, req);
  }

  deleteErrorLog(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/error-logs/${id}`);
  }

  // Jobs
  analyzeJob(req: { jobDescription: string }): Observable<JobAnalysis> {
    return this.http.post<JobAnalysis>(`${this.api}/jobs/analyze`, req);
  }

  // Import
  importFileStructure(req: CategoryTasks[], userId: string): Observable<void> {
    return this.http.post<void>(`${this.api}/import/file-structure`, req, { params: { userId } });
  }

  importRoadmap(req: RoadmapRequest, userId: string): Observable<void> {
    return this.http.post<void>(`${this.api}/import/roadmap`, req, { params: { userId } });
  }
}
