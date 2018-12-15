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

	ApplyEffects(args){
		let args_copy = Object.assign({}, args);

		for(let effect of this.effects){
			args_copy = effect(args_copy);
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
	}
	Clone() {
		return new DrawingSequence(this.width, this.height, this.queue);
	}
	_queue_func(name, args){
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