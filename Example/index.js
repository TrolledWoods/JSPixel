"use strict";

let screen;
let subsection;
let cam;
let dirt;
let tilemap;

let screenshots = [];

window.onload = () => {
    tilemap = Tilemap.Create({
        min_x: -100, min_y: -100,
        max_x: 100, max_y: 100,
        MappingFunc: args => {
            return args.pos.x % 4 == 0 || args.pos.y % 4 == 0 ? '#' : '.';
        }
     });

    Texture.LoadFromFile("dirt.png")
        .then(result => {
            screen = Screen.FromID('canvas');
            subsection = new DrawingSequence(screen.width, screen.height);
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
                args.screen.DrawRect({
                    x: args.pos.x, y: args.pos.y,
                    width: args.size, height: args.size,
                    color: args.tile === '#' ? "red" : "blue" 
                });
            }
        })
        .DrawRect({x:0,y:0,width:.5,height:.5,color: "cyan"})
        .DrawRect({x:4,y:3,width:.5,height:.5,color: "cyan"})
        .DrawRect({x:6,y:2,width:.5,height:.5,color: "cyan"})
    
    screen.DrawDrawingSequence({ sequence: subsection });

    //dirt.Animate(0.025);
    //cam.pos.x += 0.01
}

function keyPressed(evt){
    switch(evt.key){
        case "ArrowRight":
            cam.pos.x += 0.5;
            break;
        case "ArrowLeft":
            cam.pos.x -= 0.5;
            break;
        case "ArrowUp":
            cam.pos.y += 0.5;
            break;
        case "ArrowDown":
            cam.pos.y -= 0.5;
            break;
        case "w":
            cam.zoom *= 1.25;
            break;
        case "s":
            cam.zoom /= 1.25;
            break;
        case "c":
            screenshots.push(subsection.Clone());
            break;
    }
}