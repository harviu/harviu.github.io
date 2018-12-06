
////////////////////////////Variables/////////////////////////////

const canvas = document.getElementById("myCanvas");
let gl;
let shaderProgram;
let vertexPositionBuffer;
let vertexIndexBuffer; 

let light_vector = [1.0,1,1,0];  //use parallel light
var mat_ambient = [0.3, 0, 0, 1]; 
var mat_diffuse= [1, 0, 0, 1]; 
var mat_specular = [.9, .9, .9,1]; 
var mat_shine = [50]; 
let light_color = [1,1,1,1];

var vMatrix = mat4.create(); // view matrix
var mMatrix = mat4.create();  // model matrix
var mvMatrix = mat4.create();  // modelview matrix
var pMatrix = mat4.create();  //projection matrix 
var nMatrix = mat4.create();  // normal matrix
let fpMatrix = mat4.create(); // first person camera matrix
let plMatrix = mat4.create(); // first person camera matrix
var v2wMatrix = mat4.create();  // eye space to world space matrix 
let horizontal = 0.0;
let vertical = 0.0;
let forward = 0;
let cameraDis = 27.0;

let use_texture = 0;
let sampleTexture = undefined;
let choosenTexture= undefined;
let cubemapTexture= undefined;
let textureLoaded = 0;

let cameraType = 0;
let frame = 0;

let toriiMat = mat4.create();

let cameraTilt = mat4.create();
mat4.identity(cameraTilt);
cameraTilt = mat4.translate(cameraTilt,[0,-2,-4]);

////////////// Main ////////////////////
function webGLStart() {
    initGL(canvas);
    initShaders();

    gl.enable(gl.DEPTH_TEST); 

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
    shaderProgram.vertexTexCoordsAttribute = gl.getAttribLocation(shaderProgram, "aVertexTexCoords");
    gl.enableVertexAttribArray(shaderProgram.vertexTexCoordsAttribute);	

    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.v2wMatrixUniform = gl.getUniformLocation(shaderProgram, "uV2WMatrix");		

    //normal transform matrix
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");

    // coeficient for lighting
    shaderProgram.light_vectorUniform = gl.getUniformLocation(shaderProgram, "light_vector");
    shaderProgram.ambient_coefUniform = gl.getUniformLocation(shaderProgram, "ambient_coef");	
    shaderProgram.diffuse_coefUniform = gl.getUniformLocation(shaderProgram, "diffuse_coef");
    shaderProgram.specular_coefUniform = gl.getUniformLocation(shaderProgram, "specular_coef");
    shaderProgram.light_colorUniform = gl.getUniformLocation(shaderProgram, "light_color");
    shaderProgram.shininess_coefUniform = gl.getUniformLocation(shaderProgram, "mat_shininess");

    //load Texture
    initTextures();
    shaderProgram.textureUniform = gl.getUniformLocation(shaderProgram, "myTexture");
    shaderProgram.use_textureUniform = gl.getUniformLocation(shaderProgram, "use_texture");

    //cube mapping
    initCubeMap();
    shaderProgram.cube_map_textureUniform = gl.getUniformLocation(shaderProgram, "cubeMap");	

    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    //camera control
    mat4.identity(fpMatrix);
    mat4.identity(plMatrix);
    if(cameraType==0){
        bindOVControl();
    }else if (cameraType == 1){
        bindFPControl();
    }
    
    document.addEventListener("keydown",switchCamera,false);

    var request = new  XMLHttpRequest();
    request.open("GET", "a6m2.json");
    request.onreadystatechange =
        (function () {
            if (request.readyState == 4) {
                console.log("state ="+request.readyState); 
                data = JSON.parse(request.responseText);
                
                let inter = setInterval(() => {
                    if (textureLoaded<7){
                        return;
                    }else{
                        handleTextureLoaded(cubemapTexture.pxx);  
                        handleTextureLoaded(cubemapTexture.nxx);
                        handleTextureLoaded(cubemapTexture.pyy);
                        handleTextureLoaded(cubemapTexture.nyy);
                        handleTextureLoaded(cubemapTexture.pzz);
                        handleTextureLoaded(cubemapTexture.nzz);
                        requestAnimationFrame(drawScene);
                        clearInterval(inter);
                    }
                }, 100);
            }
        });
    request.send();
}



///////////////////////////////////////////////////////////////

function drawScene() {
    let dis = 100;
    frame ++;
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //lighting

    mat4.identity(mMatrix);	
    mat4.identity(vMatrix);

    // set up the projection matrix
    mat4.perspective(60, 1.0, 0.1, 1000, pMatrix);  

    //modify view Matrix
    if (cameraType == 0){
        vMatrix = mat4.translate(vMatrix,[0,0,-cameraDis]);
        vMatrix = mat4.rotate(vMatrix,vertical,[1,0,0]);
        vMatrix = mat4.rotate(vMatrix,-horizontal,[0,1,0]);
    }else if (cameraType==1){
        // vMatrix = mat4.lookAt([4,2,0],[-100,1.5,0],[0,1,0],vMatrix);
        vMatrix = mat4.lookAt([0,0,0],[-100,0,0],[0,1,0],vMatrix);
        
        let temp = mat4.create();
        mat4.identity(temp);
        temp = mat4.rotateY(temp,horizontal);
        mat4.multiply(temp,fpMatrix,fpMatrix);
        temp = mat4.create;
        mat4.identity(temp);
        temp = mat4.rotateX(temp,-vertical);
        mat4.multiply(temp,fpMatrix,fpMatrix);
        mat4.identity(temp);
        temp = mat4.translate(temp,[0,0,forward]);
        mat4.multiply(temp,fpMatrix,fpMatrix);
        // fpMatrix = mat4.rotateY(fpMatrix,horizontal);
        // fpMatrix = mat4.rotateX(fpMatrix,-vertical);
        mat4.multiply(fpMatrix,vMatrix,vMatrix);
        mat4.multiply(cameraTilt,vMatrix,vMatrix);

        plMatrix = mat4.rotateY(plMatrix,-horizontal);
        plMatrix = mat4.rotateZ(plMatrix,-vertical);
        plMatrix = mat4.translate(plMatrix,[-forward,0,0]);
    }
    
    
    //modify mMatrix here
    //test
    // generateJSON();
    // drawBuffer("index");

    ///////////////// drawing Torii

    mat4.identity(toriiMat);
    toriiMat = mat4.translate(toriiMat,[0,-dis,-dis/3*2])
    toriiMat = mat4.scale(toriiMat,[10,10,10]);
    toString = mat4.translate(toriiMat,[0,2.5,0]);

    // wood part
    mat_ambient = [0.4, 0, 0, 1]; 
    mat_diffuse= [0.7, 0, 0, 1]; 
    mat_specular = [.75, .75, .75,1]; 
    mat_shine = [50]; 
    use_texture = 1;
    choosenTexture = sampleTexture;

    vi = generateCylinder(0.18,0.25,4);
    mat4.set(toriiMat,mMatrix);
    mMatrix = mat4.translate(mMatrix,[-2,-2,0]);
    drawBuffer("index");

    mat4.set(toriiMat,mMatrix);	
    mMatrix = mat4.translate(mMatrix,[2,-2,0]);
    drawBuffer("index");

    vi = generateCube(0.2);
    mat4.set(toriiMat,mMatrix);	
    mMatrix = mat4.translate(mMatrix,[0,1.3,0]);
    mMatrix = mat4.scale(mMatrix,[5.3/0.2,1,1]);
    drawBuffer("index");

    mat4.set(toriiMat,mMatrix);	
    mMatrix = mat4.translate(mMatrix,[0,2.09,0]);
    mMatrix = mat4.scale(mMatrix,[5.6/0.2,0.9,1.8]);
    drawBuffer("index");

    mat4.set(toriiMat,mMatrix);	
    mMatrix = mat4.translate(mMatrix,[2,1.37,0]);
    mMatrix = mat4.scale(mMatrix,[0.6/0.2,0.7,0.9]);
    drawBuffer("index"); 

    mat4.set(toriiMat,mMatrix);	
    mMatrix = mat4.translate(mMatrix,[-2,1.37,0]);
    mMatrix = mat4.scale(mMatrix,[0.6/0.2,0.7,0.9]);
    drawBuffer("index"); 

    vi =generateCube(0.1);
    mat4.set(toriiMat,mMatrix);	
    mMatrix = mat4.translate(mMatrix,[0,1.7,0]);
    mMatrix = mat4.scale(mMatrix,[4,6.1,1]);
    drawBuffer("index"); 

    //black wood part assuming the ground is at -2.5
    mat_ambient = [0, 0, 0, 1]; 
    mat_diffuse= [0.15, 0.15, 0.15, 1]; 
    mat_specular = [1, 1, 1,1]; 
    mat_shine = [5]; 

    vi = generateCylinder(0.3,0.3,0.5);
    mat4.set(toriiMat,mMatrix);	
    mMatrix = mat4.translate(mMatrix,[-2,-2.5,0]);
    drawBuffer("index");

    mat4.set(toriiMat,mMatrix);	
    mMatrix = mat4.translate(mMatrix,[2,-2.5,0]);
    drawBuffer("index");

    vi = generateCube(0.2);
    mat4.set(toriiMat,mMatrix);	
    mMatrix = mat4.translate(mMatrix,[0,2.15,0]);
    mMatrix = mat4.scale(mMatrix,[6/0.2,0.7,2]);
    drawBuffer("index");

    
    // stone part
    mat_ambient = [0.15, 0.15, 0.15, 1]; 
    mat_diffuse= [111/255, 121/255, 124/255, 1]; 
    mat_specular = [1, 1, 1,1]; 
    mat_shine = [75]; 


    use_texture = 2;
    vi = generateSphere(0.8);
    mat4.set(toriiMat,mMatrix);	
    mMatrix = mat4.translate(mMatrix,[1.8,-1.7,-2.5]);
    drawBuffer("index");

    use_texture = 0;
    mat4.set(toriiMat,mMatrix);	
    mMatrix = mat4.translate(mMatrix,[-1.8,-1.7,-2.5]);
    drawBuffer("index");

    use_texture = 2;
    vi = generateSphere(0.5);
    mat4.set(toriiMat,mMatrix);	
    mMatrix = mat4.translate(mMatrix,[1.8,-0.9,-2.5]);
    drawBuffer("index");

    use_texture = 0;
    mat4.set(toriiMat,mMatrix);	
    mMatrix = mat4.translate(mMatrix,[-1.8,-0.9,-2.5]);
    drawBuffer("index");
    /////////////// end of torii

    // type zero
    mat_ambient = [72/255/2, 100/255/2, 81/255/2, 1]; 
    mat_diffuse= [72/255, 100/255, 81/255, 1]; 
    mat_specular = [.5, .5, .5,1]; 
    mat_shine = [50]; 
    use_texture = 2;

    generateJSON();
    mat4.identity(mMatrix);
    // mMatrix= mat4.rotateY(mMatrix,Math.PI/2);
    // mMatrix= mat4.rotateZ(mMatrix,Math.PI/8);
    // mMatrix = mat4.scale(mMatrix,[0.3,0.3,0.3]);
    mat4.set(plMatrix,mMatrix);
    drawBuffer("index");
    use_texture = 0;

    //environment
    use_texture = 3;

    generateCube(1);
    mat4.identity(mMatrix);
    mMatrix = mat4.scale(mMatrix,[1,2*dis,2*dis]);
    mMatrix = mat4.translate(mMatrix,[dis,0,0]);
    choosenTexture = cubemapTexture.pxx;
    drawBuffer("index");

    mat4.identity(mMatrix);
    mMatrix = mat4.scale(mMatrix,[1,2*dis,2*dis]);
    mMatrix = mat4.translate(mMatrix,[-dis,0,0]);
    choosenTexture = cubemapTexture.nxx;
    drawBuffer("index");

    mat4.identity(mMatrix);
    mMatrix = mat4.scale(mMatrix,[2*dis,2*dis,1]);
    mMatrix = mat4.translate(mMatrix,[0,0,dis]);
    choosenTexture = cubemapTexture.pzz;
    drawBuffer("index");

    mat4.identity(mMatrix);
    mMatrix = mat4.scale(mMatrix,[2*dis,2*dis,1]);
    mMatrix = mat4.translate(mMatrix,[0,0,-dis]);
    choosenTexture = cubemapTexture.nzz;
    drawBuffer("index");

    mat4.identity(mMatrix);	
    mMatrix = mat4.rotateX(mMatrix,Math.PI/2);
    mMatrix = mat4.scale(mMatrix,[2*dis,2*dis,1]);
    mMatrix = mat4.translate(mMatrix,[0,0,dis]);
    choosenTexture = cubemapTexture.nyy;
    drawBuffer("index");

    mat4.identity(mMatrix);
    mMatrix = mat4.rotateX(mMatrix,Math.PI/2);
    mMatrix = mat4.scale(mMatrix,[2*dis,2*dis,1]);
    mMatrix = mat4.translate(mMatrix,[0,0,-dis]);
    choosenTexture = cubemapTexture.pyy;
    drawBuffer("index");
}


    ///////////////////////////////////////////////////////////////

var lastMouseX = 0;
let lastMouseY = 0;

    ///////////////////////Ui Part///////////////////////////////
function bindOVControl(){
    document.addEventListener('mousedown', onDocumentMouseDown,false); 
    document.addEventListener("wheel",cameraTruck,false);

    document.removeEventListener('keydown',FPMove,false);
    // console.log("OVcontrol");
    
}
function bindFPControl(){
    document.addEventListener('keydown',FPMove,false);

    document.removeEventListener('mousedown', onDocumentMouseDown,false); 
    document.removeEventListener("wheel",cameraTruck,false);
    // console.log('FPcontrol');
    
}

function planeDir(e){
    horizontal = e.movementX/200;
    vertical = -e.movementY/200;
    // console.log(vertical);
}

function switchCamera(e){
    vertical=0;
    horizontal = 0;
    if(e.key == '1'){
        cameraType = 0;
        bindOVControl();
        requestAnimationFrame(drawScene);
    }else if (e.key == '2'){
        cameraType = 1;
        bindFPControl();
        requestAnimationFrame(drawScene);
    }
}

let nextFrame;
let lastTime=null;
let second;

function FPMove(e){
    lastTime=null;
    frame = 0;
    second = 0;
    // console.log(e);
    document.addEventListener('mousemove',planeDir,false);
    
    document.removeEventListener('keydown',FPMove,false);
    document.addEventListener('keyup',FPMoveStop,false);
    if(e.key == 'w'){
        nextFrame = requestAnimationFrame(goForward);
    }else if (e.key == 's'){
        nextFrame = requestAnimationFrame(goBackward);
    }
}

function FPMoveStop(e){
    document.removeEventListener('mousemove',planeDir,false);
    if(e.key == 'w' || e.key == 's'){
        cancelAnimationFrame(nextFrame);
        forward = 0;
        document.addEventListener('keydown',FPMove,false);
    }
}

function goForward(timeStamp){
    if(!lastTime) lastTime=timeStamp;
    var delta = timeStamp - lastTime;
    second += delta;
    forward = delta/300;
    lastTime = timeStamp;
    drawScene();
    if(second > 1000){
        console.log(frame);
        frame =0;
        second = 0;
    }
    // console.log(forward);
    nextFrame = requestAnimationFrame(goForward);
}

function goBackward(timeStamp){
    if(!lastTime) lastTime=timeStamp;
    var delta = timeStamp - lastTime;
    second += delta;
    forward = -delta/300;
    lastTime = timeStamp;
    drawScene();
    if(second > 1000){
        console.log(frame);
        frame =0;
        second = 0;
    }
    // console.log(forward);
    nextFrame = requestAnimationFrame(goBackward);
}


function cameraTruck(event){
    let delta = event.wheelDelta/150;
    cameraDis = cameraDis-delta;
    if (cameraDis>99) cameraDis=99;
    if (cameraDis<-99) cameraDis = -99;
    requestAnimationFrame(drawScene);
}

function onDocumentMouseDown( event ) {
    event.preventDefault();
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );
    // document.addEventListener( 'mouseout', onDocumentMouseOut, false );
    var mouseX = event.clientX;
    var mouseY = event.clientY;

    lastMouseX = mouseX;
    lastMouseY = mouseY; 

}

function onDocumentMouseMove( event ) {
    var mouseX = event.clientX;
    var mouseY = event.clientY; 

    var diffX = mouseX - lastMouseX;
    var diffY = mouseY - lastMouseY;


    horizontal = horizontal + diffX/100;
    vertical = vertical +diffY/200;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
    requestAnimationFrame(drawScene);
}

function onDocumentMouseUp( event ) {
    document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
    document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
    document.removeEventListener( 'mouseout', onDocumentMouseOut, false );
}

function onDocumentMouseOut( event ) {
    document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
    document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
    document.removeEventListener( 'mouseout', onDocumentMouseOut, false );
}

///////////////////////////Helper functions////////////////////////////////////////




function generateSphere(radius, nSlice=20,nStack=20){
    // set up transform matrix before calling this function
    let v = [];
    let index = [];
    let n = [];
    let tex = [];
    let aStep=2*Math.PI/nSlice;
    let bStep=Math.PI/(nStack+1);
    let a;
    let b;

    //input vertices
    for (let i = 0;i<nSlice;i++){
        a = i*aStep;
        for (let j = 0;j<nStack;j++){
            b = (j+1)*bStep-Math.PI/2;
            v.push(radius*Math.cos(a)*Math.cos(b));
            v.push(radius*Math.sin(b));
            v.push(radius*Math.sin(a)*Math.cos(b));

            n.push(Math.cos(a)*Math.cos(b));
            n.push(Math.sin(b));
            n.push(Math.sin(a)*Math.cos(b));
        }
    }

    v.push(0);v.push(radius);v.push(0);
    v.push(0);v.push(-radius);v.push(0);
    n.push(0);n.push(1);n.push(0);
    n.push(0);n.push(-1);n.push(0);
    let topI = nSlice*nStack;
    let bottomI = topI+1;

    //input index
    for (let i = 0;i<nSlice;i++){
        let start = i*nStack;
        let next = (i+1)%nSlice*nStack;
        index.push(bottomI);index.push(start);index.push(next);
        index.push(start+nStack-1);index.push(topI);index.push(next+nStack-1);
        for(let j =0;j<nStack-1;j++){
            index.push(start+j);index.push(next+j);index.push(next+j+1);
            index.push(start+j);index.push(start+j+1);index.push(next+j+1);
        }
    }

    tex = new Array(v.length/3*2); //may implement this later
    return (initBuffer(v,index,n,tex));
    
}

function generateCube(size){
    // set up transform matrix before calling this function
    let v = [];
    let index = [];
    let n = [];
    let tex = [];
    let ccc = size/2;

    //input vertices
    v.push(ccc);v.push(ccc);v.push(ccc);
    v.push(ccc);v.push(-ccc);v.push(ccc);
    v.push(-ccc);v.push(ccc);v.push(ccc);
    v.push(-ccc);v.push(-ccc);v.push(ccc);
    v.push(-ccc);v.push(ccc);v.push(-ccc);
    v.push(-ccc);v.push(-ccc);v.push(-ccc);
    v.push(ccc);v.push(ccc);v.push(-ccc);
    v.push(ccc);v.push(-ccc);v.push(-ccc);

    //normal
    n.push(ccc);n.push(ccc);n.push(ccc);
    n.push(ccc);n.push(-ccc);n.push(ccc);
    n.push(-ccc);n.push(ccc);n.push(ccc);
    n.push(-ccc);n.push(-ccc);n.push(ccc);
    n.push(-ccc);n.push(ccc);n.push(-ccc);
    n.push(-ccc);n.push(-ccc);n.push(-ccc);
    n.push(ccc);n.push(ccc);n.push(-ccc);
    n.push(ccc);n.push(-ccc);n.push(-ccc);

    //index
    index.push(0);index.push(1);index.push(2);
    index.push(1);index.push(2);index.push(3);
    index.push(2);index.push(3);index.push(4);
    index.push(3);index.push(4);index.push(5);
    index.push(4);index.push(5);index.push(6);
    index.push(5);index.push(6);index.push(7);
    index.push(6);index.push(7);index.push(0);
    index.push(7);index.push(0);index.push(1);
    index.push(0);index.push(2);index.push(4);
    index.push(0);index.push(4);index.push(6);
    index.push(1);index.push(3);index.push(5);
    index.push(1);index.push(5);index.push(7);

    //tex
    tex.push(0);tex.push(0);
    tex.push(0);tex.push(1);
    tex.push(1);tex.push(0);
    tex.push(1);tex.push(1);
    tex.push(0);tex.push(0);
    tex.push(0);tex.push(1);
    tex.push(1);tex.push(0);
    tex.push(1);tex.push(1);


    return (initBuffer(v,index,n,tex));
}

function generateCylinder(tRadius,bRadius,height, nSlice=20,nStack=20){
    // set up transform matrix before calling this function
    let v = [];
    let index = [];
    let n = [];
    let tex = [];
    let aStep=2*Math.PI/nSlice;
    let hStep=height/(nStack+1);
    let rStep = (tRadius-bRadius)/(nStack+1);

    //input vertices
    for (let i = 0;i<nSlice;i++){
        let a = i*aStep;
        for (let j = 0;j<nStack+2;j++){
            let h = hStep * j;
            let delR = rStep *j;
            v.push((bRadius+delR)*Math.cos(a));
            v.push(h);
            v.push((bRadius+delR)*Math.sin(a));

            n.push(Math.cos(a));
            n.push((tRadius-bRadius)/height);
            n.push(Math.sin(a));

            tex.push(a/(Math.PI*2));
            tex.push(h);
        }
    }

    //input index
    for (let i = 0;i<nSlice;i++){
        let start = i*(nStack+2);
        let next = (i+1)%nSlice*(nStack+2);
        index.push(0);index.push(start);index.push(next);
        index.push(nStack+1);index.push(start+nStack+1);index.push(next+nStack+1);
        for(let j =0;j<nStack+1;j++){
            index.push(start+j);index.push(next+j);index.push(next+j+1);
            index.push(start+j);index.push(start+j+1);index.push(next+j+1);
        }
    }



    return (initBuffer(v,index,n,tex));
}

function initBuffer(v,index,n,tex){
    vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
    vertexPositionBuffer.itemSize = 3;
    vertexPositionBuffer.numItems = v.length/3;

    if(n){
        vertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(n), gl.STATIC_DRAW);
        vertexNormalBuffer.itemSize = 3;
        vertexNormalBuffer.numItems = n.length/3;  
    }

    if(index){
        vertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer); 	
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(index), gl.STATIC_DRAW);  
        vertexIndexBuffer.itemsize = 1;
        vertexIndexBuffer.numItems = index.length;
    }
    if(tex){
        vertexTextureCoordBuffer=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexTextureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(tex),gl.STATIC_DRAW);
        vertexTextureCoordBuffer.itemSize=2;
        vertexTextureCoordBuffer.numItems=tex.length/2;
    }
}

function initMatrix(){
    mat4.multiply(vMatrix,mMatrix, mvMatrix);  // mvMatrix = vMatrix * mMatrix and is the modelview Matrix 
    mat4.multiply(vMatrix,mMatrix, nMatrix);
	nMatrix = mat4.inverse(nMatrix);
    nMatrix = mat4.transpose(nMatrix);
    mat4.identity(v2wMatrix);
    v2wMatrix = mat4.multiply(v2wMatrix, vMatrix);
    v2wMatrix = mat4.inverse(v2wMatrix);     
    // v2wMatrix = mat4.transpose(v2wMatrix); 

    gl.uniform4f(shaderProgram.light_vectorUniform,light_vector[0], light_vector[1], light_vector[2],light_vector[3]); 
    gl.uniform4f(shaderProgram.ambient_coefUniform, mat_ambient[0], mat_ambient[1], mat_ambient[2], mat_ambient[3]); 
	gl.uniform4f(shaderProgram.diffuse_coefUniform, mat_diffuse[0], mat_diffuse[1], mat_diffuse[2], mat_diffuse[3]); 
	gl.uniform4f(shaderProgram.specular_coefUniform, mat_specular[0], mat_specular[1], mat_specular[2],mat_specular[3]); 
    gl.uniform4f(shaderProgram.light_colorUniform, light_color[0], light_color[1], light_color[2], light_color[3]); 
    gl.uniform1f(shaderProgram.shininess_coefUniform, mat_shine[0]); 
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);	
    gl.uniformMatrix4fv(shaderProgram.nMatrixUniform, false, nMatrix);
    gl.uniformMatrix4fv(shaderProgram.v2wMatrixUniform, false, v2wMatrix);
}

function drawBuffer(type){

    initMatrix();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // texture mapping
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexTexCoordsAttribute, vertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);   // set texture unit 0 to use 
    gl.bindTexture(gl.TEXTURE_2D, choosenTexture);    // bind the texture object to the texture unit 
    gl.uniform1i(shaderProgram.textureUniform, 0);   // pass the texture unit to the shader         
    gl.uniform1i(shaderProgram.use_textureUniform, use_texture);

    // cube mapping
    gl.activeTexture(gl.TEXTURE1); // set texture unit 1 to use
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture); // bind the texture object to the texture unit
    gl.uniform1i(shaderProgram.cube_map_textureUniform, 1); // pass the texture unit to the shader
    
    if (type == "index"){
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer); 
        gl.drawElements(gl.TRIANGLES, vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }else if (type == "strip"){
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
        gl.drawArrays(gl.TRIANGLE_STRIP,0,vertexPositionBuffer.numItems);
    }

}

    
function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

function generateJSON()
{
    // console.log(data);
    let index = [];

    for (let k in data.faces){
        if(k%4==0){
            continue;
        }else{
            index.push(data.faces[k])
        }
    }

    let normal=[];

    for (let j =0;j<data.vertices.length;j+=9){
        let p1 = [data.vertices[j],data.vertices[j+1],data.vertices[j+2]];
        let p2 = [data.vertices[j+3],data.vertices[j+4],data.vertices[j+5]];
        let p3 = [data.vertices[j+6],data.vertices[j+7],data.vertices[j+8]];
        let v1 = vector(p1,p2);
        let v2 = vector(p1,p3);
        let nn = cross(v1,v2);
        for(let k =0;k<3;k++){
            normal.push(nn[0]);
            normal.push(nn[1]);
            normal.push(nn[2]);
        }
    }

    let tex = [];
    tex = new Array(data.vertices.length/3*2); //may implement this later
    initBuffer(data.vertices,index,normal,tex);
    
}

function cross(a,b){
    return ([ a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0] ]);
}

function vector(a,b){
    return ([-a[0]+b[0],-a[1]+b[1],-a[2]+b[2]]);
}


function initTextures() {
    sampleTexture = gl.createTexture();
    sampleTexture.image = new Image();
    sampleTexture.image.onload = function() { handleTextureLoaded(sampleTexture); }
    sampleTexture.image.src = "wood-texture-256.jpg";    
    console.log("loading texture....") 
}

function handleTextureLoaded(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.bindTexture(gl.TEXTURE_2D, null);
    textureLoaded ++;
}

function initCubeMap() {
    console.log("loading cubemap texture....")
    // the dimension of pictures should be consistent.
    cubemapTexture = gl.createTexture();
    cubemapTexture.px = new Image();
    cubemapTexture.px.onload = function() { handleCubemapTextureLoaded(cubemapTexture,'px'); }
    cubemapTexture.px.src = "posx.jpg";
    cubemapTexture.pxx = gl.createTexture();
    cubemapTexture.pxx.image = cubemapTexture.px;

    cubemapTexture.nx = new Image();
    cubemapTexture.nx.onload = function() { handleCubemapTextureLoaded(cubemapTexture,'nx'); }
    cubemapTexture.nx.src = "negx.jpg";
    cubemapTexture.nxx = gl.createTexture();
    cubemapTexture.nxx.image = cubemapTexture.nx;

    cubemapTexture.py = new Image();
    cubemapTexture.py.onload = function() { handleCubemapTextureLoaded(cubemapTexture,'py'); }
    cubemapTexture.py.src = "posy.jpg"; 
    cubemapTexture.pyy = gl.createTexture();
    cubemapTexture.pyy.image = cubemapTexture.py;

    cubemapTexture.ny = new Image();
    cubemapTexture.ny.onload = function() { handleCubemapTextureLoaded(cubemapTexture,'ny'); }
    cubemapTexture.ny.src = "negy.jpg"; 
    cubemapTexture.nyy = gl.createTexture();
    cubemapTexture.nyy.image = cubemapTexture.ny;

    cubemapTexture.pz = new Image();
    cubemapTexture.pz.onload = function() { handleCubemapTextureLoaded(cubemapTexture,'pz'); }
    cubemapTexture.pz.src = "posz.jpg"; 
    cubemapTexture.pzz = gl.createTexture();
    cubemapTexture.pzz.image = cubemapTexture.pz;
    cubemapTexture.nz = new Image();
    cubemapTexture.nz.onload = function() { handleCubemapTextureLoaded(cubemapTexture,'nz'); }
    cubemapTexture.nz.src = "negz.jpg"; 
    cubemapTexture.nzz = gl.createTexture();
    cubemapTexture.nzz.image = cubemapTexture.nz;
} 

function handleCubemapTextureLoaded(texture,type) {
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    switch (type){
        case 'px':
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA,
        gl.UNSIGNED_BYTE, texture.px);
        break;
        case 'nx':
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA,
        gl.UNSIGNED_BYTE, texture.nx);
        break;
        case 'py':
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA,
        gl.UNSIGNED_BYTE, texture.py);
        break;
        case 'ny':
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, gl.RGBA,
        gl.UNSIGNED_BYTE, texture.ny);
        break;
        case 'pz':
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, gl.RGBA,
        gl.UNSIGNED_BYTE, texture.pz);
        break;
        case 'nz':
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, gl.RGBA,
        gl.UNSIGNED_BYTE, texture.nz);
        break;
    }
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR); 
    textureLoaded ++;
}