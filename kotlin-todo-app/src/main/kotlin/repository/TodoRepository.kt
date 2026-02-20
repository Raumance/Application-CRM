package repository

import com.mongodb.client.model.Filters.eq
import com.mongodb.kotlin.client.coroutine.MongoCollection
import kotlinx.coroutines.flow.toList
import model.Todo

class TodoRepository(private val collection: MongoCollection<Todo>) {

    suspend fun findAll(): List<Todo> = collection.find().toList()

    suspend fun findById(id: String): Todo? = collection.find(eq("_id", id)).firstOrNull()

    suspend fun insert(todo: Todo): Todo {
        collection.insertOne(todo)
        return todo
    }

    suspend fun update(id: String, title: String? = null, completed: Boolean? = null): Todo? {
        val existing = findById(id) ?: return null
        val updated = existing.copy(
            title = title ?: existing.title,
            completed = completed ?: existing.completed
        )
        collection.replaceOne(eq("_id", id), updated)
        return updated
    }

    suspend fun delete(id: String): Boolean {
        val result = collection.deleteOne(eq("_id", id))
        return result.deletedCount == 1L
    }
}
