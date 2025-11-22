console.clear();

// ----------------------------------------------
// Create variables used in your program
// ----------------------------------------------
let canvas;
let gl;
let program;

let vertexBuffer;
let normalBuffer;
let indexBuffer;

let positionAttribute;
let normalAttribute;

let modelViewMatrixUniform;
let projectionMatrixUniform;
let normalMatrixUniform;
let lightPositionUniform;
let colorUniform;

let marsRotationY = 0;
let mgsRotationY = 0;



// ----------------------------------------------
// camera parameters
// ----------------------------------------------
let cameraX = 0.0;
let cameraY = 0.0;
let cameraZ = 2.5;
let fieldOfView = 45;

// ----------------------------------------------
// light parameters
// ----------------------------------------------
let lightX = 1.0;
let lightY = 1.0;
let lightZ = 1.0;

// ----------------------------------------------
// orbit dynamic parameters
// ----------------------------------------------
let orbitSpeed = 0;
let orbitSpeedControl = 3; 
let orbitRadiusControl = 0.65; 
let orbitAngleControl = 45; 

// ----------------------------------------------
// camera orientation parameters
// ----------------------------------------------
let lookAtPoint = vec3(0.0, 0.0, 0.0);
let upVector = vec3(0.0, 1.0, 0.0);


// ----------------------------------------------
// Event listeners
// ----------------------------------------------

// listener for the orbit speed slider
document.getElementById("os").addEventListener("input", function (e) {
    orbitSpeedControl = parseFloat(document.getElementById("os").value);
    document.getElementById("os_crd").innerHTML = " = " + orbitSpeedControl;
});

// listener for the orbit distance slider
document.getElementById("od").addEventListener("input", function (e) {
    orbitRadiusControl = parseFloat(e.target.value);
    document.getElementById("od_crd").innerHTML = " = " + orbitRadiusControl;
});

// listener for the orbit angle slider
document.getElementById("oa").addEventListener("input", function (e) {
    orbitAngleControl = parseFloat(document.getElementById("oa").value);
    document.getElementById("oa_crd").innerHTML = " = " + orbitAngleControl;
});

document.getElementById("zt").addEventListener("input", function (e) {
    cameraZ = document.getElementById("zt").value;
    document.getElementById("z_crd").innerHTML = "= " + cameraZ;
});

document.getElementById("xt").addEventListener("input", function (e) {
    cameraX = document.getElementById("xt").value;
    document.getElementById("x_crd").innerHTML = "= " + cameraX;
});

document.getElementById("yt").addEventListener("input", function (e) {
    cameraY = document.getElementById("yt").value;
    document.getElementById("y_crd").innerHTML = "= " + cameraY;
});
document.getElementById("fov").addEventListener("input", function (e) {
    fieldOfView = document.getElementById("fov").value;
    document.getElementById("fovy").innerHTML = "= " + fieldOfView;
});

document.getElementById("lzt").addEventListener("input", function (e) {
    lightZ = document.getElementById("lzt").value;
    document.getElementById("lz_crd").innerHTML = "= " + lightZ;
});

document.getElementById("lxt").addEventListener("input", function (e) {
    lightX = document.getElementById("lxt").value;
    document.getElementById("lx_crd").innerHTML = "= " + lightX;
});

document.getElementById("lyt").addEventListener("input", function (e) {
    lightY = document.getElementById("lyt").value;
    document.getElementById("ly_crd").innerHTML = "= " + lightY;
});

document.getElementById("reset_cl").addEventListener("click", function (e) {
    cameraX = cameraY = 0.0;
    cameraZ = 2.5;
    lightX = lightY = lightZ = 1.0;
    fieldOfView = 45;
    document.getElementById("xt").value = cameraX;
    document.getElementById("x_crd").innerHTML = "= " + cameraX;
    document.getElementById("yt").value = cameraY;
    document.getElementById("y_crd").innerHTML = "= " + cameraY;
    document.getElementById("zt").value = cameraZ;
    document.getElementById("z_crd").innerHTML = "= " + cameraZ;
    document.getElementById("fov").value = fieldOfView;
    document.getElementById("fovy").innerHTML = "= " + fieldOfView;
    document.getElementById("lxt").value = lightX;
    document.getElementById("lx_crd").innerHTML = "= " + lightX;
    document.getElementById("lyt").value = lightY;
    document.getElementById("ly_crd").innerHTML = "= " + lightY;
    document.getElementById("lzt").value = lightZ;
    document.getElementById("lz_crd").innerHTML = "= " + lightZ;
});

document.getElementById("reset_ss").addEventListener("click", function (e) {
    orbitSpeedControl = 3; 
    orbitRadiusControl = 0.65; 
    orbitAngleControl = 45; 
    document.getElementById("os").value = orbitSpeedControl;
    document.getElementById("os_crd").innerHTML = " = " + orbitSpeedControl;
    document.getElementById("od").value = orbitRadiusControl;
    document.getElementById("od_crd").innerHTML = " = " + orbitRadiusControl;
    document.getElementById("oa").value = orbitAngleControl;
    document.getElementById("oa_crd").innerHTML = " = " + orbitAngleControl;
    draw();
});

// ----------------------------------------------
// Add your coding solution
// ----------------------------------------------
window.onload = function init() {
    canvas = document.getElementById("webgl-canvas");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    gl = canvas.getContext('webgl');
    if (!gl) {
        alert("WebGL isn't available");
        return;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    vertexBuffer = gl.createBuffer();
    normalBuffer = gl.createBuffer();
    indexBuffer = gl.createBuffer();

    positionAttribute = gl.getAttribLocation(program, "vPosition");
    normalAttribute = gl.getAttribLocation(program, "vNormal");
    gl.enableVertexAttribArray(positionAttribute); 
    gl.enableVertexAttribArray(normalAttribute);

    modelViewMatrixUniform = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixUniform = gl.getUniformLocation(program, "projectionMatrix");
    normalMatrixUniform = gl.getUniformLocation(program, "normalMatrix");
    lightPositionUniform = gl.getUniformLocation(program, "lightPosition");
    colorUniform = gl.getUniformLocation(program, "objectColor");

    render();
};

function computeNormals(vertices, faces) {
    let normals = [];
    for (let i = 0; i < vertices.length; i++) {
        normals.push(vec3(0.0, 0.0, 0.0));
    }

    for (let i = 0; i < faces.length; i++) {
        let face = faces[i];
        let vertex0 = vertices[face[0]];
        let vertex1 = vertices[face[1]];
        let vertex2 = vertices[face[2]];

        let edge1 = subtract(vertex1, vertex0);
        let edge2 = subtract(vertex2, vertex0);
        let normal = normalize(cross(edge1, edge2));

        normals[face[0]] = add(normals[face[0]], normal);
        normals[face[1]] = add(normals[face[1]], normal);
        normals[face[2]] = add(normals[face[2]], normal);
    }

    for (let i = 0; i < normals.length; i++) {
        normals[i] = normalize(normals[i]);
    }

    return normals;
}

function multiplyMatrixVector(matrix, vector) {
    let result = [];
    for (let i = 0; i < 4; i++) {
        let sum = 0;
        for (let j = 0; j < 4; j++) {
            sum += matrix[i][j] * vector[j];
        }
        result.push(sum);
    }
    return result;
}

function drawModel(vertices, faces, normals, color, modelMatrix) {
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionAttribute);

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
    gl.vertexAttribPointer(normalAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalAttribute);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flatten(faces)), gl.STATIC_DRAW);

    let eyePosition = vec3(parseFloat(cameraX), parseFloat(cameraY), parseFloat(cameraZ));
    let viewMatrix = lookAt(eyePosition, lookAtPoint, upVector);
    let modelViewMatrix = mult(viewMatrix, modelMatrix);
    
    let aspectRatio = canvas.width / canvas.height;
    let projectionMatrix = perspective(parseFloat(fieldOfView), aspectRatio, 0.1, 10.0);
    

    let normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];

    gl.uniformMatrix4fv(modelViewMatrixUniform, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixUniform, false, flatten(projectionMatrix));
    gl.uniformMatrix3fv(normalMatrixUniform, false, flatten(normalMatrix));
    
    let lightPosition = vec4(parseFloat(lightX), parseFloat(lightY), parseFloat(lightZ), 1.0);
    let lightPositionEyeSpace = multiplyMatrixVector(viewMatrix, lightPosition); 
    gl.uniform4fv(lightPositionUniform, flatten(lightPositionEyeSpace));
    gl.uniform4fv(colorUniform, flatten(color));

    gl.drawElements(gl.TRIANGLES, faces.length * 3, gl.UNSIGNED_SHORT, 0);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let marsNormals = computeNormals(V_p, F_p);
    
    let marsRotationMatrix = rotate(marsRotationY, vec3(0, 1, 0));
    let marsScaleMatrix = scalem(3.8, 3.8, 3.8);
    let marsModelMatrix = mult(marsRotationMatrix, marsScaleMatrix);
    let marsColor = vec4(0.70, 0.13, 0.13, 1.0);
    drawModel(V_p, F_p, marsNormals, marsColor, marsModelMatrix);

    let polarAngle = radians(orbitSpeed);  
    let azimuthalAngle = radians(orbitAngleControl); 
    let radius = orbitRadiusControl;

    let positionX = radius * Math.sin(polarAngle) * Math.cos(azimuthalAngle);
    let positionY = radius * Math.sin(polarAngle) * Math.sin(azimuthalAngle);
    let positionZ = radius * Math.cos(polarAngle);


    let mgsNormals = computeNormals(V_s, F_s);

    let mgsScaleMatrix = scalem(1.0, 1.0, 1.0);
    let mgsRotationMatrix = rotate(mgsRotationY, vec3(0, 1, 0));
    let mgsTranslationMatrix = translate(positionX, positionY, positionZ);
    let mgsTransformMatrix = mult(mgsTranslationMatrix, mult(mgsRotationMatrix, mgsScaleMatrix));
    let mgsColor = vec4(1.0, 0.84, 0.0, 1.0);
    drawModel(V_s, F_s, mgsNormals, mgsColor, mgsTransformMatrix);

    marsRotationY = (marsRotationY + 1) % 360;
    mgsRotationY = (mgsRotationY + 2) % 360;
    orbitSpeed = (orbitSpeed + orbitSpeedControl) % 360;

    setTimeout(render, 100);
}