
<?php
// Página de inicio del API
header("Content-Type: application/json; charset=UTF-8");
echo json_encode(array(
    "status" => "success",
    "message" => "API de Encuestas v1.0",
    "timestamp" => date("Y-m-d H:i:s")
));
?>
