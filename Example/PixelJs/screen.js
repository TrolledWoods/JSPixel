// The screen takes a canvas, and stores it in a format that's easy to use for the engine
class Screen {
	constructor(target){ 
		this.SetTarget(target);
	}
	
	static FromID(id){
		return new Screen(document.getElementById(id));
	}

	GetSection(x, y, width, height){
		return new PartialScreen(this.canvas, x, y, x + width, y + height);
	}

	Clear(color){
		this.context.fillStyle = color;
		this.context.fillRect(this.drawing_offset.x, this.drawing_offset.y, this.width, this.height);
	}

	DrawGraphic(graphic, x, y, width, height){
		if(!graphic) return this;
		// Find the appropriate function for the task
		switch(graphic.constructor.name){
			case "Texture":
				return this.DrawTexture(graphic, x, y, width, height);
			case "Animation":
				return this.DrawAnimation(graphic, x, y, width, height);
			case "AnimationController":
				return this.DrawAnimationController(graphic, x, y, width, height);
		}
	}

	DrawTexture(texture, x, y, width, height) {
		x += this.drawing_offset.x;
		y += this.drawing_offset.y;

		// Set default values for with and height if they are not defined
		if(!width) width = texture.width;
		if(!height) height = texture.height;
		
		// Draw the texture
		return this.context.drawImage(texture.img, 
									  texture.crop_x, texture.crop_y, texture.width, texture.height,
									  x, y, width, height);
	}

	DrawAnimation(animation, x, y, width, height){
		x += this.drawing_offset.x;
		y += this.drawing_offset.y;
	
		let frame = animation.GetCurrentFrame();
		
		// Default values for width and height
		if (!width) width = frame.width;
		if (!height) height = frame.height;
		
		// Draw the animation
		return this.context.drawImage(frame.img,
									 frame.crop_x, frame.crop_y, frame.width, frame.height,
									 x, y, width, height);
	}

	DrawAnimationController(controller, x, y, width, height){
		if(controller.current_animation !== null)
			return this.DrawAnimation(controller.current_animation, x, y, width, height);
		return this;
	}

	DrawText(text, x, y, font, color) {
		this.context.font = font;
		this.context.fillStyle = color;
		this.context.fillText(text, x + this.drawing_offset.x, y + this.drawing_offset.y);

		return this;
	}

	DrawRect(x, y, width, height, color){
		this.context.fillStyle = color;
		this.context.fillRect(x + this.drawing_offset.x, y + this.drawing_offset.y, width, height);
	
		return this;
	}

	DrawCircle(x, y, r, color){
		this.context.fillStyle = color;
		this.context.beginPath();
		this.context.arc(x + this.drawing_offset.x, y + this.drawing_offset.y, r, 0, Math.PI * 2);
		this.context.fill();

		return this;
	}

	DrawLine(x1, y1, x2, y2, color){
		// Set up the path
		this.context.beginPath();
		this.context.moveTo(x1 + this.drawing_offset.x, y1 + this.drawing_offset.y);
		this.context.lineTo(x2 + this.drawing_offset.x, y2 + this.drawing_offset.y);
		
		// Draw the line
		this.context.strokeStyle = color;
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
		this.DrawTexture(target, 0, 0);
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

	DrawRect(x, y, width, height, color = "red"){
		let left   = this.ClampX(x);
		let right  = this.ClampX(x + width);
		let top    = this.ClampY(y);
		let bottom = this.ClampY(y + height);

		if(left >= right || top >= bottom) return this;

		super.DrawRect(left, top, right - left, bottom - top, color);

		return this;
	}
	DrawAnimation(animation, x, y, width, height){
		this.DrawTexture(animation.GetCurrentFrame(), x, y, width, height);
		return this;
	}
	DrawTexture(texture, x, y, width, height){
		if(!width) width = texture.width;
		if(!height) height = texture.height;
		
		let left   = this.ClampX(x) + this.drawing_offset.x;
		let right  = this.ClampX(x + width) + this.drawing_offset.x;
		let top    = this.ClampY(y) + this.drawing_offset.y;
		let bottom = this.ClampY(y + height) + this.drawing_offset.y;

		if(left >= right || top >= bottom) return this;

		this.context.drawImage(texture.img, 
							texture.crop_x + (left - x - this.drawing_offset.x) * (texture.width / width), texture.crop_y + (top - y - this.drawing_offset.y) * (texture.width / width), 
							(right - left) * (texture.width / width), (bottom - top) * (texture.height / height),
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
