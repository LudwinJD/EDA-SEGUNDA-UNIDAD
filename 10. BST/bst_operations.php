<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "biblioteca";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if ($_POST["action"] == "insert") {
        $id = intval($_POST["id"]);
        $titulo = $_POST["titulo"];
        $autor = $_POST["autor"];
        $portada = $_POST["portada"];
        
        $sql = "INSERT INTO libros (id, titulo, autor, portada) VALUES (?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("isss", $id, $titulo, $autor, $portada);
        
        if ($stmt->execute()) {
            echo "success";
        } else {
            echo "error";
        }
        $stmt->close();
    } elseif ($_POST["action"] == "delete") {
        $id = intval($_POST["id"]);
        
        $sql = "DELETE FROM libros WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            echo "success";
        } else {
            echo "error";
        }
        $stmt->close();
    }
} elseif ($_SERVER["REQUEST_METHOD"] == "GET" && $_GET["action"] == "load") {
    $sql = "SELECT * FROM libros ORDER BY id";
    $result = $conn->query($sql);
    
    $books = array();
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $row['id'] = intval($row['id']);
            $books[] = $row;
        }
    }
    echo json_encode($books);
}

$conn->close();
?>