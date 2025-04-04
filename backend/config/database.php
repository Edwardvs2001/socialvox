
<?php
class Database {
    private $host = "localhost";
    private $db_name = "encuestas_db";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->exec("set names utf8");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            echo json_encode(array(
                "status" => "error",
                "message" => "Error de conexión: " . $exception->getMessage()
            ));
            die();
        }
        return $this->conn;
    }
}
?>
