const TIME_WIDTH=1300;
let selectedBattle=-1;
let bbsvg,casvg,cvsvg,data;
let geo=[];
let legend = svg.append('g')
.attr('id','legend')
let legendDoc = document.getElementById('legend');
let battleTags = [
    {
        name: "Attack on Pearl Harbor",
        position: [-157.943970,21.349270],
        date: new Date("December 7, 1941"),
    },
    {
        name: "Sinking of the Prince of Wales and Repulse",
        position: [104.4333316,3.5666644],
        date: new Date("December 10, 1941"),
    },
    {
        name: "Raids into the Indian Ocean",
        position: [81.372246,6.786172],
        date: new Date("March 31, 1942"),
    },
    {
        name: "Battle of the Coral Sea",
        position: [155.983941,-19.407246],
        date: new Date("May 7, 1942"),
    },
    {
        name: "Battle of Midway",
        position: [-177.397658,28.217971],
        date: new Date("June 4, 1942"),
    },
    {
        name: "Battle of the Komandorski Islands",
        position: [165.983333,55.2],
        date: new Date("March 26, 1943"),
    },
    {
        name: "Destruction of Truk",
        position: [151.740095,7.420763],
        date: new Date("February 17, 1944"),
    },
    {
        name: "Battle of the Phillipine Sea",
        position: [139.516257,13.226300],
        date: new Date("June 19, 1944"),
    },
    {
        name: "Sinking of Yamato",
        position: [128+4/60,30+22/60],
        date: new Date("April 7, 1945"),
    },
    {
        name: "Java Campaign",
        position: [116.368821,-5.571533],
        date: [new Date("February 4, 1942"),new Date("March 1, 1942")],
    },
    {
        name: "Guadalcanal Campaign",
        position: [160.158592,-9.354742],
        date: [new Date("August 9, 1942"),new Date("November 30, 1942")],
    },
    {
        name: "Solomons Campaign",
        position: [155.848476,-7.748545],
        date: [new Date("August 23, 1942"),new Date("November 26, 1943")],
    },
    {
        name: "Leyte Campaign",
        position: [124.226140,9.178569],
        date: [new Date("October 23, 1944"),new Date("November 11, 1944")],
    },
];




svg.attr('id','mainSVG')

let mapTags = g.append('g');
mapTags.attr('id','mapTags')
mapTags.selectAll("*")
    .data(battleTags)
    .enter()
    .append('circle')
    .attr('cx',(d)=>{return projection(d.position)[0]})
    .attr('cy',(d)=>{return projection(d.position)[1]})
    .attr('r',10)
    .style('fill','#ffcc42')
    .on('mouseenter',function(d,i,nodes){
        toolTip = document.createElementNS("http://www.w3.org/2000/svg", "text");
        // console.log(d.event);
        document.getElementById('mainSVG').appendChild(toolTip);
        toolTip.setAttribute("x" ,d3.event.offsetX);
        toolTip.setAttribute("y" ,d3.event.offsetX);
        toolTip.setAttribute("stroke" ,"black");
        toolTip.innerHTML = d.name;
        selectedBattle = i;
        selectionUpdate();
    })
    .on('mousemove',function(d,_,nodes){
        toolTip.setAttribute("x" ,d3.event.offsetX+10);
        toolTip.setAttribute("y" ,d3.event.offsetY+10);
    })
    .on('mouseout',function(d,_,nodes){
        document.getElementById('mainSVG').removeChild(toolTip)
    })

latestTime = new Date(1945,8,1);
earliestTime = new Date(1941,8,1);
timeRange = Math.round((latestTime-earliestTime)/60/60/1000/24);
timeSlider = document.getElementById("timeSlider");
timeSlider.max = timeRange;
timeSlider.value = 0;
timeSlider.style.width=TIME_WIDTH+'px';
currentTime = new Date(earliestTime.getTime() + timeSlider.value * 60*60*1000*24);

let timeScaler = d3.scaleTime()
    .domain([earliestTime,latestTime])
    .range([0, TIME_WIDTH]);
let timeSliderAxis= d3.axisBottom(timeScaler);

tickArray = [];
let iii =0;
for (const battle of battleTags){
    if(battle.date.length==2){
        let date1 = battle.date[0];
        date1.event = battle.name+" start"
        date1.index = iii;
        let date2 = battle.date[1];
        date2.event = battle.name +" end"
        date2.index = iii;
        tickArray.push(date1);
        tickArray.push(date2);
    }
    else{
        let tempDate = battle.date;
        tempDate.event= battle.name;
        tempDate.index = iii;
        tickArray.push(tempDate);
    }
    iii++;
}
// timeSliderAxis
//     .ticks(tickArray.length)
//     .tickValues(tickArray);
axis = d3.select("#Axis");
axisSvg = axis.append("svg");
axisSvg.call(timeSliderAxis.tickFormat(d3.timeFormat("%Y-%m")))
    .style('width',TIME_WIDTH)
    .style('height',60)
    .attr('id','axisSvg')
axisSvg.selectAll(".battleTicks")
    .data(tickArray).enter()
    .append('path')
    .attr('class','battleTicks')
    .attr('d',d3.symbol().type(d3.symbolTriangle))
    .attr('transform',(d)=>{
        tx = timeScaler(d);
        return 'translate('+tx+',23),scale(0.6,2)';
    })
    .on('mouseenter',function(d,i,nodes){
        toolTip = document.createElementNS("http://www.w3.org/2000/svg", "text");
        // console.log(d.event);
        document.getElementById('axisSvg').appendChild(toolTip);
        toolTip.setAttribute("x" ,d3.event.offsetX);
        toolTip.setAttribute("y" ,d3.event.offsetX);
        toolTip.setAttribute("stroke" ,"black");
        toolTip.innerHTML = d.event;
        selectedBattle = d.index;
        selectionUpdate();
    })
    .on('mousemove',function(d,_,nodes){
        toolTip.setAttribute("x" ,d3.event.offsetX);
        toolTip.setAttribute("y" ,d3.event.offsetY+30);
    })
    .on('mouseout',function(d,_,nodes){
        document.getElementById('axisSvg').removeChild(toolTip)
    })

d3.queue()
    .defer(d3.json,'ships.json')
    .defer(d3.xml,"BB.svg")
    .defer(d3.xml,"CV.svg")
    .defer(d3.xml,"CA.svg")
    .await(load);




function draw(){
    var link = d3.line()
     .x(function(d) {return d[0]; })
     .y(function(d) { return d[1]; })

    let resGeo = [];


    for (const ship of data){
        coordinates =[];
        resCo = [];
        coordinates.country = ship.Country;
        resCo.country = ship.Country;
        for (const event of ship.events){
            
            let coord = event.geometry.split(',');
            co =[];
            co[0] = parseFloat(coord[1]);
            co[1] = parseFloat(coord[0]);

            co =projection(co);

            // do not push if the position of out of scope
            if (co[0]>800 || co[0]<0) continue;

            co.date = new Date(event.date);

            //sort the date
            let pushed =false;
            for (let i in coordinates){
                if(co.date<=coordinates[i].date){
                    coordinates.splice(i,0,co);
                    pushed =true;
                    break;
                }
            }
            if (! pushed)
                coordinates.push(co);

            if (co.date<earliestTime || co.date>latestTime) continue;

            pushed =false;
            for (let i in resCo){
                if(co.date<=resCo[i].date){
                    resCo.splice(i,0,co);
                    pushed =true;
                    break;
                }
            }
            if (! pushed)
                resCo.push(co);
        }
        resGeo.push(resCo);
        geo.push(coordinates);
    }
    console.log(resGeo);
    // console.log(geo);


    let shipsGroup = g.append('g');
    shipsGroup.selectAll("*")
        .data(resGeo).enter()
        .append("path")
        .attr("class", "line")
        .attr("d", link)
        .style("stroke", (d)=>{
            if(d.country =="Japan") return "red";
            else return "blue";
        })
        .style("stroke-width", "0.3px")
        .style("fill", "none")
        .style("opacity", "0.2")
    
        
    //add legend

    let legendData = [
        [0,1],[1,1],[0,2],[1,2],[0,3],[1,3]
    ]

    legend.selectAll("*")
        .data(legendData)
        .enter()
        .each(function(d,i,nodes){
            
            let base = 410;
            let step = 15;
            let y=base + step*i;
                
            if(d[1]==1) {
                node = document.importNode(cvsvg.documentElement,true).lastElementChild;
                scaleFactor = 0.035;
                if (d[0]==0) iconColor = 'indianred'
                else iconColor = 'dodgerblue'
            }else if(d[1]==2){
                node = document.importNode(bbsvg.documentElement,true).lastElementChild;
                scaleFactor = 0.07;
                if (d[0]==0) iconColor = 'firebrick'
                else iconColor = 'darkblue'
            }else if(d[1]==3){
                node = document.importNode(casvg.documentElement,true).lastElementChild;
                // console.log(node);
                scaleFactor = -0.005;
                if (d[0]==0) iconColor = 'salmon'
                else iconColor = 'lightskyblue'
            }
            
            // node.id='path'+i;
            // node.classList.add('svgFile');    
            this.appendChild(node);
            
            //coordinate to translate back to (0,0)
            bbox = node.getBBox();
            let xxx = -bbox.x-bbox.width/2;
            let yyy = -bbox.y-bbox.height/2;

            node.setAttribute("transform", "translate(30,"+y+"),scale("+scaleFactor+"),translate("+xxx+","+yyy+")");
            node.setAttribute("style",'fill:'+iconColor)
            for (const ch of node.children){
                ch.setAttribute("style",'fill:'+iconColor);
            }
        })
        .append('text')
        .attr('x',(d)=>{

            return 70;
        })
        .attr('y',(d,i)=>{
            let base = 413;
            let step = 15;
            let y=base + step*i;
            return y;
        })
        .text((d)=>{
            let country;
            let type;
            if(d[1]==1) {
                type = "Carrier";
            }else if(d[1]==2){
                type = "Battleship";
            }else if(d[1]==3){
                type = "Cruiser";
            }
            
            if (d[0]==0) country = "Japan";
            else country = "USA";
            return country+" "+type; })
        .style('font-size','9px')
        .attr("alignment-baseline","middle")

    
    
    // let l = document.importNode(cvsvg.documentElement,true).lastElementChild;
    // oneLegend(l,0.035,'indianred',base)
    // l = document.importNode(cvsvg.documentElement,true).lastElementChild;
    // oneLegend(l,0.035,'dodgerblue',base+step*1)
    // l = document.importNode(bbsvg.documentElement,true).lastElementChild;
    // oneLegend(l,0.07,'firebrick',base+step*2)
    // l = document.importNode(bbsvg.documentElement,true).lastElementChild;
    // oneLegend(l,0.07,'darkblue',base+step*3)
    // l = document.importNode(casvg.documentElement,true).lastElementChild;
    // oneLegend(l,-0.005,'salmon',base+step*4)
    // l = document.importNode(casvg.documentElement,true).lastElementChild;
    // oneLegend(l,-0.005,'lightskyblue',base+step*5)

    drawIcon();
}


function oneLegend(l,scaleFactor,color,y){
    legendDoc.appendChild(l);
    bbox = l.getBBox();
    let xxx = -bbox.x-bbox.width/2;
    let yyy = -bbox.y-bbox.height/2;
    l.setAttribute("transform", "translate(30,"+y+"),scale("+scaleFactor+"),translate("+xxx+","+yyy+")");
    l.setAttribute("style",'fill:'+color)
    for (const ch of l.children){
        ch.setAttribute("style",'fill:'+color);
    }
}

function drawIcon(){
    let shipsIcon = g.append('g');
    shipsIcon.selectAll("*")
        .data(geo).enter()
        .each(function(d,i){
            let x,y;
            if(d.length!=0){
                
                // calculate map projection
                if(currentTime<=d[0].date){
                    // x = d[0][0];
                    // y = d[0][1];
                    return false;
                }
                else if (currentTime>=d[d.length-1].date){
                    // x = d[d.length-1][0];
                    // y = d[d.length-1][1];\
                    return false;
                }else{
                    for(let j =0;j<d.length;j++){
                        if( currentTime>=d[j].date && currentTime<=d[j+1].date){
                            let per = (currentTime.getTime()-d[j].date.getTime())/(d[j+1].date.getTime()-d[j].date.getTime());
                            x = d[j][0]+per*(d[j+1][0]-d[j][0]);
                            y = d[j][1]+per*(d[j+1][1]-d[j][1]);
                            // console.log(per);
                            break;
                        }
                    }
                }

                
                if(isNaN(x)) console.log(d);
                let node;
                let scaleFactor;
                let iconColor;
                if(i<72) {
                    node = document.importNode(cvsvg.documentElement,true).lastElementChild;
                    scaleFactor = 0.035;
                    if (d.country == "Japan") iconColor = 'indianred'
                    else iconColor = 'dodgerblue'
                }else if(i<111){
                    node = document.importNode(bbsvg.documentElement,true).lastElementChild;
                    scaleFactor = 0.07;
                    if (d.country == "Japan") iconColor = 'firebrick'
                    else iconColor = 'darkblue'
                }else if(i<199){
                    node = document.importNode(casvg.documentElement,true).lastElementChild;
                    // console.log(node);
                    scaleFactor = 0.005;
                    if (d.country == "Japan") iconColor = 'salmon'
                    else iconColor = 'lightskyblue'
                }
                
                node.id='path'+i;
                node.classList.add('svgFile');
                for(const index of checkbox_list){
                    if(i==index)    this.appendChild(node);
                }
                
                //coordinate to translate back to (0,0)
                bbox = node.getBBox();
                let xxx = -bbox.x-bbox.width/2;
                let yyy = -bbox.y-bbox.height/2;

                //Note: the transform center is originally at svg (0,0)
                if(i<111){
                    d3.select('#path'+i)
                        .style('fill',iconColor)
                        .attr("transform", "translate("+x+","+y+"),scale("+scaleFactor+"),translate("+xxx+","+yyy+")");
                }else{
                    d3.select('#path'+i)
                        .attr("transform", "translate("+x+","+y+"),scale(-"+scaleFactor+',-'+scaleFactor+"),translate("+xxx+","+yyy+")")
                        .selectAll("path")
                        .style('fill',iconColor)
                    
                }
            }
        });
}

function load(error, d,bbs,cvs,cas) {
    
    bbsvg = bbs;
    casvg = cas;
    cvsvg = cvs;
    data = d;
    draw();
    
}

function setTime(time){
    currentTime = new Date(earliestTime.getTime() + time * 60*60*1000*24);
    d3.selectAll(".svgFile").remove();
    drawIcon();
}

let start;
let step=0.5;
let autoButton = document.getElementById('autoButton');
let ani;
autoButton.addEventListener('click',()=>{
    if (autoButton.innerHTML=="Auto"){
        autoButton.innerHTML = " >> ";
        advance();
    }else if (step<3){
        step *=2;
        // console.log(step);
    }else if(autoButton.innerHTML != "Stop"){
        step *=2;
        autoButton.innerHTML = "Stop";
    }else{
        window.cancelAnimationFrame(ani);
        autoButton.innerHTML="Auto"
    }
},false);
function advance(){
    let timestamp = Date.now();
    if (!start) start = timestamp;
    var progress = timestamp - start;
    if (progress > 50) {
        start = timestamp;
        timeSlider.value=parseInt(timeSlider.value)+step;
        setTime(timeSlider.value);
      }
    if (timeSlider.value<timeRange)
        ani = window.requestAnimationFrame(advance);
    else{
        step =0.5;
        start=undefined;
        window.cancelAnimationFrame(ani);
        autoButton.innerHTML="Auto"
    }
}

function selectionUpdate(){
    mapTags.selectAll("*")
    .style('fill',(d,i)=>{
        if (i==selectedBattle){
            return '#f44268';
        }else{
            return '#ffcc42';
        }
    })

    axisSvg.selectAll(".battleTicks")
    .style('fill',(d,i)=>{
        if (d.index==selectedBattle){
            return '#f44268';
        }else{
            return 'gray';
        }
    })
}