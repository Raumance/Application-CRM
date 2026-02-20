package model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import org.bson.types.ObjectId

@Serializable
data class Todo(
    @SerialName("_id") val id: String = ObjectId().toString(),
    val title: String,
    val completed: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
) {
    fun toDto() = TodoDto(id, title, completed, createdAt)
}
