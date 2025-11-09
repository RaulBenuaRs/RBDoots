let cam;
let puntos = [];
let resolucion = 8;
let tocando = false;

let mic;
let micStarted = false;
let micLevel = 0;
let sistemaIniciado = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textAlign(CENTER, CENTER);
  textFont('monospace');
  textSize(16);
}

function draw() {
  background(255);

  if (!sistemaIniciado) {
    stroke(0);
    strokeWeight(2);
    fill(255);
    ellipse(width / 2, height / 2, 80);
    noStroke();
    fill(0);
    text('click', width / 2, height / 2);
    return;
  }

  if (micStarted) {
    micLevel = mic.getLevel();
  }

  cam.loadPixels();

  for (let i = 0; i < puntos.length; i++) {
    let p = puntos[i];

    let cx = floor(p.baseX / resolucion);
    let cy = floor(p.baseY / resolucion);
    let index = (cy * cam.width + cx) * 4;

    let r = cam.pixels[index];
    let g = cam.pixels[index + 1];
    let b = cam.pixels[index + 2];
    let brillo = (r + g + b) / 3;
    p.brillo = brillo;

    if (tocando) {
      // CLICK → regresar a la forma base
      p.x = lerp(p.x, p.baseX, 0.25);
      p.y = lerp(p.y, p.baseY, 0.25);
    } else if (micLevel > 0.01) {
      // CON SONIDO → dispersión progresiva hacia todo el canvas
      let caos = map(micLevel, 0, 1, 0.002, 0.05); // más bajo = más lento
      let targetX = random(width);
      let targetY = random(height);
      p.x = lerp(p.x, targetX, caos);
      p.y = lerp(p.y, targetY, caos);
    } else {
      // SIN SONIDO → leve dispersión orgánica basada en la imagen
      let dispersión = map(p.brillo, 0, 255, 0.3, 1.2);
      p.dx += random(-dispersión, dispersión) * 0.05;
      p.dy += random(-dispersión, dispersión) * 0.05;
      p.dx = constrain(p.dx, -1, 1);
      p.dy = constrain(p.dy, -1, 1);
      p.x += p.dx;
      p.y += p.dy;
    }

    if (p.brillo < 200) {
      let alpha = map(p.brillo, 0, 255, 255, 0);
      fill(0, alpha);
      noStroke();
      ellipse(p.x, p.y, map(p.brillo, 0, 255, 3.5, 1.5));
    }
  }

  // Visualizador del volumen
  let diam = map(micLevel, 0, 1, 10, 200);
  fill(0, 30);
  noStroke();
  ellipse(width - 80, height - 80, diam);
  fill(0);
  textSize(12);
  text("vol: " + nf(micLevel, 1, 3), width - 80, height - 20);
}

function iniciarSistema() {
  userStartAudio().then(() => {
    mic = new p5.AudioIn();
    mic.start();
    micStarted = true;

    cam = createCapture(VIDEO);
    cam.size(width / resolucion, height / resolucion);
    cam.hide();

    for (let y = 0; y < cam.height; y++) {
      for (let x = 0; x < cam.width; x++) {
        let sx = x * resolucion;
        let sy = y * resolucion;

        puntos.push({
          baseX: sx,
          baseY: sy,
          x: sx + random(-40, 40),
          y: sy + random(-40, 40),
          dx: 0,
          dy: 0,
          brillo: 255
        });
      }
    }

    sistemaIniciado = true;
  });
}

function mousePressed() {
  if (!sistemaIniciado) {
    iniciarSistema();
  } else {
    tocando = true;
  }
}

function mouseReleased() {
  tocando = false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
