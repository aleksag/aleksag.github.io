let Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite,
  Composites = Matter.Composites,
  Constraint = Matter.Constraint,
  Mouse = Matter.Mouse,
  MouseConstraint = Matter.MouseConstraint,
  Events = Matter.Events,
  Body = Matter.Body;

let engine;
let render;
let runner;

let background = "blue";

function init() {
  // create an engine
  engine = Engine.create();

  // create a renderer
  render = Render.create({
    element: document.getElementById("areaToRender"),
    engine: engine,
    options: {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: 1,
      background: '#fafafa',
      wireframes: false // <-- important
    }
  });

  Render.run(render);
  runner = Runner.create();

  let boxA = Bodies.rectangle(1000, 400, 80, 80);

  var mainCircle = containerPolygon(Math.round(window.innerWidth / 2),Math.round(window.innerHeight / 2),20,Math.round(window.innerHeight * 0.45), {isStatic: true})

  /*let mainCircle = Bodies.circle(Math.round(window.innerWidth / 2), Math.round(window.innerHeight / 2), Math.round(window.innerHeight * 0.45), {
    isStatic: true, render: {
      fillStyle: background,
      strokeStyle: "black",
      lineWidth: Math.round(window.innerHeight / 100)
    }
  });*/

  Composite.add(engine.world, [mainCircle, boxA]);



  Runner.run(runner, engine);
}

function containerPolygon(x, y, sides, radius, options) {
  const width = options.width || 20; delete options.width;
  const extraLength = 1;
  const initialRotation = options.initialRotation || 0; delete options.initialRotation;

  const theta = 2 * Math.PI / sides;
  const sideLength = 2 * radius * theta / 2 * extraLength;

  const parts = [];
  for (let i = 0; i < sides; i++) {
    // We'll build thin sides and then translate + rotate them appropriately.
    const body = Bodies.rectangle(0, 0, sideLength, width);
    Body.rotate(body, i * theta);
    Body.translate(body, { x: radius * Math.sin(i * theta), y: -radius * Math.cos(i * theta) });
    parts.push(body);
  }
  const ret = Body.create(options);
  Body.setParts(ret, parts);
  if (initialRotation) {
    Body.rotate(ret, initialRotation);
  }
  Body.translate(ret, { x: x, y: y });

  return ret;
}