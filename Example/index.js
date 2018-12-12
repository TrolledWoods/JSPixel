"use strict";

let screen;
let subsection;
let cam;
let dirt;

window.onload = () => {
    Texture.LoadFromFile("dirt.png")
    .then(result => {
            dirt = result.GetArea(0, 0, 120, 120);
            screen = Screen.FromID('canvas');
            subsection = screen.GetSection(50, 50, 100, 100);
            cam = new Camera(subsection, 0, 0, 20);

            frame();
    });
}

function frame() {
    window.requestAnimationFrame(frame);

    screen.Clear("blue");
    cam.Clear("black");
    cam.DrawRect(0, 0, 1.5, 1.5, "red");
    cam.DrawTexture(dirt, 0, 0, 1, 1);

    cam.pos.x += 0.01;
}