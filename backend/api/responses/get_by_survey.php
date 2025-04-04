
<?php
// Incluir archivos necesarios
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../models/SurveyResponse.php';

// Instanciar base de datos y objeto SurveyResponse
$database = new Database();
$db = $database->getConnection();

$response = new SurveyResponse($db);

// Obtener ID de la encuesta
$response->survey_id = isset($_GET['survey_id']) ? $_GET['survey_id'] : die(json_encode(array("message" => "ID de encuesta no proporcionado")));

// Leer las respuestas
$stmt = $response->readBySurvey();
$num = $stmt->rowCount();

if($num > 0) {
    $responses_arr = array();
    $responses_arr["records"] = array();

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);
        
        $response_item = array(
            "id" => $id,
            "surveyId" => $survey_id,
            "responseData" => json_decode($response_data),
            "createdAt" => $created_at,
            "createdBy" => $created_by
        );

        array_push($responses_arr["records"], $response_item);
    }

    http_response_code(200);
    echo json_encode($responses_arr);
} else {
    http_response_code(404);
    echo json_encode(array("message" => "No se encontraron respuestas para esta encuesta."));
}
?>
