let cam;

window.onload = () => {
    cam = Camera.FromID('canvas', 0, 0, 50);

    frame();
}

function frame() {
    window.requestAnimationFrame(frame);

    cam.Clear("black");
    cam.DrawRect(-.5, -.5, 1, 1, "white");

    cam.pos.x += 0.05;
}