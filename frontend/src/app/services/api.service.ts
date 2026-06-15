import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User, CreateUserRequest } from '../models/user';
import { Subject, CreateSubjectRequest } from '../models/subject';
import { StudySession, CreateStudySessionRequest } from '../models/study-session';
import { Task, CreateTaskRequest } from '../models/task';
import { StudyGoal, CreateGoalRequest } from '../models/study-goal';
import { Observable } from 'rxjs';

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

  // Subjects
  getSubjects(userId: string): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.api}/subjects`, { params: { userId } });
  }

  getSubject(id: string): Observable<Subject> {
    return this.http.get<Subject>(`${this.api}/subjects/${id}`);
  }

  createSubject(req: CreateSubjectRequest, userId: string): Observable<Subject> {
    return this.http.post<Subject>(`${this.api}/subjects`, req, { params: { userId } });
  }

  deleteSubject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/subjects/${id}`);
  }

  // Study Sessions
  getSessions(userId: string): Observable<StudySession[]> {
    return this.http.get<StudySession[]>(`${this.api}/study-sessions`, { params: { userId } });
  }

  createSession(req: CreateStudySessionRequest, userId: string): Observable<StudySession> {
    return this.http.post<StudySession>(`${this.api}/study-sessions`, req, { params: { userId } });
  }

  deleteSession(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/study-sessions/${id}`);
  }

  // Tasks
  getTasks(userId: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.api}/tasks`, { params: { userId } });
  }

  getTask(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.api}/tasks/${id}`);
  }

  createTask(req: CreateTaskRequest, userId: string): Observable<Task> {
    return this.http.post<Task>(`${this.api}/tasks`, req, { params: { userId } });
  }

  updateTaskStatus(id: string, status: string): Observable<Task> {
    return this.http.patch<Task>(`${this.api}/tasks/${id}/status`, status);
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/tasks/${id}`);
  }

  // Goals
  getGoals(userId: string): Observable<StudyGoal[]> {
    return this.http.get<StudyGoal[]>(`${this.api}/goals`, { params: { userId } });
  }

  createGoal(req: CreateGoalRequest, userId: string): Observable<StudyGoal> {
    return this.http.post<StudyGoal>(`${this.api}/goals`, req, { params: { userId } });
  }

  updateGoalProgress(id: string, hours: number): Observable<StudyGoal> {
    return this.http.patch<StudyGoal>(`${this.api}/goals/${id}/progress`, hours);
  }

  deleteGoal(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/goals/${id}`);
  }
}
