
<?php
// Incluir archivos necesarios
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../models/User.php';

// Instanciar base de datos y objeto User
$database = new Database();
$db = $database->getConnection();

$user = new User($db);

// Obtener los datos enviados
$data = json_decode(file_get_contents("php://input"));

// Asegurarse de que los datos no estén vacíos
if(!empty($data->username) && !empty($data->password)) {
    $user->username = $data->username;
    $user->password = $data->password;
    
    // Intentar autenticar
    if($user->login()) {
        // Crear respuesta
        $response = array(
            "status" => "success",
            "message" => "Inicio de sesión exitoso.",
            "user" => array(
                "id" => $user->id,
                "username" => $user->username,
                "name" => $user->name,
                "email" => $user->email,
                "role" => $user->role
            )
        );
        
        http_response_code(200);
        echo json_encode($response);
    } else {
        http_response_code(401);
        echo json_encode(array(
            "status" => "error",
            "message" => "Nombre de usuario o contraseña incorrectos."
        ));
    }
} else {
    http_response_code(400);
    echo json_encode(array(
        "status" => "error",
        "message" => "No se pudo autenticar. Los datos están incompletos."
    ));
}
?>
