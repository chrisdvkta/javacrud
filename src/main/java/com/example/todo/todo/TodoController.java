package com.example.todo.todo;

import com.example.todo.security.CustomUserDetails;
import com.example.todo.user.User;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoRepository todoRepository;

    public TodoController(TodoRepository todoRepository) {
        this.todoRepository = todoRepository;
    }

    @GetMapping
    public List<TodoResponse> list(Authentication authentication) {
        User user = currentUser(authentication);
        return todoRepository.findByOwner(user).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<TodoResponse> create(@Valid @RequestBody TodoRequest request, Authentication authentication) {
        User user = currentUser(authentication);
        Todo todo = new Todo(request.title(), request.description(), user);
        todo.setCompleted(request.completed());
        Todo saved = todoRepository.save(todo);
        return ResponseEntity.ok(toResponse(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TodoResponse> update(@PathVariable("id") Long id, @Valid @RequestBody TodoRequest request, Authentication authentication) {
        User user = currentUser(authentication);
        Optional<Todo> optional = todoRepository.findById(id);
        if (optional.isEmpty() || !optional.get().getOwner().getId().equals(user.getId())) {
            return ResponseEntity.status(404).build();
        }
        Todo todo = optional.get();
        todo.setTitle(request.title());
        todo.setDescription(request.description());
        todo.setCompleted(request.completed());
        Todo saved = todoRepository.save(todo);
        return ResponseEntity.ok(toResponse(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id, Authentication authentication) {
        User user = currentUser(authentication);
        Optional<Todo> optional = todoRepository.findById(id);
        if (optional.isEmpty() || !optional.get().getOwner().getId().equals(user.getId())) {
            return ResponseEntity.status(404).build();
        }
        todoRepository.delete(optional.get());
        return ResponseEntity.noContent().build();
    }

    private User currentUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails principal)) {
            throw new RuntimeException("Unauthenticated");
        }
        return principal.getUser();
    }

    private TodoResponse toResponse(Todo todo) {
        return new TodoResponse(
                todo.getId(),
                todo.getTitle(),
                todo.getDescription(),
                todo.isCompleted(),
                todo.getCreatedAt(),
                todo.getUpdatedAt()
        );
    }
}
