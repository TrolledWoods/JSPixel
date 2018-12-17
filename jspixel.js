class Tilemap {
    constructor(tiles, x, y, width, height){
        this.tiles = tiles
        this.x = x
        this.y = y
        this.width = width
        this.height = height

        this.tile_scale = 1;
    }
    static CreateFilled(default_tile, min_x, min_y, max_x, max_y){
        let tiles = [];
        let width  = max_x - min_x + 1;
        let height = max_y - min_y + 1;
        let size = width * height;

        for(let i = 0; i < size; i++){
            tiles[i] = default_tile;
        }
        
        return new Tilemap(tiles, min_x, min_y, width, height);
    }
    // If the max points are not set, then it will assume the list is two dimensional
    // The min points default to zero
    // The map function defaults to no mapping at all
    // If the list is not defined, it will default to null(The mapfunction is used solely for the creation)
    // Mapfunction arguments: pos, tile
    static Create(args){
        let min_x = "min_x" in args ? args.min_x : 0;
        let min_y = "min_y" in args ? args.min_y : 0;
        let height = "height" in args ? args.height : 
                     ("max_y" in args ? args.max_y - min_y + 1 : 
                     args.tiles.length);
        let width  = "width"  in args ? args.width : 
                     ("max_x" in args ? args.max_x - min_x + 1 : 
                     args.tiles[0].length);

        let two_dimensional = !("width" in args) && !("max_x" in args);
        let mapping_func = "MappingFunc" in args ? args.MappingFunc : (args) => args.tile;
        let tiles_inside = "tiles" in args;
        let mapped_tiles = [];
        let tile_i = 0;
        for(let y = height - 1; y >= 0; y--){
            for(let x = 0; x < width; x++){
                mapped_tiles.push(mapping_func({
                    tile: tiles_inside ? (two_dimensional ? args.tiles[y][x] : args.tiles[tile_i]) : null,
                    pos: { x: x + min_x, y: height - y + min_y - 1 }
                }));
                tile_i++;
            }
        }

        let tilemap = new Tilemap(mapped_tiles, min_x, min_y, width, height);
        if("tile_scale" in args) tilemap.tile_scale = args.tile_scale;
        return tilemap;
    }
    WorldToTilemap(world_pos){
        return {
            x: (world_pos.x) / this.tile_scale,
            y: (world_pos.y) / this.tile_scale
        };
    }
    TilemapToWorld(tilemap_pos){
        return {
            x: tilemap_pos.x * this.tile_scale,
            y: tilemap_pos.y * this.tile_scale
        };
    }
    IsInside(args){
        return args.x>=this.x && args.x<this.x+this.width &&
               args.y>=this.y && args.y<this.y+this.height;
    }
    get_index(args){
        if(!this.IsInside(args)) return -1;

        return  (args.x-this.x) + (args.y-this.y) * this.width;
    }
    GetTile(args){
        let index = this.get_index(args);
        if(index < 0) return null;

        return this.tiles[index];
    }
    SetTile(args){
        let index = this.get_index(args);
        if(index < 0) return this;

        this.tiles[index] = tile;
        return this;
    }
    CreateGetRelativeFunc(origin_x, origin_y){
        return (x, y) => this.GetTile(origin_x + x, origin_y + y);
    }
    CreateSetRelativeFunc(origin_x, origin_y){
        return (x, y, tile) => this.SetTile(origin_x + x, origin_y + y, tile);
    }
}

class InfiniteTilemap extends Tilemap {
    constructor(fallback, chunk_width, chunk_height){
        super([], -Infinity, -Infinity, Infinity, Infinity);

        this.fallback = fallback;
        this.chunks = [];
        this.chunk_width  = chunk_width;
        this.chunk_height = chunk_height;
    }
    GetChunk(args){
        for(let chunk of this.chunks){
            if(chunk.x == args.x && chunk.y == args.y){
                return chunk;
            }
        }

        return null;
    }
    AddChunk(args){
        let new_chunk = {
            x: args.x,
            y: args.y,
            tiles: []
        };
        for(let oy = 0; oy < this.chunk_height; oy++){
            for(let ox = 0; ox < this.chunk_width; ox++){
                new_chunk.tiles.push(this.fallback.GetTile({
                    x: ox + args.x*this.chunk_width, 
                    y: oy + args.y*this.chunk_height
                }));
            }
        }
        this.chunks.push(new_chunk);
        return new_chunk;
    }
    GetTile(args){
        let chunk_pos = {
            x: Math.floor(1.0 * args.x / this.chunk_width),
            y: Math.floor(1.0 * args.y / this.chunk_height)
        };
        let chunk = this.GetChunk(chunk_pos);
        if(chunk === null) return this.fallback.GetTile(args);

        let local_x = args.x - chunk_pos.x * this.chunk_width;
        let local_y = args.y - chunk_pos.y * this.chunk_height;
        return chunk.tiles[local_x + local_y * this.chunk_width];
    }
    SetTile(args){
        let chunk_pos = {
            x: Math.floor(1.0 * args.x / this.chunk_width),
            y: Math.floor(1.0 * args.y / this.chunk_height)
        };
        let chunk = this.GetChunk(chunk_pos);
        if(chunk === null)
            chunk = this.AddChunk(chunk_pos);

        let local_x = args.x - chunk_pos.x * this.chunk_width;
        let local_y = args.y - chunk_pos.y * this.chunk_height;
        chunk.tiles[local_x + local_y * this.chunk_width] = args.tile;
    }
}

// A texture is just a subsection of an image
class Texture {
	constructor(img, crop_x, crop_y, width, height){
		this.img = img
		this.crop_x = crop_x
		this.crop_y = crop_y
		this.width = width
		this.height = height

		this.screen = null;
	}

	static CreateSolid(color, width, height){
		let canvas = document.createElement('canvas')
		canvas.width = width
		canvas.height = height
		let context = canvas.getContext('2d')
		context.fillStyle = color
		context.fillRect(0, 0, width, height)
		return new Texture(canvas, 0, 0, width, height)
	}

	static LoadFromFile(file){
		return new Promise((resolve, reject) => {
			let image = new Image()
			image.onload  = () => resolve(new Texture(image, 0, 0, image.width, image.height))
			image.onerror = () => reject (new Error("Failed to load texture " + file))
			image.src = file
		})
	}

	static async LoadFromFiles(files){
		let is_array = files.constructor == Array
		
		// Create a promise for each file
		let promises = []
		for(let key in files){
			promises.push(Texture.LoadFromFile(is_array ? files[key] : files[key]))
		}
		
		// Wait for all the textures to be loaded
		let textures_array = await Promise.all(promises)
		
		let textures
		if(!is_array){
			// Put the textures in an object for easier use in the future
			textures = {}
			let index = 0
			for(const file in files){
				textures[file] = textures_array[index]
				index++
			}
		}
		
		return is_array ? textures_array : textures
	}
	GetScreen(){
		if(this.screen == null){
			if(this.crop_x != 0 || this.crop_y != 0 || this.width != this.img.width || this.height != this.img.height){
				this.screen = new PartialScreen(this, this.crop_x, this.crop_y, this.crop_x + this.width, this.crop_y + this.height)
			}else{
				this.screen = new Screen(this)
			}
		}
		return this.screen;
	}
	GetArea (x, y, width, height){
		let section = new Texture(this.img, this.crop_x + x, this.crop_y + y, width, height)
		section.screen = this.GetScreen().GetSection(section.crop_x, section.crop_y, width, height);
		return section;
	}
	GetAreas (locations, width, height){
		let areas = []
		for(let i = 0; i < locations.length - 1; i += 2){
			areas.push(this.GetArea(locations[i], locations[i+1], width, height))
		}
		return areas
	}

	// Properties that you can select:
	// area_size OR grid_size have to be defined, not both
	// max 1 of whitelist, blacklist or filter can be defined

	// area_size; the size of the areas in the grid
	// area_offset; the offset between each area in the grid
	// max_areas; the maximum number of areas picked from the grid
	// area_whitelist; a list of area locations that are selected into the grid
	// area_blacklist; a list of area locations that are exluded from the grid
	// area_filter; a function that takes an area location and returns true of false
	// starting_pos; the position the algorithm starts the grid on(default (0,0))
	// grid_size; The size of the grid(will cast error if too big)
	SplitIntoGrid (properties){
		let areas = []
		let x = 0 
		let y = 0
		let area_width, area_height
		let area_offset_x = 0
		let area_offset_y = 0
		let grid_width, grid_height
		let filter = (x, y) => true

		if("area_offset" in properties){
			area_offset_x = properties.area_offset.x;
			area_offset_y = properties.area_offset.y;
		}
		if("starting_pos" in properties){
			x = properties.starting_pos.x
			y = properties.starting_pos.y
		}

		// Error checking
		if(("area_size" in properties ? 1 : 0) + 
			("grid_size" in properties ? 1 : 0) !== 1){
			console.error("Exactly one of area_size or grid_size has to be defined")
			return
		}
		if(("area_whitelist" in properties ? 1 : 0) +
			("area_blacklist" in properties ? 1 : 0) +
			 ("max_areas" in properties ? 1 : 0) +
			 ("filter" in properties ? 1 : 0) > 1){
			console.error("No more than one of max_areas, area_whitelist, area_blacklist or filter can be defined")
			return
		}
		
		if("area_size" in properties){
			area_width  = properties.area_size.x
			area_height = properties.area_size.y
			let element_width = area_width + area_offset_x
			let element_height = area_height + area_offset_y
			grid_width = Math.floor((this.width - x) / element_width);
			grid_height = Math.floor((this.height - y) / element_height); 
		}else if("grid_size" in properties){
			grid_width  = properties.grid_size.x;
			grid_height = properties.grid_size.y;
			area_width  = (this.width  - x) / grid_width  + area_offset_x;
			area_height = (this.height - y) / grid_height + area_offset_y;
		}
		if("area_whitelist" in properties){
			filter = (x, y) =>  properties.area_whitelist.includes({ x: x, y: y })
		}else if("area_blacklist" in properties){
			filter = (x, y) => !properties.area_blacklist.includes({ x: x, y: y})
		}else if("max_areas" in properties){
			filter = (x, y) => areas.length < properties.max_areas
		}else if("filter" in properties){
			filter = properties.filter
		}

		for(let xi = 0; xi < grid_width; xi++){
			for(let yi = 0; yi < grid_height; yi++){
				if(filter(xi, yi)){
					areas.push(this.GetArea(
						x+xi*(area_width + area_offset_x),
						y+yi*(area_height + area_offset_y),
						area_width, area_height))
				}
			}
		}

		return areas
	}
}

class Screen {
	constructor(target){ 
		this.effects = [];
		this.SetTarget(target);
	}
	
	static FromID(id){
		return new Screen(document.getElementById(id));
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

	GetSection(x, y, width, height){
		return new PartialScreen(this.canvas, x, y, x + width, y + height);
	}

	Clear(args){
		args = this.ApplyEffects(args);

		this.context.fillStyle = args.color;
		this.context.fillRect(this.drawing_offset.x, this.drawing_offset.y, this.width, this.height);
	}

	DrawGraphic(args){
		if(!"graphic" in args) console.error("DrawGraphic requires a 'graphic' argument");
		if(!args.graphic) return this;
		// Find the appropriate function for the task
		switch(args.graphic.constructor.name){
			case "Texture":
				args.texture    = args.graphic;
				return this.DrawTexture(args);
			case "Animation":
				args.animation  = args.graphic;
				return this.DrawAnimation(args);
			case "AnimationController":
				args.controller = args.graphic;
				return this.DrawAnimationController(args);
		}
	}

	DrawTexture(args) {
		args = this.ApplyEffects(args);

		let y = args.x + this.drawing_offset.x;
		let x = args.y + this.drawing_offset.y;

		let width  = "width"  in args ? args.width  : args.texture.width;
		let height = "height" in args ? args.height : args.texture.height;
		
		// Draw the texture
		return this.context.drawImage(args.texture.img, 
									  args.texture.crop_x, args.texture.crop_y, 
									  args.texture.width, args.texture.height,
									  x, y, width, height);
	}

	DrawAnimation(args){
		args = this.ApplyEffects(args);

		x = args.x + this.drawing_offset.x;
		y = args.y + this.drawing_offset.y;
	
		let frame = args.animation.GetCurrentFrame();
		let width  = "width"  in args ? args.width  : frame.width;
		let height = "height" in args ? args.height : frame.height;
		
		// Draw the animation
		return this.context.drawImage(frame.img,
									 frame.crop_x, frame.crop_y, frame.width, frame.height,
									 x, y, width, height);
	}

	DrawAnimationController(args){
		args = this.ApplyEffects(args);

		if(args.controller.current_animation !== null){
			args.animation = args.controller.current_animation;
			return this.DrawAnimation(args);
		}
		return this;
	}

	DrawText(args) {
		args = this.ApplyEffects(args);

		this.context.font      = "font"  in args ? args.font  : "Arial 12px";
		this.context.fillStyle = "color" in args ? args.color : "white";
		this.context.fillText(args.text, args.x + this.drawing_offset.x, args.y + this.drawing_offset.y);
		

		return this;
	}

	DrawRect(args){
		args = this.ApplyEffects(args);

		this.context.fillStyle = ("color" in args) ? args.color : "red";
		this.context.fillRect(args.x + this.drawing_offset.x, args.y + this.drawing_offset.y, args.width, args.height);
	
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

	DrawCircle(args){
		args = this.ApplyEffects(args);

		this.context.fillStyle = "color" in args ? args.color : "red";
		this.context.beginPath();
		this.context.arc(args.x + this.drawing_offset.x, args.y + this.drawing_offset.y, args.radius, 0, Math.PI * 2);
		this.context.fill();

		return this;
	}

	DrawLine(args){
		args = this.ApplyEffects(args);

		// Set up the path
		this.context.beginPath();
		this.context.moveTo(args.x1 + this.drawing_offset.x, args.y1 + this.drawing_offset.y);
		this.context.lineTo(args.x2 + this.drawing_offset.x, args.y2 + this.drawing_offset.y);
		
		// Draw the line
		this.context.strokeStyle = "color" in args ? args.color : "black";
		this.context.stroke();

		return this;
	}

	SetTarget(target){
		// Check the type of the target
		switch(target.constructor.name){
			case "Texture":
				return this.SetTargetTexture(target);
			case "HTMLCanvasElement":
				return this.SetTargetCanvas(target);
		}
	}

	SetTargetTexture(target){
		this.width = target.width;
		this.height = target.height;
		this.drawing_offset = { x: target.crop_x, y: target.crop_y };
		this.canvas = document.createElement('canvas');
		this.canvas.width = target.width;
		this.canvas.height = target.height;
		this.context = this.canvas.getContext("2d");
		this.DrawTexture({ texture: target, x: 0, y: 0 });
		target.img = this.canvas;

		return this;
	}

	SetTargetCanvas(target){
		this.width = target.width;
		this.height = target.height;
		this.drawing_offset = { x: 0, y: 0 };
		this.canvas = target;
		this.context = target.getContext("2d");

		return this;
	}
}

class PartialScreen extends Screen {
	constructor(canvas, left, top, right, bottom) {
		super(canvas);

		this.drawing_offset.x = left;
		this.drawing_offset.y = top;
		this.width = right - left;
		this.height = bottom - top;
	}

	DrawRect(args){
		args = this.ApplyEffects(args);

		let left   = this.ClampX(args.x);
		let right  = this.ClampX(args.x + args.width);
		let top    = this.ClampY(args.y);
		let bottom = this.ClampY(args.y + args.height);

		if(left >= right || top >= bottom) return this;

		let drawingArgs = { x: left, y: top, width: right - left, height: bottom - top };
		if("color" in args) drawingArgs.color = args.color;  
		super.DrawRect(drawingArgs);

		return this;
	}
	DrawAnimation(args){
		args = this.ApplyEffects(args);

		let drawingArgs = {
			x: args.x,
			y: args.y,
			texture: args.animation.GetCurrentFrame()
		};
		if("width"  in args) drawingArgs.width  = args.width;
		if("height" in args) drawingArgs.height = args.height; 
		this.DrawTexture(drawingArgs);

		return this;
	}
	DrawTexture(args){
		args = this.ApplyEffects(args);
		
		let width  = "width"  in args ? args.width  : texture.width;
		let height = "height" in args ? args.height : texture.height;
		
		let left   = this.ClampX(args.x) + this.drawing_offset.x;
		let right  = this.ClampX(args.x + width) + this.drawing_offset.x;
		let top    = this.ClampY(args.y) + this.drawing_offset.y;
		let bottom = this.ClampY(args.y + height) + this.drawing_offset.y;

		if(left >= right || top >= bottom) return this;

		this.context.drawImage(args.texture.img, 
			args.texture.crop_x + (left - args.x - this.drawing_offset.x) * (args.texture.width / width), 
			args.texture.crop_y + (top - args.y - this.drawing_offset.y) * (args.texture.width / width), 
							(right - left) * (args.texture.width / args.width), 
							(bottom - top) * (args.texture.height / args.height),
							left, top, right - left, bottom - top);

		return this;
	}
	ClampX(x){
		return Math.max(Math.min(x, this.width ), 0);
	}
	ClampY(y){
		return Math.max(Math.min(y, this.height), 0);
	}
}

class DrawingSequence {
	constructor(width, height, queue = []){
		this.width = width;
		this.height = height;
		this.queue = queue;
		this.effects = [];
	}
	Clone() {
		return new DrawingSequence(this.width, this.height, this.queue);
	}
	AddEffect(effect){
		this.effects.push(effect);
	}
	ApplyEffects(args){
		let args_copy = Object.assign({}, args);

		for(let effect of this.effects){
			args_copy = effect(args_copy);
		}

		return args_copy;
	}
	_queue_func(name, args){
        args = this.ApplyEffects(args);

		this.queue.push({
			name: name,
			args: args
		});
		return this;
	}
	Clear(args){
		this.queue = [];
		this._queue_func("Clear", args);
		return this;
	}
	DrawTexture             (args){ return this._queue_func("DrawTexture",             args); }
	DrawAnimation           (args){ return this._queue_func("DrawAnimation",           args); }
	DrawAnimationController (args){ return this._queue_func("DrawAnimationController", args); }
	DrawRect                (args){ return this._queue_func("DrawRect",                args); }
	DrawText                (args){ return this._queue_func("DrawText",                args); }
	DrawCircle              (args){ return this._queue_func("DrawCircle",              args); }
	DrawLine                (args){ return this._queue_func("DrawLine",                args); }
	DrawTilemap             (args){ return this._queue_func("DrawTilemap",             args); }
}

function CreateEffect_Random(args){
    return {
        effect: fargs => {
            if("x" in fargs) fargs.x += (Math.random() - 0.5) * args.mag() * 2;
            if("y" in fargs) fargs.y += (Math.random() - 0.5) * args.mag() * 2;
            return fargs;
        }
    };
}

function CreateEffect_Spread(args){
    return {
        effect: fargs => {
            if(!("x" in fargs) || !("y" in fargs)) return fargs;

            let dx = fargs.x - args.x();
            let dy = fargs.y - args.y();
            let mag = dx * dx + dy * dy;
            fargs.x += dx * args.mag(mag);
            fargs.y += dy * args.mag(mag);

            return fargs;
        }
    };
}

function CreateEffect_ScreenShake(){
    let shaking = 0;

    return {
        frame: _ => {
            shaking *= 0.99;
        },
        effect: CreateEffect_Random({ mag: _ => shaking }).effect,
        Shake: intensity => {
            shaking += intensity;
        }
    };
}

function LogOnce(message, msg_id) {
    if(LogOnce.messages.includes(msg_id)) return;
    LogOnce.messages.push(msg_id);
    console.log(message);
}

LogOnce.messages = [];
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

    ApplyEffects(args){
		let args_copy = Object.assign({}, args);

		for(let effect of this.effects){
			args_copy = effect(args_copy);
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
                args = this.ApplyEffects(args);
                args.DrawTile(fargs);
                pos_y -= size;
            }
            pos_x += size;
        }

        return this;
    }
}
class Animation{
	constructor(frames, fps){
		this.frames = frames;
		this.frame_delta_time = 1 / fps;
		this.timer = 0;
		this.current_frame = 0;
	}
	
	static Join(a, b, fps){
		return new Animation(a.frames.concat(b.frames), fps);
	}
}

Animation.prototype.Animate = function(delta_time){
	this.timer += delta_time;
	
	// Figure out how many frames the timer has gone past, and increase the counter
	let frames_to_add = Math.floor(this.timer / this.frame_delta_time);
	let has_looped = (this.current_frame + frames_to_add) >= this.frames.length;
	this.current_frame = (this.current_frame + frames_to_add) % this.frames.length;
	this.timer -= frames_to_add * this.frame_delta_time;
	
	return has_looped;
}

Animation.prototype.GetCurrentFrame = function() {
	return this.frames[this.current_frame];
}

function CreateAnimationFromSlicedTexture(texture, slice_width, slice_height, n_slices_width, n_slices_height, fps){
	let frames = [];
	
	for(let i = 0; i < n_slices_height; i++){
		for(let j = 0; j < n_slices_width; j++){
			frames.push(texture.CreateCroppedTexture(j * slice_width, i * slice_height, slice_width, slice_height));
		}
	}
	
	return new Animation(frames, fps);
}

class AnimationController {
	constructor() {
		this.animation_queue = [];
		this.current_animation = null;
	}
	
	Animate(dt) {
		if(this.current_animation){
			if (this.current_animation.Animate(dt) && 
			    this.animation_queue.length > 0){
				this.current_animation = this.animation_queue[0];
				this.animation_queue.splice(0, 1);
			}
		}
	}
	
	RunAnimation(animation) {
		this.animation_queue = [];
		this.current_animation = animation;
	}
	
	RunAnimations(animations){
		this.animation_queue = [];
		this.QueueAnimations(animations);
	}
	
	QueueAnimation(animation){
		if(this.current_animation === null){
			this.current_animation = animation;
			return;
		}
		
		this.animation_queue.push(animation);
	}
	
	QueueAnimations(animations){
		for(let animation of animations){ 
			this.QueueAnimation(animation);
		}
	}
}

