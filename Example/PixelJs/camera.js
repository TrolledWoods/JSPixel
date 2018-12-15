class Camera {
    constructor(screen, x, y, zoom){
        this.screen = screen;
        this.pos = { x: x, y: y };
        this.zoom = zoom;
    }

    static FromID(args){
        return new Camera(
            Screen.FromID(args.id), 
            "x" in args ? args.x : 0,
            "y" in args ? args.y : 0,
            "scale" in args ? args.zoom : 1
        );
    }

    static FromScreen(args){
        return new Camera(
            args.screen,
            "x" in args ? args.x : 0,
            "y" in args ? args.y : 0,
            "scale" in args ? args.zoom : 1
        );
    }

    WorldToScreen(world_pos){
        return {
            x: (world_pos.x - this.pos.x) * this.zoom + this.screen.width/2,
            y: (-(world_pos.y - this.pos.y) * this.zoom + this.screen.height/2)
        };
    }

    ScreenToWorld(screen_pos){
        return {
            x: (screen_pos.x - this.screen.width/2) / this.zoom + this.pos.x,
            y: -(screen_pos.y - this.screen.height/2) / this.zoom + this.pos.y
        };
    }
    Clear(args){
        this.screen.Clear(args);

        return this;
    }
    DrawRect(args){
        let pos = this.WorldToScreen({ x: args.x, y: args.y});
        let width = args.width * this.zoom;
        let height = args.height * this.zoom;
        this.screen.DrawRect({ 
            x: pos.x - width / 2, 
            y: pos.y - height / 2, 
            width: width, height: height, 
            color: "color" in args ? args.color : "red" });

        return this;
    }
    DrawGraphic(args){
        let pos = this.WorldToScreen({ x: args.x, y: args.y });
        let width  = args.width  * this.zoom;
        let height = args.height * this.zoom;
        this.screen.DrawGraphic({
            graphic: args.graphic,
            x: pos.x, y: pos.y,
            width: width, height: height
        });
    }
    DrawTexture(args){
        let pos = this.WorldToScreen({ x: args.x, y: args.y });
        let width  = args.width  * this.zoom;
        let height = args.height * this.zoom;
        this.screen.DrawTexture({
            texture: args.texture,
            x: pos.x, y: pos.y,
            width: width, height: height
        });

        return this;
    }
    DrawAnimation(args){
        let pos = this.WorldToScreen({ x: args.x, y: args.y });
        let width  = args.width  * this.zoom;
        let height = args.height * this.zoom;
        this.screen.DrawTexture({
            animation: args.animation,
            x: pos.x, y: pos.y,
            width: width, height: height
        });

        return this;
    }
    DrawAnimationController(args){
        let pos = this.WorldToScreen({ x: args.x, y: args.y });
        let width  = args.width  * this.zoom;
        let height = args.height * this.zoom;
        this.screen.DrawTexture({
            controller: args.controller,
            x: pos.x, y: pos.y,
            width: width, height: height
        });

        return this;
    }
    DrawDrawingSequence(args){
		let queue = args.sequence.queue;

		for(let element of queue){
			this[element.name](element.args);
		}

		return this;
    }
    DrawDrawingSequence(args){
		let queue = args.sequence.queue;

		for(let element of queue){
			this[element.name](element.args);
		}

		return this;
	}
    DrawTilemap(args){
        let size = this.zoom * args.tilemap.tile_scale;
        let middle = args.tilemap.WorldToTilemap(this.ScreenToWorld({x:this.screen.width/2,y:this.screen.height/2}));
        let width = Math.ceil(this.screen.width / (2 * size));
        let height = Math.ceil(this.screen.height / (2 * size));
        let dl = { x: middle.x - width, y: middle.y - height };
        let ur = { x: middle.x + width, y: middle.y + height };

        let origin = this.WorldToScreen(args.tilemap.TilemapToWorld({ x: Math.floor(dl.x), y: Math.floor(dl.y) }));
        let pos_x = Math.floor(origin.x);
        for(let x = Math.floor(dl.x); x <= Math.ceil(ur.x); x++){
            let pos_y = Math.floor(origin.y);
            for(let y = Math.floor(dl.y); y <= Math.ceil(ur.y); y++){
                args.DrawTile({
                    screen: this.screen, 
                    tile: args.tilemap.GetTile({ x: x, y: y }), 
                    tile_pos: { x: x, y: y },
                    pos: { x: pos_x - size / 2, y: pos_y - size / 2 },
                    size: size + 1,
                    width: size + 1,
                    height: size + 1
                });
                pos_y -= size;
            }
            pos_x += size;
        }

        return this;
    }
}