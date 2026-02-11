package com.example.todo.todo;

import java.time.Instant;

public record TodoResponse(Long id, String title, String description, boolean completed, Instant createdAt, Instant updatedAt) {}
