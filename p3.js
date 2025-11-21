console.clear();

// ----------------------------------------------
// Create variables used in your program
// ----------------------------------------------

// WebGL utility functions (since external libraries might not load)
function vec3(x, y, z) {
    if (Array.isArray(x)) {
        return [x[0], x[1], x[2]];
    }
    return [x || 0, y || 0, z || 0];
}

function vec4(x, y, z, w) {
    if (Array.isArray(x)) {
        return [x[0], x[1], x[2], x[3] || 1];
    }
    return [x || 0, y || 0, z || 0, w || 1];
}

function mat4() {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];
}

function radians(degrees) {
    return degrees * Math.PI / 180;
}

function flatten(array) {
    let result = [];
    for (let i = 0; i < array.length; i++) {
        if (Array.isArray(array[i])) {
            result = result.concat(array[i]);
        } else {
            result.push(array[i]);
        }
    }
    return new Float32Array(result);
}

function cross(u, v) {
    return [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0]
    ];
}

function subtract(u, v) {
    return [u[0] - v[0], u[1] - v[1], u[2] - v[2]];
}

function add(u, v) {
    return [u[0] + v[0], u[1] + v[1], u[2] + v[2]];
}

function normalize(v) {
    let len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    if (len === 0) return [0, 0, 0];
    return [v[0] / len, v[1] / len, v[2] / len];
}

function translate(x, y, z) {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        x, y, z, 1
    ];
}

function rotateY(angle) {
    let c = Math.cos(radians(angle));
    let s = Math.sin(radians(angle));
    return [
        c, 0, s, 0,
        0, 1, 0, 0,
        -s, 0, c, 0,
        0, 0, 0, 1
    ];
}

function scalem(x, y, z) {
    return [
        x, 0, 0, 0,
        0, y, 0, 0,
        0, 0, z, 0,
        0, 0, 0, 1
    ];
}

function mult(a, b) {
    let result = new Array(16);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            result[i * 4 + j] = 0;
            for (let k = 0; k < 4; k++) {
                result[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j];
            }
        }
    }
    return result;
}

function lookAt(eye, at, up) {
    let n = normalize(subtract(eye, at));
    let u = normalize(cross(up, n));
    let v = normalize(cross(n, u));
    
    return [
        u[0], v[0], n[0], 0,
        u[1], v[1], n[1], 0,
        u[2], v[2], n[2], 0,
        -u[0] * eye[0] - u[1] * eye[1] - u[2] * eye[2],
        -v[0] * eye[0] - v[1] * eye[1] - v[2] * eye[2],
        -n[0] * eye[0] - n[1] * eye[1] - n[2] * eye[2],
        1
    ];
}

function perspective(fovy, aspect, near, far) {
    let f = 1.0 / Math.tan(radians(fovy) / 2);
    let nf = 1 / (near - far);
    
    return [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, 2 * far * near * nf, 0
    ];
}

function normalMatrix(m, flag) {
    // Extract 3x3 from 4x4 matrix and transpose
    return [
        m[0], m[4], m[8],
        m[1], m[5], m[9],
        m[2], m[6], m[10]
    ];
}

function initShadersFromHTML(gl, vertexShaderId, fragmentShaderId) {
    let vertexShader = createShader(gl, gl.VERTEX_SHADER, document.getElementById(vertexShaderId).textContent);
    let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, document.getElementById(fragmentShaderId).textContent);
    
    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return null;
    }
    
    return program;
}

function createShader(gl, type, source) {
    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    
    return shader;
}

// WebGL variables
let gl;
let program;
let canvas;

// Model data
let mars_vertices = [];
let mars_normals = [];
let mars_indices = [];
let mgs_vertices = [];
let mgs_normals = [];
let mgs_indices = [];

// Buffer objects
let mars_vertex_buffer;
let mars_normal_buffer;
let mars_index_buffer;
let mgs_vertex_buffer;
let mgs_normal_buffer;
let mgs_index_buffer;

// Shader uniform locations
let u_model_matrix;
let u_view_matrix;
let u_projection_matrix;
let u_normal_matrix;
let u_light_position;
let u_color;

// Animation variables
let mars_y_rot = 0;
let mgs_y_rot = 0;



// ----------------------------------------------
// camera parameters
// ----------------------------------------------
let xt = 0.5;
let yt = 0.5;
let zt = 0.5;
let fov = 45;

// ----------------------------------------------
// light parameters
// ----------------------------------------------
let lxt = 1.0;
let lyt = 1.0;
let lzt = 1.0;

// ----------------------------------------------
// orbit dynamic parameters
// ----------------------------------------------
let orbit_speed = 0;
let orbit_speed_crd = 3; 
let orbit_radius_crd = 0.65; 
let orbit_angle_crd = 45; 

// ----------------------------------------------
// camera orientation parameters
// ----------------------------------------------
let at = vec3(0.0, 0.0, 0.0);
let up = vec3(0.0, 1.0, 0.0);


// ----------------------------------------------
// Event listeners
// ----------------------------------------------

// listener for the orbit speed slider
document.getElementById("os").addEventListener("input", function (e) {
    orbit_speed_crd = parseFloat(document.getElementById("os").value);
    document.getElementById("os_crd").innerHTML = " = " + orbit_speed_crd;
});

// listener for the orbit distance slider
document.getElementById("od").addEventListener("input", function (e) {
    orbit_radius_crd = parseFloat(e.target.value);
    document.getElementById("od_crd").innerHTML = " = " + orbit_radius_crd;
});

// listener for the orbit angle slider
document.getElementById("oa").addEventListener("input", function (e) {
    orbit_angle_crd = parseFloat(document.getElementById("oa").value);
    document.getElementById("oa_crd").innerHTML = " = " + orbit_angle_crd;
});

document.getElementById("zt").addEventListener("input", function (e) {
    zt = document.getElementById("zt").value;
    document.getElementById("z_crd").innerHTML = "= " + zt;
});

document.getElementById("xt").addEventListener("input", function (e) {
    xt = document.getElementById("xt").value;
    document.getElementById("x_crd").innerHTML = "= " + xt;
});

document.getElementById("yt").addEventListener("input", function (e) {
    yt = document.getElementById("yt").value;
    document.getElementById("y_crd").innerHTML = "= " + yt;
});
document.getElementById("fov").addEventListener("input", function (e) {
    fov = document.getElementById("fov").value;
    document.getElementById("fovy").innerHTML = "= " + fov;
});

document.getElementById("lzt").addEventListener("input", function (e) {
    lzt = document.getElementById("lzt").value;
    document.getElementById("lz_crd").innerHTML = "= " + lzt;
});

document.getElementById("lxt").addEventListener("input", function (e) {
    lxt = document.getElementById("lxt").value;
    document.getElementById("lx_crd").innerHTML = "= " + lxt;
});

document.getElementById("lyt").addEventListener("input", function (e) {
    lyt = document.getElementById("lyt").value;
    document.getElementById("ly_crd").innerHTML = "= " + lyt;
});

document.getElementById("reset_cl").addEventListener("click", function (e) {
    xt = yt = zt = 0.5;
    lxt = lyt = lzt = 1.0;
    fov = 45;
    document.getElementById("xt").value = xt;
    document.getElementById("x_crd").innerHTML = "= " + xt;
    document.getElementById("yt").value = yt;
    document.getElementById("y_crd").innerHTML = "= " + yt;
    document.getElementById("zt").value = zt;
    document.getElementById("z_crd").innerHTML = "= " + zt;
    document.getElementById("fov").value = fov;
    document.getElementById("fovy").innerHTML = "= " + fov;
    document.getElementById("lxt").value = lxt;
    document.getElementById("lx_crd").innerHTML = "= " + lxt;
    document.getElementById("lyt").value = lyt;
    document.getElementById("ly_crd").innerHTML = "= " + lyt;
    document.getElementById("lzt").value = lzt;
    document.getElementById("lz_crd").innerHTML = "= " + lzt;
});

document.getElementById("reset_ss").addEventListener("click", function (e) {
    orbit_speed_crd = 3; 
    orbit_radius_crd = 0.65; 
    orbit_angle_crd = 45; 
    document.getElementById("os").value = orbit_speed_crd;
    document.getElementById("os_crd").innerHTML = " = " + orbit_speed_crd;
    document.getElementById("od").value = orbit_radius_crd;
    document.getElementById("od_crd").innerHTML = " = " + orbit_radius_crd;
    document.getElementById("oa").value = orbit_angle_crd;
    document.getElementById("oa_crd").innerHTML = " = " + orbit_angle_crd;
    draw();
});

// ----------------------------------------------
// Add your coding solution
// ----------------------------------------------

// Initialize WebGL
function initWebGL() {
    canvas = document.getElementById("webgl-canvas");
    gl = canvas.getContext("webgl");
    
    if (!gl) {
        console.error("WebGL not supported");
        return false;
    }
    
    // Set viewport
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    
    // Set clear color to transparent (so background image shows through)
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    
    return true;
}

// Initialize shaders
function initShaders() {
    program = initShadersFromHTML(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    // Get uniform locations
    u_model_matrix = gl.getUniformLocation(program, "u_model_matrix");
    u_view_matrix = gl.getUniformLocation(program, "u_view_matrix");
    u_projection_matrix = gl.getUniformLocation(program, "u_projection_matrix");
    u_normal_matrix = gl.getUniformLocation(program, "u_normal_matrix");
    u_light_position = gl.getUniformLocation(program, "u_light_position");
    u_color = gl.getUniformLocation(program, "u_color");
}

// Calculate normals for a triangle mesh
function calculateNormals(vertices, indices) {
    let normals = new Array(vertices.length).fill(0).map(() => vec3(0, 0, 0));
    
    // Calculate face normals and accumulate vertex normals
    for (let i = 0; i < indices.length; i += 3) {
        let i0 = indices[i];
        let i1 = indices[i + 1];
        let i2 = indices[i + 2];
        
        let v0 = vec3(vertices[i0]);
        let v1 = vec3(vertices[i1]);
        let v2 = vec3(vertices[i2]);
        
        let edge1 = subtract(v1, v0);
        let edge2 = subtract(v2, v0);
        let normal = normalize(cross(edge1, edge2));
        
        // Accumulate normals for each vertex
        normals[i0] = add(normals[i0], normal);
        normals[i1] = add(normals[i1], normal);
        normals[i2] = add(normals[i2], normal);
    }
    
    // Normalize all vertex normals
    for (let i = 0; i < normals.length; i++) {
        normals[i] = normalize(normals[i]);
    }
    
    return normals;
}

// Prepare model data
function prepareModelData() {
    // Convert Mars data
    mars_vertices = V_p.map(v => vec3(v[0], v[1], v[2]));
    mars_indices = F_p.flat();
    mars_normals = calculateNormals(mars_vertices, mars_indices);
    
    // Convert MGS data
    mgs_vertices = V_s.map(v => vec3(v[0], v[1], v[2]));
    mgs_indices = F_s.flat();
    mgs_normals = calculateNormals(mgs_vertices, mgs_indices);
}

// Create buffers
function createBuffers() {
    // Mars buffers
    mars_vertex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, mars_vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(mars_vertices), gl.STATIC_DRAW);
    
    mars_normal_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, mars_normal_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(mars_normals), gl.STATIC_DRAW);
    
    mars_index_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mars_index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mars_indices), gl.STATIC_DRAW);
    
    // MGS buffers
    mgs_vertex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, mgs_vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(mgs_vertices), gl.STATIC_DRAW);
    
    mgs_normal_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, mgs_normal_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(mgs_normals), gl.STATIC_DRAW);
    
    mgs_index_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mgs_index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mgs_indices), gl.STATIC_DRAW);
}

// Set up vertex attributes
function setupVertexAttributes() {
    let a_position = gl.getAttribLocation(program, "a_position");
    let a_normal = gl.getAttribLocation(program, "a_normal");
    
    gl.enableVertexAttribArray(a_position);
    gl.enableVertexAttribArray(a_normal);
    
    return { a_position, a_normal };
}

// Draw Mars
function drawMars(attributes) {
    // Set Mars color (0.70, 0.13, 0.13)
    gl.uniform3f(u_color, 0.70, 0.13, 0.13);
    
    // Model matrix for Mars (rotation only)
    let model_matrix = rotateY(mars_y_rot);
    gl.uniformMatrix4fv(u_model_matrix, false, flatten(model_matrix));
    
    // Normal matrix
    let normal_matrix = normalMatrix(model_matrix, true);
    gl.uniformMatrix3fv(u_normal_matrix, false, flatten(normal_matrix));
    
    // Bind Mars buffers and set attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, mars_vertex_buffer);
    gl.vertexAttribPointer(attributes.a_position, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, mars_normal_buffer);
    gl.vertexAttribPointer(attributes.a_normal, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mars_index_buffer);
    gl.drawElements(gl.TRIANGLES, mars_indices.length, gl.UNSIGNED_SHORT, 0);
}

// Draw MGS
function drawMGS(attributes) {
    // Set MGS color (1.0, 0.84, 0.0)
    gl.uniform3f(u_color, 1.0, 0.84, 0.0);
    
    // Calculate MGS position using spherical to cartesian conversion
    let phi = radians(orbit_speed);
    let theta = radians(orbit_angle_crd);
    let r = orbit_radius_crd;
    
    let x = r * Math.sin(theta) * Math.cos(phi);
    let y = r * Math.cos(theta);
    let z = r * Math.sin(theta) * Math.sin(phi);
    
    // Model matrix for MGS (translation, rotation, and scaling)
    let translation_matrix = translate(x, y, z);
    let rotation_matrix = rotateY(mgs_y_rot);
    let scale_matrix = scalem(0.3, 0.3, 0.3);
    
    let model_matrix = mult(translation_matrix, mult(rotation_matrix, scale_matrix));
    gl.uniformMatrix4fv(u_model_matrix, false, flatten(model_matrix));
    
    // Normal matrix
    let normal_matrix = normalMatrix(model_matrix, true);
    gl.uniformMatrix3fv(u_normal_matrix, false, flatten(normal_matrix));
    
    // Bind MGS buffers and set attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, mgs_vertex_buffer);
    gl.vertexAttribPointer(attributes.a_position, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, mgs_normal_buffer);
    gl.vertexAttribPointer(attributes.a_normal, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mgs_index_buffer);
    gl.drawElements(gl.TRIANGLES, mgs_indices.length, gl.UNSIGNED_SHORT, 0);
}

// Main draw function
function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Set up camera
    let eye = vec3(xt, yt, zt);
    let view_matrix = lookAt(eye, at, up);
    gl.uniformMatrix4fv(u_view_matrix, false, flatten(view_matrix));
    
    // Set up projection
    let projection_matrix = perspective(fov, canvas.width / canvas.height, 0.1, 10.0);
    gl.uniformMatrix4fv(u_projection_matrix, false, flatten(projection_matrix));
    
    // Set light position
    gl.uniform3f(u_light_position, lxt, lyt, lzt);
    
    // Set up vertex attributes
    let attributes = setupVertexAttributes();
    
    // Draw models
    drawMars(attributes);
    drawMGS(attributes);
}

// Animation function
function animate() {
    // Update rotation angles
    mars_y_rot = (mars_y_rot + 1) % 360;
    mgs_y_rot = (mgs_y_rot + 2) % 360;
    
    // Update orbit speed
    orbit_speed = (orbit_speed + orbit_speed_crd) % 360;
    
    // Redraw
    draw();
}

// Initialize everything
function init() {
    if (!initWebGL()) {
        return;
    }
    
    initShaders();
    prepareModelData();
    createBuffers();
    
    // Start animation loop
    setInterval(animate, 100);
}

// Start when page loads
window.onload = init;






