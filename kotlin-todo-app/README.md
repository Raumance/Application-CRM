# Todo List - Kotlin + MongoDB

Application todo list construite avec **Kotlin**, **Ktor** et **MongoDB Atlas**.

## Prérequis

- JDK 17+
- MongoDB Atlas (cluster configuré dans MCP)

## Configuration

1. Créez un fichier `.env` ou définissez la variable d'environnement :
   ```
   MONGODB_URI=mongodb+srv://rnguema288:VOTRE_MOT_DE_PASSE@nguema.dwb0ofa.mongodb.net/
   ```

2. Remplacez `VOTRE_MOT_DE_PASSE` par le mot de passe de votre utilisateur Atlas.
   - Si le mot de passe contient des caractères spéciaux (`@`, `#`, `:`), encodez-les en URL.

## Lancer l'application

**Première fois** : générez le wrapper Gradle (si Gradle est installé) :
```bash
gradle wrapper
```

Puis :
```bash
./gradlew run          # Linux/macOS
gradlew.bat run       # Windows
```

Ou ouvrez le projet dans **IntelliJ IDEA** et exécutez la tâche `run`.

Ou avec la variable d'environnement :
```bash
# Windows PowerShell
$env:MONGODB_URI="mongodb+srv://rnguema288:xxx@nguema.dwb0ofa.mongodb.net/"; ./gradlew run

# Linux / macOS
MONGODB_URI="mongodb+srv://..." ./gradlew run
```

L'application sera accessible sur **http://localhost:8080**

## API REST

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/todos` | Liste toutes les tâches |
| GET | `/api/todos/{id}` | Récupère une tâche |
| POST | `/api/todos` | Crée une tâche `{"title": "..."}` |
| PUT | `/api/todos/{id}` | Met à jour `{"title": "...", "completed": true}` |
| DELETE | `/api/todos/{id}` | Supprime une tâche |

## Stack technique

- **Kotlin** 2.0
- **Ktor** - Serveur web
- **MongoDB Kotlin Driver** (coroutines)
- **kotlinx.serialization** - JSON
