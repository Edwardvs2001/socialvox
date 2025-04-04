
<?php
// Incluir archivos necesarios
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../models/Survey.php';

// Instanciar base de datos y objeto Survey
$database = new Database();
$db = $database->getConnection();

$survey = new Survey($db);

// Obtener datos
$stmt = $survey->read();
$num = $stmt->rowCount();

if($num > 0) {
    $surveys_arr = array();
    $surveys_arr["records"] = array();

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);
        
        $survey_item = array(
            "id" => $id,
            "title" => $title,
            "description" => $description,
            "isActive" => $is_active == 1,
            "createdAt" => $created_at,
            "assignedTo" => json_decode($assigned_to)
        );

        array_push($surveys_arr["records"], $survey_item);
    }

    http_response_code(200);
    echo json_encode($surveys_arr);
} else {
    http_response_code(404);
    echo json_encode(array("message" => "No se encontraron encuestas."));
}
?>
