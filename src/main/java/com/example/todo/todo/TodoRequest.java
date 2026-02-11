package com.example.todo.todo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TodoRequest(
        @NotBlank @Size(min = 1, max = 200) String title,
        @Size(max = 2000) String description,
        boolean completed
) {}
