
<?php
// Incluir archivos necesarios
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../models/Survey.php';

// Instanciar base de datos y objeto Survey
$database = new Database();
$db = $database->getConnection();

$survey = new Survey($db);

// Obtener los datos enviados
$data = json_decode(file_get_contents("php://input"));

// Asegurarse de que los datos no estén vacíos
if(
    !empty($data->title) &&
    !empty($data->description)
) {
    // Asignar valores a las propiedades del objeto
    $survey->title = $data->title;
    $survey->description = $data->description;
    $survey->is_active = isset($data->isActive) ? $data->isActive : true;
    $survey->created_at = date('Y-m-d H:i:s');
    $survey->assigned_to = isset($data->assignedTo) ? $data->assignedTo : array();
    
    // Crear la encuesta
    if($survey->create()) {
        http_response_code(201);
        echo json_encode(array("message" => "Encuesta creada con éxito."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "No se pudo crear la encuesta."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "No se pudo crear la encuesta. Los datos están incompletos."));
}
?>
