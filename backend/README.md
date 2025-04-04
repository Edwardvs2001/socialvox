
# Backend PHP para Aplicación de Encuestas

Este backend en PHP está diseñado para trabajar con la aplicación React de encuestas.

## Configuración

1. Importar el archivo `db_setup.sql` en MySQL/MariaDB para crear la base de datos y tablas
2. Configurar los datos de conexión a la base de datos en `config/database.php`
3. Colocar los archivos en un servidor PHP (Apache/Nginx) con PHP 7.4+ y extensiones PDO habilitadas

## Endpoints API

### Encuestas
- `GET /api/surveys/get.php` - Obtener todas las encuestas
- `GET /api/surveys/get_one.php?id=X` - Obtener una encuesta específica
- `POST /api/surveys/create.php` - Crear una nueva encuesta

### Respuestas
- `GET /api/responses/get_by_survey.php?survey_id=X` - Obtener respuestas de una encuesta
- `POST /api/responses/create.php` - Guardar una nueva respuesta

### Autenticación
- `POST /api/auth/login.php` - Iniciar sesión

## Seguridad
- El backend implementa validación básica y sanitización de datos
- Se utiliza password_hash() para almacenar contraseñas de manera segura
- Los datos JSON se procesan adecuadamente para almacenamiento y recuperación

## Integración con Frontend React
La API incluye cabeceras CORS que permiten la comunicación desde cualquier origen.
Para producción, restringe los orígenes en `config/cors.php`.

## Usuario por defecto
- Username: admin
- Password: admin123
