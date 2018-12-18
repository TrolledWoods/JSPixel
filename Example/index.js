"use strict";

let screen;
let drawseq;
let cam;
let minimap;
let dirt;
let tilemap;
let particle_handler;
let snow = {
    init: args => {
        return {
            x: args.data.x,
            y: args.data.y,
            vx: args.data.vx,
            vy: args.data.vy,
            color: Math.random() > 0.6 ? "blue" : (Math.random() > 0.2 ? "cyan" : "white")
        };
    },
    render: args => {
        args.screen.DrawRect({
            x: args.data.x,
            y: args.data.y,
            width: 0.5,
            height: 0.5,
            color: args.data.color
        });
    },
    update: args => {
        args.data.x += args.data.vx;
        args.data.y += args.data.vy;
        args.data.vy -= 0.002;

        if(args.data.vy < -0.4)
            args.data.dead = true;
    }
}

let screen_shake;

let screenshots = [];

window.onload = () => {
    screen_shake = new CreateEffect_ScreenShake();
    particle_handler = new ParticleHandler();
    
    tilemap = new InfiniteTilemap(Tilemap.Create({
        min_x: -100, min_y: -100,
        max_x: 100, max_y: 100,
        tile_scale: 10,
        MappingFunc: args => {
            return {
                color: (args.pos.x + args.pos.y) % 2 == 0 ? "black" : "grey",
                explored: false
            }
        }
     }), 64, 64);

    Texture.LoadFromFile("dirt.png")
        .then(result => {
            screen = Screen.FromID('canvas');
            screen.AddEffect(screen_shake);
            
            drawseq = new DrawingSequence(screen.width, screen.height);
            cam =     new Camera(screen, 0, 0, 20);
            minimap = new Camera(screen.GetSection(screen.width - 40, 10, 30, 30), 0, 0, .2);

            dirt = new Animation(result.SplitIntoGrid({grid_size: {x: 2, y: 3}}), 2);

            frame();
        });
}

function frame() {
    particle_handler.Add({
        type: snow,
        data: {
            x: 0, y: 0, vx: (Math.random() - 0.5) * 0.05, vy: Math.random() * 0.1
        }
    });

    window.requestAnimationFrame(frame);
    screen.UpdateEffects();

    cam.Clear({ color: "black" })
        .DrawTilemap({
            tilemap: tilemap, 
            DrawTile: (args) => {
                if(args.tile === null) return;
                args.tile.explored = true;
                args.screen.DrawRect({
                    x: args.x, y: args.y,
                    width: args.size, height: args.size,
                    color: args.tile.color
                });
            }
        })
        .DrawParticleHandler({ handler: particle_handler })
        .DrawCircle({ x: -4, y: 5, r: 1, color: "darkred" })
        .DrawCircle({ x: 4, y: 5, r: 1, color: "darkred" });
    
    minimap.DrawTilemap({
        tilemap: tilemap, 
        DrawTile: (args) => {
            if(args.tile === null || !args.tile.explored) return;
            args.screen.DrawRect({
                x: args.x - 5, y: args.y - 5,
                width: args.size + 10, height: args.size + 10,
                color: "magenta"
            });
        }
    }).DrawTilemap({
        tilemap: tilemap, 
        DrawTile: (args) => {
            if(args.tile === null || !args.tile.explored) return;
            args.screen.DrawRect({
                x: args.x, y: args.y,
                width: args.size, height: args.size,
                color: args.tile.color
            });
        }
    })

    particle_handler.Update();
}

function keyPressed(evt){
    switch(evt.key){
        case "ArrowRight":
            cam.pos.x += 0.5;
            minimap.pos.x += 0.5;
            break;
        case "ArrowLeft":
            cam.pos.x -= 0.5;
            minimap.pos.x -= 0.5;
            break;
        case "ArrowUp":
            cam.pos.y += 0.5;
            minimap.pos.y += 0.5;
            break;
        case "ArrowDown":
            cam.pos.y -= 0.5;
            minimap.pos.y -= 0.5;
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