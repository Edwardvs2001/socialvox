
<?php
class Survey {
    private $conn;
    private $table_name = "surveys";

    public $id;
    public $title;
    public $description;
    public $is_active;
    public $created_at;
    public $assigned_to;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Obtener todas las encuestas
    public function read() {
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Obtener una encuesta por ID
    public function readOne() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if($row) {
            $this->title = $row['title'];
            $this->description = $row['description'];
            $this->is_active = $row['is_active'];
            $this->created_at = $row['created_at'];
            $this->assigned_to = json_decode($row['assigned_to']);
            return true;
        }
        return false;
    }

    // Crear una nueva encuesta
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                SET title=:title, description=:description, 
                    is_active=:is_active, created_at=:created_at, 
                    assigned_to=:assigned_to";
        
        $stmt = $this->conn->prepare($query);
        
        // Sanitizar datos
        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $assigned_to_json = json_encode($this->assigned_to);
        
        // Vincular valores
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":is_active", $this->is_active);
        $stmt->bindParam(":created_at", $this->created_at);
        $stmt->bindParam(":assigned_to", $assigned_to_json);
        
        if($stmt->execute()) {
            return true;
        }
        return false;
    }
    
    // Actualizar una encuesta
    public function update() {
        $query = "UPDATE " . $this->table_name . "
                SET title=:title, description=:description, 
                    is_active=:is_active, assigned_to=:assigned_to
                WHERE id=:id";
        
        $stmt = $this->conn->prepare($query);
        
        // Sanitizar datos
        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $assigned_to_json = json_encode($this->assigned_to);
        
        // Vincular valores
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":is_active", $this->is_active);
        $stmt->bindParam(":assigned_to", $assigned_to_json);
        $stmt->bindParam(":id", $this->id);
        
        if($stmt->execute()) {
            return true;
        }
        return false;
    }
    
    // Eliminar una encuesta
    public function delete() {
        try {
            $query = "DELETE FROM " . $this->table_name . " WHERE id = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(1, $this->id);
            
            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $exception) {
            // Registrar el error pero no devolverlo directamente (por seguridad)
            error_log("Error en delete(): " . $exception->getMessage());
            return false;
        }
    }
}
?>
