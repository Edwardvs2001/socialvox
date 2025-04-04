
<?php
// Incluir archivos necesarios
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../models/SurveyResponse.php';

// Instanciar base de datos y objeto SurveyResponse
$database = new Database();
$db = $database->getConnection();

$response = new SurveyResponse($db);

// Obtener los datos enviados
$data = json_decode(file_get_contents("php://input"));

// Asegurarse de que los datos no estén vacíos
if(
    !empty($data->surveyId) &&
    !empty($data->responseData)
) {
    // Asignar valores a las propiedades del objeto
    $response->survey_id = $data->surveyId;
    $response->response_data = $data->responseData;
    $response->created_at = date('Y-m-d H:i:s');
    $response->created_by = isset($data->createdBy) ? $data->createdBy : null;
    
    // Crear la respuesta
    if($response->create()) {
        http_response_code(201);
        echo json_encode(array("message" => "Respuesta guardada con éxito."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "No se pudo guardar la respuesta."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "No se pudo guardar la respuesta. Los datos están incompletos."));
}
?>
