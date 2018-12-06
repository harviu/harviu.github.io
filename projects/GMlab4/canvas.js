//Variables
let VERMAX = 100;
var vs = new Array(VERMAX);
for (var i = 0; i < VERMAX; i++) {
  vs[i] = new THREE.Vector3(10000000, 0, 0);
}
var vI=0;
var es = [];
var fs = [];
var mouseX;
var mouseY;
var selected = -1;
var curveType;
var polyVs;
var polyEs;
var polys;
var surVs;

//THREE.JS
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(90, 2, 0.1, 1000);
camera.position.z = 250;
var canvas = document.getElementById('canvas');
var renderer = new THREE.WebGLRenderer({antialias: true, canvas:canvas});

var pointMaterial = new THREE.PointsMaterial({color: 0xffff00, size: 3});
var lineMaterial = new THREE.LineBasicMaterial({color: 0xff0000, linewidth: 1});
var meshMaterial = new THREE.MeshDepthMaterial({wireframe:true});

var box = new THREE.Object3D();

var pointGeo = new THREE.Geometry();
var points = new THREE.Points(pointGeo, pointMaterial);
pointGeo.vertices=vs;

var axisGeo = new THREE.Geometry();
axisGeo.vertices.push(new THREE.Vector3(0, 250, 0));
axisGeo.vertices.push(new THREE.Vector3(0, -250, 0));
var axis = new THREE.Line(axisGeo, lineMaterial);

var surfaceGeo = new THREE.Geometry();

var geo = new THREE.Geometry();
var mesh = new THREE.Mesh(geo, meshMaterial);

//UI definition
var options = document.getElementById('options');
function addDots(e) {
  var x = e.pageX - canvas.offsetLeft - 500;
  var y = 250 - (e.pageY - canvas.offsetTop);
  var z = 0;
  vs[vI].set(x, y, z);
  vI++;
  pointGeo.verticesNeedUpdate = true;
  scene.add(points);
  render();
}
canvas.onclick=addDots;
curve = document.getElementById("curve");
polygon = document.getElementById("polygon");
surface = document.getElementById("surface");
reconstruct = document.getElementById("reconstruct");
for (const child of curve.children){
  child.onclick = function(){drawCurve(child.id)};
}
for (const child of polygon.children){
  child.onclick = function(){drawPolygon(child.id)};
}
for (const child of surface.children){
  child.onclick = function(){drawSurface(child.id)};
}
for (const child of reconstruct.children){
  child.onclick = function(){drawReconstruct(child.id)};
}
document.getElementById("delete").onclick = function(){
  canvas.removeEventListener("mousedown",selectDots);
  canvas.removeEventListener("mousemove",dotsMove);
  canvas.removeEventListener("mouseup",endMove);
  canvas.addEventListener("click",deleteDots);
}

function drawSurface(type){
  for(const child of polygon.children){
    child.disabled = true;
  }
  while (scene.children.length!=0){
    scene.remove(scene.children[0]);
  }
  render();
  if (type == "bezierSurface"){
    bezierSurface();
  }else if (type == "bSplineSurface"){
    bSplineSurface();
  }
}

function bSplineSurface(){
  var density = parseInt(document.getElementById("density").value);
  var uVec = [[]];
  var vVec = [[]];
  var coeU = [
    [-1, 3, -3, 1],
    [3, -6, 3, 0],
    [-3, 0, 3, 0],
    [1, 4, 1, 0]
  ]; //coefficient for Cubic B-Spline;
  var coeV = [
    [-1, 3, -3, 1],
    [3, -6, 0, 4],
    [-3, 3, 3, 1],
    [1, 0, 0, 0]
  ]; //coefficient for Cubic B-Spline;
  var subx = [];
  var suby = [];
  var subz = [];
  var verI = polys[0].length;
  var slices = polys.length;
  var col = verI-3;
  var row = slices-3;
  for (var j = 0; j < col; j++) {
    for (var i = 0; i < row; i++) {
      for (var k = 0; k < 4; k++) {
        subx[k] = [];
        suby[k] = [];
        subz[k] = [];
        for (var l = 0; l < 4; l++) {
          subx[k][l] = polys[(l + i)%slices][(k + j)%verI].x;
          suby[k][l] = polys[(l + i)%slices][(k + j)%verI].y;
          subz[k][l] = polys[(l + i)%slices][(k + j)%verI].z;
        }
      }
      for (var ui = 0; ui < density + 1; ui++) {
        u = 1 / density * ui;
        for (var m = 0; m < 4; m++) uVec[0][3 - m] = Math.pow(u, m);
        for (var vi = 0; vi < density + 1; vi++) {
          v = 1 / density * vi;
          for (n = 0; n < 4; n++) {
            vVec[3 - n] = [];
            vVec[3 - n][0] = Math.pow(v, n);
          }
          var tx = 1 / 36 * matrixMul(matrixMul(matrixMul(matrixMul(uVec, coeU), subx), coeV), vVec);
          var ty = 1 / 36 * matrixMul(matrixMul(matrixMul(matrixMul(uVec, coeU), suby), coeV), vVec);
          var tz = 1 / 36 * matrixMul(matrixMul(matrixMul(matrixMul(uVec, coeU), subz), coeV), vVec);
          var index = ((density+1)*j+ui)*(density+1)*row+(density+1)*i+vi;
          surfaceGeo.vertices[index]=new THREE.Vector3(tx, ty, tz);
        }
      }
    }
  }
  var surfMesh = new THREE.Mesh(surfaceGeo,meshMaterial);
  connect(row*(density+1),col*(density+1));
  scene.add(surfMesh);
  render();
}

function bezierSurface(){
  var density = parseInt(document.getElementById("density").value);
  var verI = polys[0].length;
  var slices = polys.length;
  var x = new Array(verI);
  var y = new Array(verI);
  var z = new Array(verI);
  for(var i =0;i<verI;i++){
    x[i]=new Array(slices);
    y[i]=new Array(slices);
    z[i]=new Array(slices);
  }
  for (var i in polys){
    for (var j in polys[i]){
      x[j][i]=polys[i][j].x;
      y[j][i]=polys[i][j].y;
      z[j][i]=polys[i][j].z;
    }
  }
  for (var ui = 0; ui < density + 1; ui++) {
    var u = 1 / density * ui;
    var coeU = [];
    coeU = calBezierCoe(u, verI);
    for (var vi = 0; vi < density + 1; vi++) {
      var v = 1 / density * vi;
      var coeV = [];
      var temp = calBezierCoe(v, slices);
      for (var i = 0; temp[0][i] != undefined; i++) {
        coeV[i] = [];
        coeV[i][0] = temp[0][i];
      }
      var tx = matrixMul(matrixMul(coeU, x), coeV);
      var ty = matrixMul(matrixMul(coeU, y), coeV);
      var tz = matrixMul(matrixMul(coeU, z), coeV);
      surfaceGeo.vertices.push(new THREE.Vector3(tx[0], ty[0], tz[0]));
    }
  }
  var surfMesh = new THREE.Mesh(surfaceGeo,meshMaterial);
  connect(density + 1, density + 1);
  scene.add(surfMesh);
  render();
}

function connect(r, col) {
  // construct faces in a rectangular metsh
  for (i = 0; i < col - 1; i++) {
    for (j = 0; j < r - 1; j++) {
      a = j + i * r;
      b = j + (i + 1) * r;
      c = b + 1;
      surfaceGeo.faces.push(new THREE.Face3(a, b, c));
      a = j + 1 + (i + 1) * r;
      b = j + 1 + i * r;
      c = b - 1;
      surfaceGeo.faces.push(new THREE.Face3(a, b, c));
    }
  }
}

function rotateStart(e) {
  mouseX = e.pageX - canvas.offsetLeft - 500;
  mouseY = 250 - (e.pageY - canvas.offsetTop);
  canvas.addEventListener("mousemove", rotating);
}

function rotating(e) {
  var x = e.pageX - canvas.offsetLeft - 500;
  var y = 250 - (e.pageY - canvas.offsetTop);
  var delX = (x - mouseX) * Math.PI * 2 / 1000;
  var delY = (y - mouseY) * Math.PI * 2 / 1000;
  mouseX = x;
  mouseY = y;
  for(const child of scene.children){
    child.rotation.x -= delY;
    child.rotation.y += delX;
  }
  render();
}

function rotateEnd(e) {
  canvas.removeEventListener("mousemove", rotating);
}

function deleteDots(e){
  var x = e.pageX - canvas.offsetLeft - 500;
  var y = 250 - (e.pageY - canvas.offsetTop);
  for (var i = 0; i < vI ; i++){
    if(x > vs[i].x-5 && x < vs[i].x+5 && y < vs[i].y+5 && y > vs[i].y-5){
      vs.splice(i,1);
      vI --;
      break;
    }
  }
  pointGeo.verticesNeedUpdate = true;
  drawCurve(curveType);
  canvas.removeEventListener("click",deleteDots);
}

function selectDots(e){
  var x = e.pageX - canvas.offsetLeft - 500;
  var y = 250 - (e.pageY - canvas.offsetTop);
  var z = 0;
  canvas.addEventListener("mousemove",dotsMove);
  selected = -1;
  for (var i = 0; i < vI ; i++){
    if(x > vs[i].x-5 && x < vs[i].x+5 && y < vs[i].y+5 && y > vs[i].y-5){
      selected = i;
      break;
    }
  }
}

function dotsMove(e){
  var x = e.pageX - canvas.offsetLeft - 500;
  var y = 250 - (e.pageY - canvas.offsetTop);
	if(selected!=-1){
    vs[selected].x = x;
    vs[selected].y = y;
  }
  pointGeo.verticesNeedUpdate = true;
  drawReconstruct(curveType);
}

function endMove(){
  selected = -1;
  canvas.removeEventListener("mousemove",dotsMove);
}

function extrusion(){
  var distance = parseInt(document.getElementById('sliceStep').value)
  polys = [];
  var slices = parseInt(document.getElementById('slices').value);
  var verI = polyVs.length;
  for (var i = 0; i < slices; i++) {
    polys[i]=[];
    for (var j = 0; j < verI; j++){
      var temp = polyVs[j].clone();
      temp.z += i*distance;
      polys[i].push(temp);
    }
  }
  polyEs=[];
  for(var i=0;i<polyVs.length-1;i++){
    polyEs.push([i,i+1]);
  }
  drawBox(polys,polyEs);
}

function sweep(){
  var acoe = parseFloat(document.getElementById("a").value);
  var ystep = parseInt(document.getElementById("sliceStep").value);
  var distance = parseInt(document.getElementById("distance").value);
  var count = parseInt(distance / ystep);
  polys = [];
  var slices = count +1;
  var verI = polyVs.length;
  for (i = 0; i < slices; i++) {
    polys[i]=[];
    for(j=0;j<verI;j++){
      var td = distance + 2 * (polyVs[0].y - polyVs[j].y);
      var nx = polyVs[j].x;
      var ny = polyVs[j].y + td * i / count;
      var nz = polyVs[j].z + acoe * (td * i / count * (td * i / count - td));
      temp = new THREE.Vector3(nx,ny,nz);
      polys[i].push(temp);
    }
  }
  polyEs=[];
  for(var i=0;i<polyVs.length-1;i++){
    polyEs.push([i,i+1]);
  }
  drawBox(polys,polyEs);
}

function drawPolygon(type){
  //deactivate curve functions
  for(const child of curve.children){
    child.disabled = true;
  }
  for(const child of surface.children){
    child.disabled = false;
  }
  while (scene.children.length!=0){
    scene.remove(scene.children[0]);
  }
  render();

  if (type == "revolution"){
    revolution();
  }else if (type == "extrusion"){
    extrusion();
  }else if (type == "sweep"){
    sweep();
  }
  canvas.addEventListener("mousedown", rotateStart);
  canvas.addEventListener("mouseup", rotateEnd);
}

function revolution(){
  polys = [];
  var slices = parseInt(document.getElementById('slices').value);
  var ang = Math.PI * 2 / slices;
  var verI = polyVs.length;
  for (var i = 0; i < slices+1; i++) {
    polys[i]=[];
    for (var j = 0; j < verI; j++){
      polys[i].push(polyVs[j].clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), ang * i));
    }
  }
  polyEs=[];
  for(var i=0;i<polyVs.length-1;i++){
    polyEs.push([i,i+1]);
  }
  drawBox(polys,polyEs);
}

function drawBox(polys,polyEs){
  var box = new THREE.Object3D();
  for(var i in polys){
    for(const edge of polyEs){
      var lineVertice = new THREE.Geometry();
      lineVertice.vertices.push(polys[i][edge[0]]);
      lineVertice.vertices.push(polys[i][edge[1]]);
      var line = new THREE.Line(lineVertice,lineMaterial);
      box.add(line);
    }
  }
  for(var i in polys){
    var s= parseInt(i)+1;
    if (s!=polys.length)
      for(var j in polys[i]){
        var lineVertice = new THREE.Geometry();
        lineVertice.vertices.push(polys[i][j]);
        lineVertice.vertices.push(polys[s][j]);
        var line = new THREE.Line(lineVertice,lineMaterial);
        box.add(line);
      }
  }
  scene.add(box);
  render();
}

function drawReconstruct(type){
  curveType = type;
  for (const child of curve.children){
    child.disabled = false;
  }
  canvas.onclick=function(){};
  canvas.addEventListener("mousedown",selectDots);
  canvas.addEventListener("mouseup",endMove);
  while (scene.children.length!=0){
    scene.remove(scene.children[0]);
  }
  render();
  scene.add(points);

  if (type == "nnCrust")
    nnCrust();
  else if (type == "crust")
    crust();
}

function drawCurve(type){
  curveType = type;
  vs=surVs;
  vI=vs.length;
  //activate polygon generation
  for (const child of polygon.children){
    child.disabled = false;
  }
  for(const child of reconstruct.children){
    child.disabled = true;
  }
  canvas.onclick=function(){};
  canvas.removeEventListener("mousedown",selectDots);
  canvas.removeEventListener("mousemove",dotsMove);
  canvas.removeEventListener("mouseup",endMove);
  canvas.removeEventListener("click",deleteDots);
  //remove former elements
  while (scene.children.length!=0){
    scene.remove(scene.children[0]);
  }
  render();
  scene.add(points);

  if (type == "bezier")
    bezier();
  else if (type == "bSpline")
    bSpline();
}

function bSpline(){
  var bSplineV = new THREE.Geometry();
  var bSplineLine = new THREE.Line(bSplineV,lineMaterial);
  var step = parseFloat(document.getElementById("step").value);
  var uVec=[[]];
  var coe=[[-1,3,-3,1],[3,-6,3,0],[-3,0,3,0],[1,4,1,0]]; //coefficient for Cubic B-Spline;
  var subx=[];
  var suby=[];
  vs.pop();
  vI = vs.length;
  for(j=0;j<vI;j++){
    for (k=0;k<4;k++){
      subx[k]=[];
      suby[k]=[];
      subx[k][0]=vs[(k+j)%vI].x;
      suby[k][0]=vs[(k+j)%vI].y;
    }
    for (u=0;u<1+step-0.000000001;u+=step){
      for(i=0;i<4;i++)
        uVec[0][3-i]=Math.pow(u,i);
      var tempX=1/6* matrixMul(matrixMul(uVec,coe),subx);
      var tempY=1/6* matrixMul(matrixMul(uVec,coe),suby);
      bSplineV.vertices.push(new THREE.Vector3(tempX,tempY,0));
    }
  }
  polyVs = bSplineV.vertices;
  scene.add(bSplineLine);
  render();
}

function bezier(){
  var bezierV = new THREE.Geometry();
  var bezierLine = new THREE.Line(bezierV,lineMaterial);
  var step;
  step = parseFloat(document.getElementById("step").value);
  var xs=[];
  var ys=[];
  for (var i =0; i<vI;i++){
    xs[i]=[];
    xs[i][0]=vs[i].x;
    ys[i]=[];
    ys[i][0]=vs[i].y;
  }
  for (var u = 0; u < 1+step-0.000000001; u += step) {
    coe = calBezierCoe(u, vI);
    var tempX = matrixMul(coe, xs);
    var tempY = matrixMul(coe, ys);
    bezierV.vertices.push(new THREE.Vector3(tempX[0][0],tempY[0][0],0));
  }
  scene.add(bezierLine);
  polyVs=bezierV.vertices;
  render();
}

function matrixMul(matrix1, matrix2) {
  //function for matrix multiplication
  if (matrix1[0].length != matrix2.length) {
    return false;
  }
  var ans = [];
  for (r1 = 0; r1 < matrix1.length; r1++) {
    ans[r1] = [];
    for (c2 = 0; c2 < matrix2[0].length; c2++) {
      ans[r1][c2] = 0;
      for (r2 = 0; r2 < matrix1[0].length; r2++) {
        ans[r1][c2] += matrix1[r1][r2] * matrix2[r2][c2];
      }
    }
  }
  return ans;
}

function fact(num) {
  //factorial
  if (num < 0)
    return false;
  else if (num == 0)
    return 1;
  else
    return (num * fact(num - 1));
}

function calBezierCoe(u, d, w) {
  //Function to calculate coefficient for different u
  //u: current ux
  //d: number of Dots
  //w: weight
  if (w == undefined) {
    w = [];
    for (i = 0; i < d; i++) {
      w[i] = 1;
    }
  }
  var c = [
    []
  ];
  var sum = 0;
  for (i = 0; i < d; i++) {
    c[0][i] = (fact(d - 1) / fact(i) / fact(d - 1 - i)) * Math.pow((1 - u), d - 1 - i) * Math.pow(u, i) * w[i];
    sum += c[0][i];
  }
  for (i = 0; i < d; i++) c[0][i] = c[0][i] / sum;
  return c;
}

function crust(){
  var vorV = [];
  es =[];
  fs =[];
  var del =Delaunator.from(vs.slice(0,vI),getX,getY);
  for (i=0;i<del.triangles.length;i+=3){
    vorV.push(circumcentre(vs[del.triangles[i]],vs[del.triangles[i+1]],vs[del.triangles[i+2]]));
  }
  var VorVP = vs.slice(0,vI).concat(vorV);
  del = Delaunator.from(VorVP,getX,getY);
  for (i=0;i<del.triangles.length;i+=3){
    addFace(del.triangles[i],del.triangles[i+1],del.triangles[i+2]);
  }
  var crustEdge=[];
  for (const edge of es){
    if(edge[0]<vI&&edge[1]<vI){
      crustEdge.push(edge);
    }
  }
  var lines = new THREE.Object3D();
  for(const edge of crustEdge){
    var geo = new THREE.Geometry();
    geo.vertices.push(vs[edge[0]]);
    geo.vertices.push(vs[edge[1]]);
    var mesh = new THREE.Line(geo,lineMaterial);
    lines.add(mesh);
  }
  //Determine order of vs
  var s = 0;
  surVs = [];
  surVs.push(vs[s]);
  var ee=crustEdge.slice(0);
  var endSign = false;
  while(1){
    endSign=true;
    for(var i=0;i<ee.length;i++){
      if(ee[i][0]==s||ee[i][1]==s){
        if(ee[i][0]==s) {s = ee[i][1];}
        else if(ee[i][1]==s) {s = ee[i][0];}
        ee.splice(i,1);
        surVs.push(vs[s]);
        endSign=false;
        break;
      }
    }
    if(endSign) break;
  }
  //If the curve is not closed.
  if(ee.length>0){
    s=0;
    while(1){
      endSign=true;
      for(var i=0;i<ee.length;i++){
        if(ee[i][0]==s||ee[i][1]==s){
          if(ee[i][0]==s) {s = ee[i][1];}
          else if(ee[i][1]==s) {s = ee[i][0];}
          ee.splice(i,1);
          surVs.unshift(vs[s]);
          endSign=false;
          break;
        }
      }
      if(endSign) break;
    }
  }
  scene.add(lines);
  render();
}

function render() {
  renderer.render(scene, camera);
}

function getX(v){
  return v.getComponent(0);
}
function getY(v){
  return v.getComponent(1);
}

function circumcentre(v1,v2,v3){
  var k1 = (v2.y - v1.y)/(v2.x - v1.x);
  var k2 = (v3.y - v1.y)/(v3.x - v1.x);
  var x = (k1*k2*(v3.y-v2.y)+k1*(v1.x+v3.x)-k2*(v1.x+v2.x))/2/(k1-k2);
  var y = x/(-k1)+(v1.x+v2.x)/2/k1 + (v1.y+v2.y)/2;
  return new THREE.Vector3(x,y,0);
}

function nnCrust(){
  es = [];
  fs = [];
  var del =Delaunator.from(vs.slice(0,vI),getX,getY);
  for (i=0;i<del.triangles.length;i+=3){
    addFace(del.triangles[i],del.triangles[i+1],del.triangles[i+2]);
  }

  var crustEdge = [];
  for (var i = 0;i<vI;i++){
    var min = 100000000;
    var minEdge;
    var vertice2;
    for (const edge of es){
      if(i == edge[0] || i == edge[1]){
        var dist = vs[edge[0]].distanceTo(vs[edge[1]]);
        if (dist<min){
          min = dist;
          minEdge = edge;
          if(i == edge[0]) vertice2 = vs[edge[1]];
          else vertice2 = vs[edge[0]];
        }
      }
    }
    if(!edgeExist(minEdge[0],minEdge[1],crustEdge))
      crustEdge.push(minEdge);
    var minHalf;
    var min = 1000000000;
    var vertice3;
    for (const edge of es){
      if(i == edge[0] || i == edge[1]){
        if(i == edge[0]) vertice3 = vs[edge[1]];
        else vertice3 = vs[edge[0]];
        var dist = vs[edge[0]].distanceTo(vs[edge[1]]);
        var vector1 = vertice2.clone().sub(vs[i]);
        var vector2 = vertice3.clone().sub(vs[i]);
        if (dist<min && vector2.angleTo(vector1)>Math.PI/2){
          min = dist;
          minHalf = edge;
        }
      }
    }
    if(minHalf!=undefined)
      if(!edgeExist(minHalf[0],minHalf[1],crustEdge))
        crustEdge.push(minHalf);
  }

  var lines = new THREE.Object3D();
  for(const edge of crustEdge){
    var geo = new THREE.Geometry();
    geo.vertices.push(vs[edge[0]]);
    geo.vertices.push(vs[edge[1]]);
    var mesh = new THREE.Line(geo,lineMaterial);
    lines.add(mesh);
  }
  scene.add(lines);
  polyVs = vs.slice(0,vI);
  polyEs = crustEdge;
  render();
  var s = 0;
  surVs = [];
  surVs.push(vs[s]);
  var ee=crustEdge.slice(0);
  var endSign = false;
  while(1){
    endSign=true;
    for(var i=0;i<ee.length;i++){
      if(ee[i][0]==s||ee[i][1]==s){
        if(ee[i][0]==s) {s = ee[i][1];}
        else if(ee[i][1]==s) {s = ee[i][0];}
        ee.splice(i,1);
        surVs.push(vs[s]);
        endSign=false;
        break;
      }
    }
    if(endSign) break;
  }
  if(ee.length>0){
    s=0;
    while(1){
      endSign=true;
      for(var i=0;i<ee.length;i++){
        if(ee[i][0]==s||ee[i][1]==s){
          if(ee[i][0]==s) {s = ee[i][1];}
          else if(ee[i][1]==s) {s = ee[i][0];}
          ee.splice(i,1);
          surVs.unshift(vs[s]);
          endSign=false;
          break;
        }
      }
      if(endSign) break;
    }
  }
}

function delaunay(){
  //sort the vs
  for (var i = 0; i < vI; i++) {
    for (var j = 0; j < vI-1; j++) {
      if (vs[j].x>vs[j+1].x) {
        var temp = vs[j];
        vs[j]= vs[j+1].clone();
        vs[j+1]=temp.clone();
      }
    }
  }

  //Make Trangulation
  addFace(0,1,2);
  for(var i =3; i<vI; i++){
    var addedV=[];
    for (var j = 0; j < i; j++) {
      var s = true;
      for (const edge of es) {
        if(isCross(vs[edge[0]],vs[edge[1]],vs[i],vs[j])==true){
          s = false;
          break;
        }
      }
      if (s == true)
        addedV.push(j);
    }
    for (var k = 0; k < addedV.length; k++) {
      for (var l = 0; l < addedV.length-1; l++) {
        if (vs[addedV[l]].y>vs[addedV[l+1]].y) {
          var temp = addedV[l];
          addedV[l]= addedV[l+1];
          addedV[l+1]=temp;
        }
      }
    }
    for (var k=0;k<addedV.length-1;k++){
      addFace(addedV[k],addedV[k+1],i);
    }
  }

  for (var i=0;i<fs.length;i++){
    for (var j=i+1;j<fs.length;j++){
      var r = faceAdjacent(fs[i],fs[j]);
      if(r!=false){
        var f1vout = r[2];
        var f1vin1 = r[0];
        var f1vin2 = r[1];
        var f2vout = r[5];
        var f2vin1 = r[3];
        var f2vin2 = r[4];
        var a = fs[i][String.fromCharCode(f1vout+97)];
        var b = fs[i][String.fromCharCode(f1vin1+97)];
        var c = fs[i][String.fromCharCode(f1vin2+97)];
        var b2 = fs[j][String.fromCharCode(f2vin1+97)];
        var c2 = fs[j][String.fromCharCode(f2vin2+97)];
        var d = fs[j][codeAt(f2vout)]
        if(!isDelaunay(vs[a],vs[b],vs[c],vs[d])){
          fs[i][codeAt(f1vin2)]=d;
          fs[j][codeAt(f2vin1)]=a;
          i=0;
        }
      }
    }
  }
  geo.vertices = vs;
  geo.faces = fs;
  scene.add(mesh);
  render();
}

function codeAt(num){
  return String.fromCharCode(num +97);
}

function faceAdjacent(face1,face2){
  var f1=[];
  var f2=[];
  f1[0]=face1.a;
  f1[1]=face1.b;
  f1[2]=face1.c;
  f2[0]=face2.a;
  f2[1]=face2.b;
  f2[2]=face2.c;
  for(var i =0;i<3;i++){
    for (var j=0;j<3;j++){
      if((f1[i]==f2[j]&&f1[(i+1)%3]==f2[(j+1)%3])&&f1[(i+2)%3]!=f2[(j+2)%3]){
        return [i,(i+1)%3,(i+2)%3,j,(j+1)%3,(j+2)%3];
      }else if((f1[(i+1)%3]==f2[j]&&f1[i]==f2[(j+1)%3])&&f1[(i+2)%3]!=f2[(j+2)%3]){
        return [(i+1)%3,i,(i+2)%3,j,(j+1)%3,(j+2)%3];
      }
    }
  }
  return false;
}

function edgeExist(v1,v2,edges){
  if(edges == undefined) edges = es;
  for(const edge of edges){
    if((edge[0]==v1&&edge[1]==v2)||(edge[1]==v1&&edge[0]==v2)){
      return true;
    }
  }
  return false;
}

function isDelaunay(a,b,c,d){
  var mat = new THREE.Matrix4();
  if(isCounterClock(a,b,c)){
    mat.set(a.x,a.y,Math.pow(a.x,2)+Math.pow(a.y,2),1,
      b.x,b.y,Math.pow(b.x,2)+Math.pow(b.y,2),1,
      c.x,c.y,Math.pow(c.x,2)+Math.pow(c.y,2),1,
      d.x,d.y,Math.pow(d.x,2)+Math.pow(d.y,2),1)

  }else{
    mat.set(a.x,a.y,Math.pow(a.x,2)+Math.pow(a.y,2),1,
      c.x,c.y,Math.pow(c.x,2)+Math.pow(c.y,2),1,
      b.x,b.y,Math.pow(b.x,2)+Math.pow(b.y,2),1,
      d.x,d.y,Math.pow(d.x,2)+Math.pow(d.y,2),1)
  }
  if(mat.determinant()>0) return false;
  else return true;
}

function isCounterClock(a,b,c){
  var res = (a.x-c.x)*(a.y-b.y)-(a.y-c.y)*(a.x-b.x);
  return res<0;
}

function isCross(p1,p2,q1,q2){
  var d1 = (p2.x-p1.x)*(q1.y-p1.y)-(p2.y-p1.y)*(q1.x-p1.x);
  var d2 = (p2.x-p1.x)*(q2.y-p1.y)-(p2.y-p1.y)*(q2.x-p1.x);
  var b1 = (q2.x-q1.x)*(p1.y-q1.y)-(q2.y-q1.y)*(p1.x-q1.x);
  var b2 = (q2.x-q1.x)*(p2.y-q1.y)-(q2.y-q1.y)*(p2.x-q1.x);
  return (d1*d2)<0 && (b1*b2)<0;
}

function addFace(a,b,c){
  fs.push(new THREE.Face3(a,b,c));
  if(!edgeExist(a,b))
    es.push([a,b]);
  if(!edgeExist(b,c))
    es.push([b,c]);
  if(!edgeExist(c,a))
    es.push([c,a]);
}

//-----------------------------------------------------------------------//
