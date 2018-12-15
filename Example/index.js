"use strict";

let screen;
let subsection;
let cam;
let dirt;
let tilemap;

window.onload = () => {
    tilemap = Tilemap.FromList({ 
        tiles: [
            "###",
            "#.#",
            ".#."
        ],
        min_x: -1,
        min_y: -1
     });

    Texture.LoadFromFile("dirt.png")
        .then(result => {
            screen = Screen.FromID('canvas');
            subsection = new DrawingSequence();
            subsection.DrawRect({ x:0, y:0, width: 0.5, height:0.5, color:"cyan" });
            cam = new Camera(screen, 0, 0, 20);
            dirt = new Animation(result.SplitIntoGrid({grid_size: {x: 2, y: 3}}), 2);

            frame();
        });
}

function frame() {
    window.requestAnimationFrame(frame);

    cam.Clear({ color: "black" })
        .DrawTilemap({
            tilemap: tilemap, 
            DrawTile: (args) => {
                if(args.tile === null) return;
                args.screen.DrawRect({ 
                    x: args.pos.x, y: args.pos.y,
                    width:args.scale, height:args.scale,
                    color: ({ '#': "white", '.': "black" })[args.tile]
                });
            }
        })

    //dirt.Animate(0.025);
    //cam.pos.x += 0.01
}

function key_pressed(evt){
    switch(evt.key){
        case "arrowRight":
            cam.pos.x += 0.5;
            break;
        case "arrowLeft":
            cam.pos.x -= 0.5;
            break;
        case "arrowUp":
            cam.pos.y += 0.5;
            break;
        case "arrowDown":
            cam.pos.y -= 0.5;
            break;
    }
}