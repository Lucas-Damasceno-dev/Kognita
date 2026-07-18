import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { User, CreateUserRequest } from '../models/user';
import { Subject, CreateSubjectRequest } from '../models/subject';
import { StudySession, CreateStudySessionRequest } from '../models/study-session';
import { Task, CreateTaskRequest } from '../models/task';
import { StudyGoal, CreateGoalRequest } from '../models/study-goal';
import { PageResponse } from '../models/page-response';
import {
  ChallengeAttempt,
  CreateChallengeAttemptRequest,
  ChallengeStats,
} from '../models/challenge-attempt';
import { ChallengeGoal, CreateChallengeGoalRequest } from '../models/challenge-goal';
import { ErrorLog, CreateErrorLogRequest } from '../models/error-log';
import { ImportRequest, RoadmapRequest, CategoryTasks } from '../models/import-models';
import { JobAnalysis } from '../models/job-analysis';
import { Flashcard, CreateFlashcardRequest } from '../models/flashcard';
import { Achievement } from '../models/achievement';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly api = '/api';

  constructor(private http: HttpClient) {}

  // Users

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.api}/users/${id}`);
  }


  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/users/${id}`);
  }

  updateUser(
    id: string,
    req: {
      name?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
      avatarUrl?: string;
    },
  ): Observable<User> {
    return this.http.put<User>(`${this.api}/users/${id}`, req);
  }

  buyStreakFreeze(): Observable<User> {
    return this.http.post<User>(`${this.api}/users/buy-freeze`, {});
  }

  // Subjects
  getSubjects(userId: string): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.api}/subjects`, { params: { userId } });
  }

  getSubjectsPage(userId: string, page: number, size: number): Observable<PageResponse<Subject>> {
    return this.http.get<PageResponse<Subject>>(`${this.api}/subjects/page`, {
      params: { userId, page: page.toString(), size: size.toString() },
    });
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

  archiveSubject(id: string): Observable<Subject> {
    return this.http.put<Subject>(`${this.api}/subjects/${id}/archive`, {});
  }


  // Study Sessions
  getSessions(): Observable<StudySession[]> {
    return this.http.get<StudySession[]>(`${this.api}/study-sessions`);
  }

  getSessionsPage(
    userId: string,
    page: number,
    size: number,
    subjectId?: string,
    startDate?: string,
    endDate?: string,
  ): Observable<PageResponse<StudySession>> {
    let params = new HttpParams()
      .set('userId', userId)
      .set('page', page.toString())
      .set('size', size.toString());
    if (subjectId) params = params.set('subjectId', subjectId);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
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
  getTasks(
    userId: string,
    status?: string,
    priority?: string,
    search?: string,
  ): Observable<Task[]> {
    let params = new HttpParams().set('userId', userId);
    if (status) params = params.set('status', status);
    if (priority) params = params.set('priority', priority);
    if (search) params = params.set('search', search);
    return this.http
      .get<PageResponse<Task>>(`${this.api}/tasks`, { params })
      .pipe(map((res) => res.content));
  }

  getTasksPage(
    userId: string,
    page: number,
    size: number,
    status?: string,
    priority?: string,
    search?: string,
  ): Observable<PageResponse<Task>> {
    let params = new HttpParams()
      .set('userId', userId)
      .set('page', page.toString())
      .set('size', size.toString());
    if (status) params = params.set('status', status);
    if (priority) params = params.set('priority', priority);
    if (search) params = params.set('search', search);
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
    return this.http.get<PageResponse<StudyGoal>>(`${this.api}/goals/page`, {
      params: { userId, page: page.toString(), size: size.toString() },
    });
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
  updateChallengeAttempt(
    id: string,
    req: CreateChallengeAttemptRequest,
  ): Observable<ChallengeAttempt> {
    return this.http.put<ChallengeAttempt>(`${this.api}/challenge-attempts/${id}`, req);
  }

  createChallengeAttempt(
    req: CreateChallengeAttemptRequest,
    userId: string,
  ): Observable<ChallengeAttempt> {
    return this.http.post<ChallengeAttempt>(`${this.api}/challenge-attempts`, { ...req, userId });
  }

  getChallengeStats(): Observable<ChallengeStats> {
    return this.http.get<ChallengeStats>(`${this.api}/challenge-attempts/stats`);
  }

  getHistory(skillCategory?: string): Observable<ChallengeAttempt[]> {
    let params = new HttpParams();
    if (skillCategory) params = params.set('skillCategory', skillCategory);
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

  rechallengeErrorLog(id: string): Observable<any> {
    return this.http.post<any>(`${this.api}/error-logs/${id}/rechallenge`, {});
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

  // Export Data
  exportData(): Observable<unknown> {
    return this.http.get<unknown>(`${this.api}/export`);
  }

  // Achievements
  getAchievements(): Observable<Achievement[]> {
    return this.http.get<Achievement[]>(`${this.api}/users/achievements`);
  }

  // Flashcards
  getFlashcards(): Observable<Flashcard[]> {
    return this.http.get<Flashcard[]>(`${this.api}/flashcards`);
  }

  getDueFlashcards(): Observable<Flashcard[]> {
    return this.http.get<Flashcard[]>(`${this.api}/flashcards/due`);
  }

  createFlashcard(req: CreateFlashcardRequest): Observable<Flashcard> {
    return this.http.post<Flashcard>(`${this.api}/flashcards`, req);
  }

  updateFlashcard(id: string, req: CreateFlashcardRequest): Observable<Flashcard> {
    return this.http.put<Flashcard>(`${this.api}/flashcards/${id}`, req);
  }

  deleteFlashcard(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/flashcards/${id}`);
  }

  reviewFlashcard(id: string, rating: number): Observable<Flashcard> {
    return this.http.post<Flashcard>(`${this.api}/flashcards/${id}/review`, { rating });
  }

  post<T>(url: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.api}${url}`, body);
  }

  // Leaderboard
  getLeaderboard(): Observable<User[]> {
    return this.http.get<User[]>(`${this.api}/users/leaderboard`);
  }

  // Shop
  buyTitle(title: string, cost: number): Observable<User> {
    return this.http.post<User>(`${this.api}/users/buy-title`, { title, cost });
  }

  buyBorder(border: string, cost: number): Observable<User> {
    return this.http.post<User>(`${this.api}/users/buy-border`, { border, cost });
  }

  // Daily Quest
  claimDailyQuest(): Observable<User> {
    return this.http.post<User>(`${this.api}/users/daily-quest-claim`, {});
  }
}
