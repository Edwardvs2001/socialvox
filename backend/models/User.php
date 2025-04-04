
<?php
class User {
    private $conn;
    private $table_name = "users";

    public $id;
    public $username;
    public $password;
    public $role;
    public $name;
    public $email;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Obtener todos los usuarios
    public function read() {
        $query = "SELECT id, username, role, name, email, created_at FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Verificar credenciales de usuario
    public function login() {
        $query = "SELECT id, username, password, role, name, email 
                FROM " . $this->table_name . " 
                WHERE username = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->username);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->id = $row['id'];
            $this->role = $row['role'];
            $this->name = $row['name'];
            $this->email = $row['email'];
            
            // Verificar contraseña
            if(password_verify($this->password, $row['password'])) {
                return true;
            }
        }
        return false;
    }
    
    // Crear un nuevo usuario
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                SET username=:username, password=:password, role=:role, 
                    name=:name, email=:email, created_at=:created_at";
        
        $stmt = $this->conn->prepare($query);
        
        // Sanitizar datos
        $this->username = htmlspecialchars(strip_tags($this->username));
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->role = htmlspecialchars(strip_tags($this->role));
        
        // Hash de contraseña
        $password_hash = password_hash($this->password, PASSWORD_DEFAULT);
        
        // Vincular valores
        $stmt->bindParam(":username", $this->username);
        $stmt->bindParam(":password", $password_hash);
        $stmt->bindParam(":role", $this->role);
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":created_at", $this->created_at);
        
        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>
