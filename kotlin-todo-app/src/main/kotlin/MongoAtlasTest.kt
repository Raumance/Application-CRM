import com.mongodb.ConnectionString
import com.mongodb.MongoClientSettings
import com.mongodb.ServerApi
import com.mongodb.ServerApiVersion
import com.mongodb.kotlin.client.coroutine.MongoClient
import kotlinx.coroutines.runBlocking
import org.bson.Document

/**
 * Test de connexion à MongoDB Atlas.
 * Remplacez <db_password> dans MONGODB_URI par votre mot de passe.
 *
 * Pour exécuter : gradlew run -PmainClass=MongoAtlasTestKt
 * Ou définir MONGODB_URI puis : gradlew run -PmainClass=MongoAtlasTestKt
 */
fun main() = runBlocking {
    val connectionString = System.getenv("MONGODB_URI")
        ?: "mongodb+srv://rnguema288:<db_password>@nguema.dwb0ofa.mongodb.net/?appName=Nguema"

    val serverApi = ServerApi.builder()
        .version(ServerApiVersion.V1)
        .build()

    val mongoClientSettings = MongoClientSettings.builder()
        .applyConnectionString(ConnectionString(connectionString))
        .serverApi(serverApi)
        .build()

    MongoClient.create(mongoClientSettings).use { mongoClient ->
        val database = mongoClient.getDatabase("admin")
        database.runCommand(Document("ping", 1))
        println("✅ Ping réussi. Connecté à MongoDB Atlas !")
    }
}
