"use strict";

let screen;
let drawseq;
let cam;
let minimap;
let dirt;
let tilemap;

let screenshots = [];

window.onload = () => {
    tilemap = new InfiniteTilemap(Tilemap.Create({
        min_x: -100, min_y: -100,
        max_x: 100, max_y: 100,
        MappingFunc: args => {
            return args.pos.x % 4 == 0 || args.pos.y % 4 == 0 ? "red" : "blue";
        }
     }), 64, 64);
    tilemap.SetTile({ x: 0, y: 0, tile: "black"});
    tilemap.SetTile({ x: 0, y: 0, tile: "white" });

    Texture.LoadFromFile("dirt.png")
        .then(result => {
            screen = Screen.FromID('canvas');
            
            drawseq = new DrawingSequence(screen.width, screen.height);
            cam =     new Camera(screen, 0, 0, 20);
            minimap = new Camera(screen.GetSection(screen.width - 40, 10, 30, 30), 0, 0, 3);

            dirt = new Animation(result.SplitIntoGrid({grid_size: {x: 2, y: 3}}), 2);

            frame();
        });
}

function frame() {
    window.requestAnimationFrame(frame);

    drawseq.Clear({ color: "black" })
        .DrawTilemap({
            tilemap: tilemap, 
            DrawTile: (args) => {
                args.screen.DrawRect({
                    x: args.x, y: args.y,
                    width: args.size, height: args.size,
                    color: args.tile
                });
            }
        })
        .DrawRect({x:0,y:0,width:.5,height:.5,color: "cyan"})
        .DrawRect({x:4,y:3,width:.5,height:.5,color: "cyan"})
        .DrawRect({x:6,y:2,width:.5,height:.5,color: "cyan"});
    
    cam    .DrawDrawingSequence({ sequence: drawseq });
    minimap.DrawDrawingSequence({ sequence: drawseq });
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
            screenshots.push(drawseq.Clone());
            break;
    }
}