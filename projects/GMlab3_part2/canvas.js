//Variables
var curveType;
let VERMAX = 20;
var vertices = new Array(VERMAX);
var polys = [];
var faces = [];
var verI;
var slices;
//dragging
var mouseX;
var mouseY;

//scene camera and renderer
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(90, 2, 0.1, 1000);
camera.position.z = 250;
var renderer = new THREE.WebGLRenderer({
  antialias: true
});
renderer.setSize(1000, 500);

//materials
var pointMaterial = new THREE.PointsMaterial();
pointMaterial.color = new THREE.Color("rgb(255, 255,0)");
pointMaterial.size = 3;
var lineMaterial = new THREE.LineBasicMaterial({
  color: 0xffff00
});
lineMaterial.linewidth = 2;
var material = new THREE.LineBasicMaterial({
  color: 0xff0000
});
lineMaterial.linewidth = 1;
var meshMaterial = new THREE.MeshDepthMaterial();
meshMaterial.wireframe = true;

//Objects
var box = new THREE.Object3D();
var pointGeo = new THREE.Geometry();
pointGeo.vertices = vertices;
var points = new THREE.Points(pointGeo, pointMaterial);
var axisGeo = new THREE.Geometry();
axisGeo.vertices.push(new THREE.Vector3(0, 250, 0));
axisGeo.vertices.push(new THREE.Vector3(0, -250, 0));
var axis = new THREE.Line(axisGeo, lineMaterial);
var polyGoe = new THREE.Geometry();
var polyMesh = new THREE.Mesh(polyGoe, meshMaterial);

//UI definition
var canvas = document.getElementById('canvasDiv').appendChild(renderer.domElement);
var options = document.getElementById('options');
var drawButton = document.getElementById('draw');
drawButton.onclick = draw;
var drawTriangleButton = document.getElementById('drawTriangle');
drawTriangleButton.onclick = drawTriangle;
var dooSabinButton = document.getElementById("dooSabinButton");
dooSabinButton.onclick = dooSabinWrapper;
var catmullButton = document.getElementById("catmullButton");
catmullButton.onclick = catmull;
var loopButton = document.getElementById("loopButton");
loopButton.onclick = loop;
document.getElementById('offFile').addEventListener('change',showOFF,false);


initDrawing();



function showOFF(){
  var file = this.files[0];
  var reader = new FileReader();
  reader.readAsText(file);
  reader.onload= function (){
    off = this.result;
    var index = off.indexOf('\n');
    var line = off.slice(0,index);
    off = off.substring(index+1);
    if (line!="OFF") return -1;
    index =off.indexOf('\n');
    line = off.slice(0,index);
    off = off.substr(index+1);
    index = off.indexOf(' ');
    var nv = parseInt(line.slice(0,index));
    index = line.indexOf(' ');
    line = line.substring(index+1);
    index = line.indexOf(' ');
    var nf = parseInt(line.slice(0,index));
    for(var i=0;i<nv;i++){
      index =off.indexOf('\n');
      line = off.slice(0,index);
      off = off.substr(index+1);
      var temp = new THREE.Vector3();
      [temp.x,temp.y,temp.z]=line.split(" ");
      temp.x=parseFloat(temp.x);
      temp.y=parseFloat(temp.y);
      temp.z=parseFloat(temp.z);
      polys.push(temp);
    }
    for(var i=0;i<nf;i++){
      index =off.indexOf('\n');
      line = off.slice(0,index);
      off = off.substr(index+1);
      var deg,temp;
      temp=line.split(' ');
      deg=parseInt(temp[0]);
      var newFace=[];
      for (var j = 1; j < temp.length; j++){
        newFace.push(polys[parseInt(temp[j])]);
      }
      faces.push(newFace);
    }
    makeMesh(faces);
    scene.add(box);
    camera.position.z =1;
    loopButton.disabled=false;
    render();
  }
  canvas.removeEventListener("click", addDots);
  scene.remove(points);
  scene.remove(axis);
  canvas.addEventListener("mousedown", rotateStart);
  canvas.addEventListener("mouseup", rotateEnd);
}

function render() {
  renderer.render(scene, camera);
}

function addDots(e) {
  var x = e.pageX - canvas.offsetLeft - 500;
  var y = 250 - (e.pageY - canvas.offsetTop);
  var z = 0;
  vertices[verI].set(x, y, z);
  verI++;
  pointGeo.verticesNeedUpdate = true;
  scene.add(points);
  render();
}

function rotateStart(e) {
  mouseX = e.pageX - canvas.offsetLeft - 500;
  mouseY = 250 - (e.pageY - canvas.offsetTop);
  canvas.addEventListener("mousemove", rotating);
}

function rotating(e) {
  var x = e.pageX - canvas.offsetLeft - 500;
  var y = 250 - (e.pageY - canvas.offsetTop);
  delX = (x - mouseX) * Math.PI * 2 / 1000;
  delY = (y - mouseY) * Math.PI * 2 / 1000;
  mouseX = x;
  mouseY = y;
  box.rotation.x -= delY;
  box.rotation.y += delX;
  render();
}

function rotateEnd(e) {
  canvas.removeEventListener("mousemove", rotating);
}

function initDrawing() {

  //clean up
  scene.remove(axis);
  scene.remove(points);
  scene.remove(box);
  render();
  canvas.removeEventListener("mousedown", rotateStart);
  canvas.removeEventListener("mouseup", rotateEnd);
  while (options.hasChildNodes()) {
    options.removeChild(options.lastChild);
  }

  //add options
  function addOptions(opts) {
    for (i = 0; opts[i] != undefined; i++) {
      options.appendChild(document.createTextNode(opts[i]["name"]));
      var opt = document.createElement("input");
      opt.id = opts[i]["name"];
      opt.value = opts[i]["default"];
      options.appendChild(opt);
    }
  }
  var opts = [];
  opts[0] = {
    "name": "Slices",
    "default": 3
  }
  addOptions(opts);

  //initialize parameters
  for (var i = 0; i < VERMAX; i++) {
    vertices[i] = new THREE.Vector3(10000000, 0, 0);
  }
  polys = [];
  verI = 0;
  canvas.addEventListener("click", addDots);
  scene.add(axis);
  render();
  draw();
}

function draw() {
  if (verI < 2) {
    return -1;
  }
  coe = options.childNodes;
  for (i = 0; coe[i] instanceof HTMLInputElement; i++) {
    if (isNaN(coe[i].value))
      return -1;
  }
  canvas.removeEventListener("click", addDots);
  canvas.addEventListener("mousedown", rotateStart);
  canvas.addEventListener("mouseup", rotateEnd);
  scene.remove(points);
  polygon();
  makeOriFace(verI, slices);
  scene.remove(axis);
  makeMesh(faces);
  scene.add(box);
  render();
}

function catmull(){
  //calculate face vertices
  cats = [];
  catFaces = [];
  var nf = faces.length;
  for (i=0;i<nf;i++){
    var sum = new THREE.Vector3(0,0,0);
    var nv=faces[i].length;
    for (j=0;j<nv;j++){
      sum.add(faces[i][j]);
    }
    sum.divideScalar(faces[i].length);
    cats.push(sum);
  }

  //edge and vertice vertices
  var nf = faces.length;
  for (i=0;i<nf;i++){
    console.log(i+"/"+nf+" faces processed");
    var nv=faces[i].length;
    var v =[];
    var e =[];
    for (j=0;j<nv;j++){
      // calculate e[j-1] and e[j]
      var k = (j+nv-1)%nv;
      var p1=faces[i][j];
      var p2=faces[i][k];
      var p3=faces[i][(j+1)%nv];
      if (e[k]==undefined){
        var temp=faces.slice(0);
        delete temp[i];
        var i2=findEdgeInFace(p1,p2,temp);
        e[k]=cats[i].clone().add(cats[i2]).add(p1).add(p2);
        e[k].divideScalar(4);
      }
      if (e[j]==undefined){
        var temp=faces.slice(0);
        delete temp[i];
        var i2=findEdgeInFace(p1,p3,temp);
        e[j]=cats[i].clone().add(cats[i2]).add(p3).add(p1);
        e[j].divideScalar(4);
      }
      //calculate v[j]
      var temp =faces.slice(0);
      var info = findVerticeInFace(p1,p3,temp);
      var num = info.length;
      var qq = new THREE.Vector3(0,0,0);
      var rr = new THREE.Vector3(0,0,0);
      for(m =0;m<num;m++){
        qq.add(cats[info[m][0]]);
        rr.add((p1.clone().add(faces[info[m][0]][info[m][1]])).divideScalar(2))
      }
      qq.multiplyScalar(1/(num*num));
      rr.multiplyScalar(2/(num*num));
      v[j]=p1.clone().multiplyScalar((num-3)/num).add(qq).add(rr);

      //connect
      catFaces.push([e[k],v[j],e[j],cats[i]]);
    }
  }
  while(box.children.length>0){
    box.remove(box.children[0]);
  }
  makeMesh(catFaces);
  faces = catFaces;
  render();
}

function findVerticeInFace(v,nei,faces){
  var nf = faces.length;
  for (var i=0;i<nf;i++){
    if(faces[i]!=undefined){
      var nv=faces[i].length;
      for (var j=0;j<nv;j++){
        k = (j+nv-1)%nv;
        p=faces[i][j];
        ien1=faces[i][k];
        ien2=faces[i][(j+1)%nv];
        if(compare(p,v)){
          if(compare(nei,ien1)){
            delete faces[i];
            return [[i,k]].concat(findVerticeInFace(v,ien2,faces));
          }else if(compare(nei,ien2)){
            delete faces[i];
            return [[i,(j+1)%nv]].concat(findVerticeInFace(v,ien1,faces));
          }
        }
      }
    }
  }
  return [];
}

function findEdgeInFace(v1,v2,faces){
  var nf = faces.length;
  for (var i=0;i<nf;i++){
    if(faces[i]!=undefined){
      var nv=faces[i].length;
      for (var j=0;j<nv;j++){
        k1 = (j+nv-1)%nv;
        k2 = (j+1)%nv;
        p=faces[i][j];
        l1=faces[i][k1];
        l2=faces[i][k2];
        if(compare(p,v1)&&(compare(l1,v2)||compare(l2,v2))){
          return i;
        }
      }
    }
  }
}

function dooSabinWrapper(){
  dooSabin();
  while(box.children.length>0){
    box.remove(box.children[0]);
  }
  makeMesh(dooFaces);
  faces=dooFaces;
  polys = doos;
  render();
}

function compare(v1,v2){
  if (Math.abs(v1.x-v2.x)<0.000000001&&Math.abs(v1.y-v2.y)<0.000000001&&Math.abs(v2.z-v1.z)<0.000000001)
    return true;
  else
    return false;
}

function loop(){
  var loopFaces = [];
  var nf = faces.length;
  for (var i=0;i<nf;i++){
    console.log(i+"/"+nf+" faces processed");
    var e =[];
    var v=[];
    for (var j =0;j<3;j++){
      var p1 = faces[i][j];
      var p2 = faces[i][(j+1)%3];
      var p3 =faces[i][(j+2)%3];
      var temp = faces.slice(0);
      delete temp[i];
      var i2 = findEdgeInFace(p1,p2,temp);
      for(var k =0;k<3;k++){
        if (!compare(faces[i2][k],p1)&&!compare(faces[i2][k],p2)){
          j2 = k;
          break;
        }
      }
      var p4 =faces[i2][j2];
      e[j]=p1.clone().multiplyScalar(3);
      e[j].add(p2.clone().multiplyScalar(3));
      e[j].add(p3).add(p4);
      e[j].divideScalar(8);

      temp = faces.slice(0);
      var info=findVerticeInFace(p1,p2,temp)
      var num = info.length;
      v[j]= new THREE.Vector3(0,0,0);
      for (var l =0;l<num;l++){
        v[j].add(faces[info[l][0]][info[l][1]]);
      }
      v[j].multiplyScalar(3/(8*num));
      v[j].add(p1.clone().multiplyScalar(5/8));
    }
    loopFaces.push([e[0],e[1],e[2]]);
    loopFaces.push([v[0],e[0],e[2]]);
    loopFaces.push([v[1],e[0],e[1]]);
    loopFaces.push([v[2],e[1],e[2]]);
  }
  while(box.children.length>0){
    box.remove(box.children[0]);
  }
  makeMesh(loopFaces);
  faces = loopFaces;
  render();
}

function drawTriangle(){
  if (verI < 2) {
    return -1;
  }
  coe = options.childNodes;
  for (i = 0; coe[i] instanceof HTMLInputElement; i++) {
    if (isNaN(coe[i].value))
      return -1;
  }
  canvas.removeEventListener("click", addDots);
  canvas.addEventListener("mousedown", rotateStart);
  canvas.addEventListener("mouseup", rotateEnd);
  scene.remove(points);
  polygon();
  scene.remove(axis);
  var sumTop=new THREE.Vector3(0,0,0);
  var sumBottom=new THREE.Vector3(0,0,0);
  for (i = 0; i < slices; i++) {
    for (j = 0; j < verI - 1; j++) {
      a = j + i * verI;
      b = (j + (i + 1) * verI)%(verI*slices);
      c = b + 1;
      faces.push([polys[a],polys[b], polys[c]]);
    }
    for (j = 1; j < verI; j++) {
      a = j + i * verI;
      b = (j + (i - 1) * verI+verI*slices)%(verI*slices);
      c = b - 1;
      faces.push([polys[a],polys[b], polys[c]]);
    }
    sumTop.add(polys[i*verI]);
    sumBottom.add(polys[(i+1)*verI-1]);
  }
  sumTop.divideScalar(slices);
  sumBottom.divideScalar(slices);
  polys.push(sumTop);
  polys.push(sumBottom);
  for(var i =0 ;i<slices;i++){
    faces.push([polys[i*verI],polys[((i+1)*verI)%(slices*verI)],sumTop]);
    faces.push([polys[(i+1)*verI-1],polys[((i+2)*verI-1)%(slices*verI)],sumBottom]);
  }
  loopButton.disabled=false;
  makeMesh(faces);
  scene.add(box);
  render();
}

function polygon() {
  slices = parseInt(document.getElementById('Slices').value);
  var ang = Math.PI * 2 / slices;
  // Calculating polygon points
  for (i = 0; i < verI * slices; i++) {
    if (i < verI)
      polys.push(vertices[i].clone());
    else
      polys.push(vertices[i % verI].clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), ang * Math.floor(i / verI)));
  }
  polyGoe.vertices = polys;
}

function makeOriFace(row, col) {
  var top = [];
  var bottom = [];
  for (i = 0; i < col; i++) {
    for (j = 0; j < row-1; j++) {
      a = j + i * row;
      b = a + 1;
      c = j + (i + 1) * row;
      if (c>=row*col) c=j;
      d = c + 1;
      temp = [polys[a].clone(), polys[b].clone(), polys[d].clone(), polys[c].clone()];
      faces.push(temp);
    }
    top.push(polys[i * row].clone());
    bottom.push(polys[(i + 1) * row - 1].clone());
  }
  faces.push(top);
  faces.push(bottom);
}

function makeMesh(faces) {
  for (i = 0; i < faces.length; i++) {
    for (j = 0; j < faces[i].length; j++) {
      tempGeo = new THREE.Geometry();
      tempMesh = new THREE.Line(tempGeo, material);
      tempGeo.vertices.push(faces[i][j]);
      tempGeo.vertices.push(faces[i][(j + 1) % faces[i].length]);
      box.add(tempMesh);
    }
  }
}

function dooSabin(){
  dooFaces=[];
  doos =[];
  // Face Faces
  for(i=0;i<faces.length;i++){
    dooFaces[i]=[];
    centre = new THREE.Vector3(0,0,0);
    l = faces[i].length;
    for (j=0;j<l;j++) {
      centre.add(faces[i][j]);
    }
    centre.divideScalar(l);
    var tempFace = [];
    for(j=0; j<faces[i].length;j++){
      mid1 = faces[i][j].clone();
      mid1.add(faces[i][(j+1)%l]).divideScalar(2);
      mid2 = faces[i][j].clone();
      mid2.add(faces[i][(j+l-1)%l]).divideScalar(2);
      temp = centre.clone();
      temp.add(faces[i][j]).add(mid1).add(mid2).divideScalar(4);
      dooFaces[i].push(temp);
      doos.push(temp);
    }
  }

  //Edge Faces
  var nf = faces.length;
  for (i=0;i<nf;i++){
    console.log(i+"/"+nf+" faces processed");
    var nv1 = faces[i].length;
    for (p1=0;p1<nv1;p1++){
      var nei1=(p1+1)%nv1;
      for(j=i+1;j<nf;j++){
        var nv2 = faces[j].length;
        for(p2=0;p2<nv2;p2++){
          var nei2 = (p2-1+nv2)%nv2;
          var nei3 = (p2+1)%nv2;
          if(compare(faces[i][p1],faces[j][p2])){
            if(compare(faces[i][nei1],faces[j][nei2])){
              temp=[dooFaces[i][p1].clone(),dooFaces[j][p2].clone(),dooFaces[j][nei2].clone(),dooFaces[i][nei1].clone()];
              dooFaces.push(temp);
            }else if(compare(faces[i][nei1],faces[j][nei3])){
              temp=[dooFaces[i][p1].clone(),dooFaces[j][p2].clone(),dooFaces[j][nei3].clone(),dooFaces[i][nei1].clone()];
              dooFaces.push(temp);
            }
          }
        }
      }
    }
  }

  //Vertices Faces
  var np = polys.length;
  for(i=0;i<np;i++){
    console.log(i+"/"+np+" vertices processed");
    vArray =[];
    var nf = faces.length;
    //Find the common vertices.
    for(m=0;m<nf;m++){
      nv= faces[m].length;
      for(n=0;n<nv;n++){
        if(compare(faces[m][n],polys[i])) vArray.push([m,n]);
      }
    }

    var ori = [];
    var m = vArray[0][0];
    var n = vArray[0][1];
    var nv = faces[m].length;
    var nei = faces[m][(n+1)%nv];
    ori.push(dooFaces[m][n]);
    vArray.splice(0,1);
    while(vArray.length>0){
      for (k=0;k<vArray.length;k++){
        m2 = vArray[k][0];
        n2 = vArray[k][1];
        l=faces[m2].length;
        ien1 = faces[m2][(n2+1)%l];
        ien2 = faces[m2][(n2+l-1)%l];
        if(compare(nei,ien1)||compare(nei,ien2)){
          ori.push(dooFaces[m2][n2]);
          vArray.splice(k,1);
          if(compare(nei,ien1)) nei=ien2.clone();
          else nei = ien1.clone();
          break;
        }
      }
    }
    dooFaces.push(ori);
  }
}
