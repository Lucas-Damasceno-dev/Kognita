import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { Task } from '../models/task';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch tasks for a given user', () => {
    const dummyTasks: Task[] = [
      {
        id: '1',
        title: 'Task 1',
        description: 'Desc 1',
        status: 'pending',
        priority: 'high',
        requiresProof: false,
        userId: '123',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01'
      },
      {
        id: '2',
        title: 'Task 2',
        description: 'Desc 2',
        status: 'completed',
        priority: 'low',
        requiresProof: true,
        userId: '123',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01'
      },
    ];

    const userId = '123';
    
    // In api.service.ts getTasks returns PageResponse content so we mock PageResponse
    const mockResponse = {
      content: dummyTasks,
      totalElements: 2,
      totalPages: 1,
      size: 10,
      number: 0
    };

    service.getTasks(userId).subscribe((tasks) => {
      expect(tasks.length).toBe(2);
      expect(tasks).toEqual(dummyTasks);
    });

    const req = httpMock.expectOne(`/api/tasks?userId=${userId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should fetch tasks with optional parameters', () => {
    const userId = '123';
    const status = 'pending';
    const priority = 'high';
    const search = 'test';
    
    const mockResponse = { content: [] };

    service.getTasks(userId, status, priority, search).subscribe();

    const req = httpMock.expectOne(`/api/tasks?userId=${userId}&status=${status}&priority=${priority}&search=${search}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should export data correctly', () => {
    const mockExportData = {
      profile: { id: '1', name: 'User' },
      tasks: [],
      subjects: []
    };

    service.exportData().subscribe((data) => {
      expect(data).toEqual(mockExportData);
    });

    const req = httpMock.expectOne('/api/export');
    expect(req.request.method).toBe('GET');
    req.flush(mockExportData);
  });
});
