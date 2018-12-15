"use strict"

let screen
let subsection
let cam
let dirt
let red, full_red
let tilemap;

window.onload = () => {
    full_red = Texture.CreateSolid("red", 50, 50)
    red = full_red.GetArea(5, 5, 40, 40)
    tilemap = Tilemap.ParseList(
        "###" + 
        "#.." + 
        "###", 
        -1, -1, 1, 1, 
        c => ({ "#": "red", ".": "white" })[c]);
    console.log(tilemap);

    red.GetScreen()
        .DrawRect(10, 10, 50, 50, "blue")
        .DrawRect(10, 20, 50, 50, "black");

    Texture.LoadFromFile("dirt.png")
        .then(result => {
            screen = Screen.FromID('canvas')
            subsection = screen.GetSection(50, 50, 100, 100)
            cam = new Camera(screen, 0, 0, 20)
            dirt = new Animation(result.SplitIntoGrid({grid_size: {x: 2, y: 3}}), 2);

            frame()
        });
}

function frame() {
    window.requestAnimationFrame(frame);

    screen.Clear("blue");
    
    cam.Clear("black")
        .DrawTilemap(tilemap, (screen, tile, world_pos, pos, size) => {
            if(tile === null) return;
            screen.DrawRect(pos.x, pos.y, size, size, tile);
        })
        .DrawRect(0, 0, 0.5, 0.5, "blue");

    //dirt.Animate(0.025);
    //cam.pos.x += 0.01
}