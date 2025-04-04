
<?php
class SurveyResponse {
    private $conn;
    private $table_name = "survey_responses";

    public $id;
    public $survey_id;
    public $response_data;
    public $created_at;
    public $created_by;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Obtener todas las respuestas de una encuesta
    public function readBySurvey() {
        $query = "SELECT * FROM " . $this->table_name . " 
                WHERE survey_id = ? ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->survey_id);
        $stmt->execute();
        return $stmt;
    }

    // Crear una nueva respuesta
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                SET survey_id=:survey_id, response_data=:response_data, 
                    created_at=:created_at, created_by=:created_by";
        
        $stmt = $this->conn->prepare($query);
        
        // Convertir datos de respuesta a JSON
        $response_data_json = json_encode($this->response_data);
        
        // Vincular valores
        $stmt->bindParam(":survey_id", $this->survey_id);
        $stmt->bindParam(":response_data", $response_data_json);
        $stmt->bindParam(":created_at", $this->created_at);
        $stmt->bindParam(":created_by", $this->created_by);
        
        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>
