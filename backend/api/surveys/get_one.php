
<?php
// Incluir archivos necesarios
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../models/Survey.php';

// Instanciar base de datos y objeto Survey
$database = new Database();
$db = $database->getConnection();

$survey = new Survey($db);

// Obtener ID de la encuesta
$survey->id = isset($_GET['id']) ? $_GET['id'] : die(json_encode(array("message" => "ID no proporcionado")));

// Leer los detalles de la encuesta
if($survey->readOne()) {
    // Crear array
    $survey_arr = array(
        "id" =>  $survey->id,
        "title" => $survey->title,
        "description" => $survey->description,
        "isActive" => $survey->is_active == 1,
        "createdAt" => $survey->created_at,
        "assignedTo" => $survey->assigned_to
    );

    http_response_code(200);
    echo json_encode($survey_arr);
} else {
    http_response_code(404);
    echo json_encode(array("message" => "Encuesta no encontrada."));
}
?>
