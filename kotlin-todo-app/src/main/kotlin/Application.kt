import com.mongodb.kotlin.client.coroutine.MongoClient
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.plugins.defaultheaders.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.json.Json
import plugins.configureTodoRoutes
import repository.TodoRepository

fun main() {
    embeddedServer(Netty, port = 8080, host = "0.0.0.0") {
        configureSerialization()
        configureCors()
        configureDefaultHeaders()
        configureStatusPages()
        configureRouting()
    }.start(wait = true)
}

fun Application.configureSerialization() {
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            isLenient = true
            ignoreUnknownKeys = true
        })
    }
}

fun Application.configureCors() {
    install(CORS) {
        allowMethod(HttpMethod.Options)
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)
        allowHeader(HttpHeaders.Authorization)
        allowHeader(HttpHeaders.ContentType)
        anyHost()
    }
}

fun Application.configureDefaultHeaders() {
    install(DefaultHeaders) {
        header("X-Application", "Kotlin Todo API")
    }
}

fun Application.configureStatusPages() {
    install(StatusPages) {
        exception<Throwable> { call, cause ->
            call.respond(HttpStatusCode.InternalServerError, mapOf("error" to (cause.message ?: "Unknown error")))
        }
    }
}

fun Application.configureRouting() {
    val connectionString = System.getenv("MONGODB_URI")
        ?: "mongodb+srv://rnguema288:<db_password>@nguema.dwb0ofa.mongodb.net/"
    
    val client = MongoClient.create(connectionString)
    val database = client.getDatabase("todo_db")
    val todoCollection = database.getCollection<model.Todo>("todos")
    val repository = TodoRepository(todoCollection)

    routing {
        get("/") {
            call.respondRedirect("/index.html", permanent = false)
        }
        static {
            resources("static")
        }
        configureTodoRoutes(repository)
    }
}
