class Camera {
    constructor(screen, x, y, scale){
        this.screen = screen;
        this.pos = { x: x, y: y };
        this.scale = scale;
    }

    static FromID(args){
        return new Camera(
            Screen.FromID(args.id), 
            "x" in args ? args.x : 0,
            "y" in args ? args.y : 0,
            "scale" in args ? args.scale : 1
        );
    }

    static FromScreen(args){
        return new Camera(
            args.screen,
            "x" in args ? args.x : 0,
            "y" in args ? args.y : 0,
            "scale" in args ? args.scale : 1
        );
    }

    WorldToScreen(world_pos){
        return {
            x: (world_pos.x - this.pos.x) * this.scale + this.screen.width/2,
            y: (world_pos.y - this.pos.y) * this.scale + this.screen.height/2
        };
    }

    ScreenToWorld(screen_pos){
        return {
            x: (screen_pos.x - this.screen.width/2) / this.scale + this.pos.x,
            y: (screen_pos.y - this.screen.height/2) / this.scale + this.pos.y
        };
    }
    Clear(args){
        this.screen.Clear(args);

        return this;
    }
    DrawRect(args){
        let pos = this.WorldToScreen({ x: args.x, y: args.y});
        let width = args.width * this.scale;
        let height = args.height * this.scale;
        this.screen.DrawRect({ 
            x: pos.x - width / 2, 
            y: pos.y - height / 2, 
            width: width, height: height, 
            color: "color" in args ? args.color : "red" });

        return this;
    }
    DrawGraphic(args){
        let pos = this.WorldToScreen({ x: args.x, y: args.y });
        let width  = args.width  * this.scale;
        let height = args.height * this.scale;
        this.screen.DrawGraphic({
            graphic: args.graphic,
            x: pos.x, y: pos.y,
            width: width, height: height
        });
    }
    DrawTexture(args){
        let pos = this.WorldToScreen({ x: args.x, y: args.y });
        let width  = args.width  * this.scale;
        let height = args.height * this.scale;
        this.screen.DrawTexture({
            texture: args.texture,
            x: pos.x, y: pos.y,
            width: width, height: height
        });

        return this;
    }
    DrawAnimation(args){
        let pos = this.WorldToScreen({ x: args.x, y: args.y });
        let width  = args.width  * this.scale;
        let height = args.height * this.scale;
        this.screen.DrawTexture({
            animation: args.animation,
            x: pos.x, y: pos.y,
            width: width, height: height
        });

        return this;
    }
    DrawAnimationController(args){
        let pos = this.WorldToScreen({ x: args.x, y: args.y });
        let width  = args.width  * this.scale;
        let height = args.height * this.scale;
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
    DrawTilemap(args){
        let ul = args.tilemap.WorldToTilemap(this.ScreenToWorld({ x: 0, y: 0}));
        let dr = args.tilemap.WorldToTilemap(this.ScreenToWorld({
            x: this.screen.width, y: this.screen.height }));
        let scale = Math.floor(this.scale * args.tilemap.tile_scale);

        let origin = this.WorldToScreen(args.tilemap.TilemapToWorld({ x: Math.floor(ul.x), y: Math.floor(ul.y) }));
        origin.x = Math.floor(origin.x);
        origin.y = Math.floor(origin.y);
        let pos_x = origin.x;
        for(let x = Math.floor(ul.x - 1); x <= Math.ceil(dr.x - 1); x++){
            let pos_y = origin.y;
            for(let y = Math.floor(ul.y - 1); y <= Math.ceil(dr.y - 1); y++){
                args.DrawTile({
                    screen: this.screen, 
                    tile: args.tilemap.GetTile({ x: x, y: y }), 
                    tile_pos: { x: x, y: y },
                    pos: { x: pos_x - scale / 2, y: pos_y - scale / 2 },
                    scale: scale,
                    width: scale,
                    height: scale
                });
                pos_y += scale;
            }
            pos_x += scale;
        }

        return this;
    }
}