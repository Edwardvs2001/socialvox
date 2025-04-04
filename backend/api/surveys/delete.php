
<?php
// Incluir archivos necesarios
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../models/Survey.php';

// Instanciar base de datos y objeto Survey
$database = new Database();
$db = $database->getConnection();

$survey = new Survey($db);

// Obtener ID de la encuesta a eliminar
$data = json_decode(file_get_contents("php://input"));

// Verificar que se proporcionó un ID
if (!isset($data->id) && !isset($_GET['id'])) {
    http_response_code(400);
    echo json_encode(array("message" => "Se requiere un ID de encuesta para eliminar."));
    exit();
}

// Asignar ID al objeto
$survey->id = isset($data->id) ? $data->id : $_GET['id'];

// Eliminar la encuesta
if ($survey->delete()) {
    http_response_code(200);
    echo json_encode(array(
        "status" => "success",
        "message" => "Encuesta eliminada con éxito",
        "id" => $survey->id
    ));
} else {
    http_response_code(503);
    echo json_encode(array(
        "status" => "error",
        "message" => "No se pudo eliminar la encuesta."
    ));
}
?>
