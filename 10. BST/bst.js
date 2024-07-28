class Node {
    constructor(id, titulo, autor, portada) {
        this.id = id;
        this.titulo = titulo;
        this.autor = autor;
        this.portada = portada;
        this.left = null;
        this.right = null;
    }
}

class BST {
    constructor() {
        this.root = null;
    }

    insert(id, titulo, autor, portada) {
        const newNode = new Node(id, titulo, autor, portada);
        if (this.root === null) {
            this.root = newNode;
        } else {
            this.insertNode(this.root, newNode);
        }
    }

    insertNode(node, newNode) {
        if (newNode.id < node.id) {
            if (node.left === null) {
                node.left = newNode;
            } else {
                this.insertNode(node.left, newNode);
            }
        } else if (newNode.id > node.id) {
            if (node.right === null) {
                node.right = newNode;
            } else {
                this.insertNode(node.right, newNode);
            }
        }
        // Si los IDs son iguales, no insertamos el nodo (evitamos duplicados)
    }

    search(id, callback) {
        let steps = [];
        const startTime = performance.now();
        const result = this.searchNode(this.root, id, steps);
        const endTime = performance.now();
        const searchTime = endTime - startTime;
        if (callback) callback(result, searchTime, steps);
        return result;
    }

    searchNode(node, id, steps) {
        if (node === null) {
            steps.push({id: null, status: 'not found'});
            return null;
        }
        steps.push({id: node.id, status: 'visiting'});
        if (id < node.id) {
            steps.push({id: node.id, status: 'going left'});
            return this.searchNode(node.left, id, steps);
        } else if (id > node.id) {
            steps.push({id: node.id, status: 'going right'});
            return this.searchNode(node.right, id, steps);
        } else {
            steps.push({id: node.id, status: 'found'});
            return node;
        }
    }

    delete(id) {
        this.root = this.deleteNode(this.root, id);
    }

    deleteNode(node, id) {
        if (node === null) {
            return null;
        }
        if (id < node.id) {
            node.left = this.deleteNode(node.left, id);
            return node;
        } else if (id > node.id) {
            node.right = this.deleteNode(node.right, id);
            return node;
        } else {
            if (node.left === null && node.right === null) {
                return null;
            }
            if (node.left === null) {
                return node.right;
            }
            if (node.right === null) {
                return node.left;
            }
            let minNode = this.findMinNode(node.right);
            node.id = minNode.id;
            node.titulo = minNode.titulo;
            node.autor = minNode.autor;
            node.portada = minNode.portada;
            node.right = this.deleteNode(node.right, minNode.id);
            return node;
        }
    }

    findMinNode(node) {
        if (node.left === null) {
            return node;
        }
        return this.findMinNode(node.left);
    }

    inorder(node, result) {
        if (node !== null) {
            this.inorder(node.left, result);
            result.push(node);
            this.inorder(node.right, result);
        }
    }
}

let bst = new BST();

$(document).ready(function() {
    loadBSTFromDB();

    $("#insertForm").submit(function(e) {
        e.preventDefault();
        let id = parseInt($("#id").val(), 10);
        let titulo = $("#titulo").val();
        let autor = $("#autor").val();
        let portada = $("#portada").val();
        
        $.post("bst_operations.php", {
            action: "insert",
            id: id,
            titulo: titulo,
            autor: autor,
            portada: portada
        }, function(data) {
            if (data === "success") {
                bst.insert(id, titulo, autor, portada);
                updateBSTContent();
                updateBSTVisualization();
                $("#insertForm")[0].reset();
                showAlert("Libro insertado con éxito", "success");
            } else {
                showAlert("Error al insertar el libro", "danger");
            }
        });
    });

    $('#bstModal').on('shown.bs.modal', function () {
        updateBSTVisualization();
    });
});

function loadBSTFromDB() {
    $.get("bst_operations.php", { action: "load" }, function(data) {
        let books = JSON.parse(data);
        bst = new BST();
        // Ordenamos los libros por ID antes de insertarlos
        books.sort((a, b) => a.id - b.id);
        books.forEach(book => {
            bst.insert(parseInt(book.id, 10), book.titulo, book.autor, book.portada);
        });
        updateBSTContent();
        updateBSTVisualization();
    });
}

function searchBook() {
    let id = parseInt($("#searchId").val(), 10);
    bst.search(id, function(book, searchTime, steps) {
        if (book) {
            $("#searchResult").html(`
                <div class="card animate__animated animate__fadeIn">
                    <img src="${book.portada}" class="card-img-top" alt="Portada de ${book.titulo}">
                    <div class="card-body">
                        <h5 class="card-title">${book.titulo}</h5>
                        <p class="card-text">ID: ${book.id}</p>
                        <p class="card-text">Autor: ${book.autor}</p>
                    </div>
                </div>
            `);
            $("#searchTime").text(`Tiempo de búsqueda: ${searchTime.toFixed(2)} ms`);
            animateSearch(steps);
        } else {
            showAlert("Libro no encontrado", "warning");
            $("#searchTime").text("");
        }
    });
}

function deleteBook() {
    let id = parseInt($("#deleteId").val(), 10);
    let book = bst.search(id);
    if (book) {
        $('#deleteModal').modal('show');
        $('#confirmDelete').off('click').on('click', function() {
            $.post("bst_operations.php", {
                action: "delete",
                id: id
            }, function(data) {
                if (data === "success") {
                    bst.delete(id);
                    updateBSTContent();
                    updateBSTVisualization();
                    $('#deleteModal').modal('hide');
                    showAlert("Libro eliminado con éxito", "success");
                } else {
                    showAlert("Error al eliminar el libro", "danger");
                }
            });
        });
    } else {
        showAlert("Libro no encontrado", "warning");
    }
}

function updateBSTContent() {
    let result = [];
    bst.inorder(bst.root, result);
    let html = "";
    result.forEach(node => {
        html += `
            <div class="col-md-3 mb-4">
                <div class="card book-card animate__animated animate__fadeIn">
                    <img src="${node.portada}" class="card-img-top" alt="Portada de ${node.titulo}">
                    <div class="card-body">
                        <h5 class="card-title">${node.titulo}</h5>
                        <p class="card-text">ID: ${node.id}</p>
                        <p class="card-text">Autor: ${node.autor}</p>
                    </div>
                </div>
            </div>
        `;
    });
    $("#bstContent").html(html);
}

function showAlert(message, type) {
    const alertDiv = $(`<div class="alert alert-${type} alert-dismissible fade show animate__animated animate__fadeIn" role="alert">
                           ${message}
                           <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                       </div>`);
    $(".container").prepend(alertDiv);
    setTimeout(() => {
        alertDiv.removeClass('animate__fadeIn').addClass('animate__fadeOut');
        setTimeout(() => {
            alertDiv.alert('close');
        }, 500);
    }, 3000);
}

function updateBSTVisualization() {
    const width = 800;
    const height = 600;
    const margin = {top: 20, right: 90, bottom: 30, left: 90};

    d3.select("#bstVisualization").selectAll("*").remove();

    const svg = d3.select("#bstVisualization")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const treeLayout = d3.tree().size([height, width - 160]);

    const root = d3.hierarchy(bst.root);
    const treeData = treeLayout(root);

    svg.selectAll(".link")
        .data(treeData.links())
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x))
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 2);

    const node = svg.selectAll(".node")
        .data(treeData.descendants())
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.y},${d.x})`);

    node.append("circle")
        .attr("r", 10)
        .style("fill", "#fff")
        .style("stroke", "steelblue")
        .style("stroke-width", 3);

    node.append("text")
        .attr("dy", ".35em")
        .attr("x", d => d.children ? -13 : 13)
        .style("text-anchor", d => d.children ? "end" : "start")
        .text(d => d.data.id);

    const zoom = d3.zoom()
        .scaleExtent([0.5, 2])
        .on("zoom", (event) => {
            svg.attr("transform", event.transform);
        });

    d3.select("#bstVisualization svg")
        .call(zoom)
        .call(zoom.transform, d3.zoomIdentity.translate(margin.left, margin.top));
}

function animateSearch(steps) {
    const delay = 1000; // 1 segundo de retraso entre pasos
    steps.forEach((step, index) => {
        setTimeout(() => {
            d3.selectAll(".node circle")
                .style("fill", "#fff")
                .style("stroke", "steelblue");

            if (step.id !== null) {
                d3.selectAll(".node")
                    .filter(d => d.data.id === step.id)
                    .select("circle")
                    .style("fill", step.status === 'found' ? "#ff0" : "#f0f")
                    .style("stroke", step.status === 'found' ? "#f00" : "#0f0");
            }
        }, index * delay);
    });

    // Resetear después de la animación
    setTimeout(() => {
        d3.selectAll(".node circle")
            .style("fill", "#fff")
            .style("stroke", "steelblue");
    }, steps.length * delay);
}