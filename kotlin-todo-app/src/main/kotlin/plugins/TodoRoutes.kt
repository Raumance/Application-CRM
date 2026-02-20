package plugins

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import model.CreateTodoRequest
import model.Todo
import model.UpdateTodoRequest
import repository.TodoRepository

fun Application.configureTodoRoutes(repository: TodoRepository) {
    routing {
        route("/api/todos") {
            get {
                val todos = repository.findAll()
                call.respond(todos.map { it.toDto() })
            }

            get("/{id}") {
                val id = call.parameters["id"] ?: return@get call.respond(HttpStatusCode.BadRequest)
                val todo = repository.findById(id)
                if (todo == null) {
                    call.respond(HttpStatusCode.NotFound)
                } else {
                    call.respond(todo.toDto())
                }
            }

            post {
                val request = call.receive<CreateTodoRequest>()
                if (request.title.isBlank()) {
                    return@post call.respond(HttpStatusCode.BadRequest, mapOf("error" to "title is required"))
                }
                val todo = Todo(title = request.title.trim())
                val created = repository.insert(todo)
                call.respond(HttpStatusCode.Created, created.toDto())
            }

            put("/{id}") {
                val id = call.parameters["id"] ?: return@put call.respond(HttpStatusCode.BadRequest)
                val request = call.receiveOrNull<UpdateTodoRequest>() ?: UpdateTodoRequest()
                val updated = repository.update(id, request.title, request.completed)
                if (updated == null) {
                    call.respond(HttpStatusCode.NotFound)
                } else {
                    call.respond(updated.toDto())
                }
            }

            delete("/{id}") {
                val id = call.parameters["id"] ?: return@delete call.respond(HttpStatusCode.BadRequest)
                val deleted = repository.delete(id)
                if (deleted) {
                    call.respond(HttpStatusCode.NoContent)
                } else {
                    call.respond(HttpStatusCode.NotFound)
                }
            }
        }
    }
}
