package model

import kotlinx.serialization.Serializable

@Serializable
data class TodoDto(
    val id: String,
    val title: String,
    val completed: Boolean,
    val createdAt: Long
)

@Serializable
data class CreateTodoRequest(val title: String)

@Serializable
data class UpdateTodoRequest(val title: String? = null, val completed: Boolean? = null)
