class Camera {
    constructor(screen, x, y, zoom){
        this.screen = screen;
        this.pos = { x: x, y: y };
        this.zoom = zoom;
        this.effects = [];
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

    AddEffect(effect){
		this.effects.push(effect);
	}

	UpdateEffects(){
		for(let effect of this.effects){
			if("frame" in effect)
				effect.frame();
		}
	}

	ApplyEffects(args){
		let args_copy = Object.assign({}, args);

		for(let effect of this.effects){
			args_copy = effect.effect(args_copy);
		}

		return args_copy;
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
        args = this.ApplyEffects(args);

        this.screen.Clear(args);

        return this;
    }
    DrawRect(args){
        args = this.ApplyEffects(args);

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
    DrawCircle(args){
        args = this.ApplyEffects(args);

        let pos = this.WorldToScreen({ x: args.x, y: args.y});
        this.screen.DrawCircle({ 
            x: pos.x, 
            y: pos.y, 
            r: args.r * this.zoom,
            color: "color" in args ? args.color : "red" });

        return this;
    }
    DrawGraphic(args){
        args = this.ApplyEffects(args);

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
        args = this.ApplyEffects(args);

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
        args = this.ApplyEffects(args);

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
        args = this.ApplyEffects(args);

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
        args = this.ApplyEffects(args);

		let queue = args.sequence.queue;

		for(let element of queue){
			this[element.name](element.args);
		}

		return this;
    }
    /*
     * -- ARGUMENTS --
     * handler: the particle handler that is rendered  
     */
    DrawParticleHandler(args){
        let handler = args.handler;

        for(let particle of handler.particles) {
            particle.type.render({
                data: particle.data,
                screen: this
            });
        }

        return this;
    }
    DrawDrawingSequence(args){
        args = this.ApplyEffects(args);

		let queue = args.sequence.queue;

		for(let element of queue){
			this[element.name](element.args);
		}

		return this;
	}
    DrawTilemap(args){
        args = this.ApplyEffects(args);

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
                let fargs = {
                    screen: this.screen, 
                    tile: args.tilemap.GetTile({ x: x, y: y }), 
                    tile_pos: { x: x, y: y },
                    x: pos_x - size / 2, 
                    y: pos_y - size / 2,
                    size: size + 1,
                    width: size + 1,
                    height: size + 1
                }
                fargs = this.ApplyEffects(fargs);
                args.DrawTile(fargs);
                pos_y -= size;
            }
            pos_x += size;
        }

        return this;
    }
}