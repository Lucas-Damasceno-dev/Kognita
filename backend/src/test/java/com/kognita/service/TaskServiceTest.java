package com.kognita.service;

import com.kognita.dto.CreateTaskRequest;
import com.kognita.dto.TaskResponse;
import com.kognita.model.Subject;
import com.kognita.model.Task;
import com.kognita.model.User;
import com.kognita.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private SubjectService subjectService;

    @Mock
    private UserService userService;

    @InjectMocks
    private TaskService taskService;

    private User testUser;
    private Task testTask;
    private UUID userId;
    private UUID taskId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        taskId = UUID.randomUUID();

        testUser = new User();
        testUser.setId(userId);
        testUser.setName("Test User");

        testTask = new Task();
        testTask.setId(taskId);
        testTask.setTitle("Test Task");
        testTask.setDescription("Test Description");
        testTask.setStatus("pending");
        testTask.setPriority("high");
        testTask.setUser(testUser);
    }

    @Test
    void findAllByUser_ShouldReturnPagedTasks() {
        PageRequest pageRequest = PageRequest.of(0, 10);
        Page<Task> page = new PageImpl<>(List.of(testTask));
        when(taskRepository.findByUserId(userId, pageRequest)).thenReturn(page);

        Page<TaskResponse> result = taskService.findAllByUser(userId, pageRequest);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(testTask.getTitle(), result.getContent().get(0).title());
        verify(taskRepository).findByUserId(userId, pageRequest);
    }

    @Test
    void getPracticeTasks_ShouldReturnMaxThreeRandomTasks() {
        Task task2 = new Task();
        task2.setId(UUID.randomUUID());
        task2.setTitle("Task 2");
        task2.setUser(testUser);

        when(taskRepository.findByUserId(userId)).thenReturn(new java.util.ArrayList<>(List.of(testTask, task2)));

        List<TaskResponse> result = taskService.getPracticeTasks(userId);

        assertNotNull(result);
        assertTrue(result.size() <= 3);
        verify(taskRepository).findByUserId(userId);
    }

    @Test
    void findById_ShouldReturnTask_WhenFound() {
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));

        TaskResponse result = taskService.findById(taskId, userId);

        assertNotNull(result);
        assertEquals(taskId, result.id());
        assertEquals("Test Task", result.title());
    }

    @Test
    void create_ShouldSaveAndReturnTask() {
        CreateTaskRequest request = new CreateTaskRequest("New Task", "Desc", "pending", "low", null, LocalDate.now(), "Frontend", null);
        
        when(userService.findEntityById(userId)).thenReturn(testUser);
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> {
            Task t = invocation.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });

        TaskResponse result = taskService.create(request, userId);

        assertNotNull(result);
        assertEquals("New Task", result.title());
        assertEquals("Desc", result.description());
        assertEquals("pending", result.status());
        assertEquals("low", result.priority());
        assertEquals("Frontend", result.skillCategory());
        
        verify(taskRepository).save(any(Task.class));
    }
    
    @Test
    void create_WithSubject_ShouldSaveAndReturnTask() {
        UUID subjectId = UUID.randomUUID();
        CreateTaskRequest request = new CreateTaskRequest("New Task", "Desc", "pending", "low", subjectId, LocalDate.now(), "Frontend", null);
        
        Subject subject = new Subject();
        subject.setId(subjectId);
        subject.setUser(testUser);
        
        when(userService.findEntityById(userId)).thenReturn(testUser);
        when(subjectService.findEntityById(subjectId)).thenReturn(subject);
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> {
            Task t = invocation.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });

        TaskResponse result = taskService.create(request, userId);

        assertNotNull(result);
        assertEquals(subjectId, result.subjectId());
        verify(taskRepository).save(any(Task.class));
    }

    @Test
    void update_ShouldModifyAndReturnTask() {
        CreateTaskRequest request = new CreateTaskRequest("Updated Task", "Updated Desc", "completed", "medium", null, LocalDate.now(), "Backend", true);
        
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
        when(taskRepository.save(any(Task.class))).thenReturn(testTask);

        TaskResponse result = taskService.update(taskId, request, userId);

        assertNotNull(result);
        assertEquals("Updated Task", testTask.getTitle());
        assertEquals("Updated Desc", testTask.getDescription());
        assertEquals("completed", testTask.getStatus());
        assertEquals("medium", testTask.getPriority());
        assertTrue(testTask.isRequiresProof());
        verify(taskRepository).save(testTask);
    }

    @Test
    void updateStatus_ShouldModifyStatusOnly() {
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
        when(taskRepository.save(any(Task.class))).thenReturn(testTask);

        TaskResponse result = taskService.updateStatus(taskId, "in-progress", userId);

        assertNotNull(result);
        assertEquals("in-progress", testTask.getStatus());
        verify(taskRepository).save(testTask);
    }

    @Test
    void findAllByUserFiltered_ShouldReturnFilteredPage() {
        PageRequest pageRequest = PageRequest.of(0, 10);
        Page<Task> page = new PageImpl<>(List.of(testTask));
        when(taskRepository.findFiltered(userId, "pending", "high", "Test", pageRequest)).thenReturn(page);

        Page<TaskResponse> result = taskService.findAllByUserFiltered(userId, "pending", "high", "Test", pageRequest);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(taskRepository).findFiltered(userId, "pending", "high", "Test", pageRequest);
    }
    
    @Test
    void findEntityById_ShouldReturnTask_WhenFound() {
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
        
        Task result = taskService.findEntityById(taskId);
        
        assertNotNull(result);
        assertEquals(taskId, result.getId());
    }

    @Test
    void delete_ShouldCallRepositoryDelete() {
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
        taskService.delete(taskId, userId);
        verify(taskRepository).delete(testTask);
    }
}
