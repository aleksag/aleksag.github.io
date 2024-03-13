
class Clock {
  constructor(xpos, ypos, width,length, angle) {
    this.xpos = xpos;
    this.ypos = ypos;
    this.width = width;
    this.length = length;
    this.angle = angle;
  }

  draw(){
    let v1 = createVector(this.xpos, this.ypos);
    let v2 = createVector(this.xpos+this.length, this.ypos);

    push();
    stroke(colors[Math.round(this.angle)]);
    strokeWeight(map(this.angle+this.x, 0, 360+window.innerWidth, 1, 10));
    translate(v1.x, v1.y);
    rotate(this.angle);
    translate(-v1.x, -v1.y);
    let r0 = line(v1.x, v1.y, v2.x, v2.y);
    pop();
  }
}

let clocks = Array();
let width = window.innerWidth;
let height = window.innerHeight;
let clockHeight = 15;
let clockWidth = clockHeight;
let colors = Array();
function setup() {
  colorMode(HSB); 

  for(var i = 0; i < 362; i++){
    colors.push(color(i,100,100));
  }
  createCanvas(width, height);
  angleMode(DEGREES);
  let numberOfClocksW = Math.floor(width/clockWidth);
  let numberOfClocksH = Math.floor(height/clockHeight);
  let angleCnt = 0;

  for(let row = 0; row < numberOfClocksH; row++){
    for(let col = 0; col < numberOfClocksW; col ++){
      let x = (col*clockWidth)+Math.round(clockWidth/2);
      let y = (row*clockHeight)+Math.round(clockHeight/2);
      clocks.push(new Clock(x,y,1,clockWidth,angleCnt));
      angleCnt = angleCnt+0.1;
      if(angleCnt > 360){
        angleCnt = 0;
      }
    }
  }

}

let angleAddition = 0.1
let direction = 0.1;
function draw() {
  background(0);
  clocks.forEach(clock => {
    clock.draw();
    let addition = clock.angle+angleAddition;
    if(addition > 360){
      addition = 0;
    }
    clock.angle = addition;
  });
  angleAddition = angleAddition+direction;
  if(angleAddition > 10){
    direction = -direction;
    console.log("flipping");
  }else if(angleAddition <= 0){
    direction = -direction;
  }
}
