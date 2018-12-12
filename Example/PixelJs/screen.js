// The screen takes a canvas, and stores it in a format that's easy to use for the engine
class Screen {
	constructor(target){ 
		this.SetTarget(target);
	}
	
	static FromID(id){
		return new Screen(document.getElementById(id));
	}

	Clear(color){
		this.context.fillStyle = color;
		this.context.fillRect(this.drawing_offset.x, this.drawing_offset.y, this.width, this.height);
	}

	DrawGraphic(graphic, x, y, width, height){
		if(!graphic) return;
		// Find the appropriate function for the task
		switch(graphic.constructor.name){
			case "Texture":
				this.DrawTexture(graphic, x, y, width, height);
				break;
			case "Animation":
				this.DrawAnimation(graphic, x, y, width, height)
				break;
			case "AnimationController":
				this.DrawAnimationController(graphic, x, y, width, height);
				break;
		}
	}

	DrawTexture(texture, x, y, width, height) {
		// Set default values for with and height if they are not defined
		if(!width) width = texture.width;
		if(!height) height = texture.height;
		
		// Draw the texture
		this.context.drawImage(texture.img, 
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
		this.context.drawImage(frame.img,
									 frame.crop_x, frame.crop_y, frame.width, frame.height,
									 x, y, width, height);
	}

	DrawAnimationController(controller, x, y, width, height){
		x += this.drawing_offset.x;
		y += this.drawing_offset.y;
	
		if(controller.current_animation !== null)
			this.DrawAnimation(controller.current_animation, x, y, width, height);
	}

	DrawText(text, x, y, font, color) {
		this.context.font = font;
		this.context.fillStyle = color;
		this.context.fillText(text, x + this.drawing_offset.x, y + this.drawing_offset.y);
	}

	DrawRect(x, y, width, height, color){
		this.context.fillStyle = color;
		this.context.fillRect(x + this.drawing_offset.x, y + this.drawing_offset.y, width, height);
	}

	DrawCircle(x, y, r, color){
		this.context.fillStyle = color;
		this.context.beginPath();
		this.context.arc(x + this.drawing_offset.x, y + this.drawing_offset.y, r, 0, Math.PI * 2);
		this.context.fill();
	}

	DrawLine(x1, y1, x2, y2, color){
		// Set up the path
		this.context.beginPath();
		this.context.moveTo(x1 + this.drawing_offset.x, y1 + this.drawing_offset.y);
		this.context.lineTo(x2 + this.drawing_offset.x, y2 + this.drawing_offset.y);
		
		// Draw the line
		this.context.strokeStyle = color;
		this.context.stroke();
	}

	SetTarget(target){
		// Check the type of the target
		switch(target.constructor.name){
			case "Texture":
				this.SetTargetTexture(target);
				break;
			case "HTMLCanvasElement":
				this.SetTargetCanvas(target);
				break;
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
	}

	SetTargetCanvas(target){
		this.width = target.width;
		this.height = target.height;
		this.drawing_offset = { x: 0, y: 0 };
		this.canvas = target;
		this.context = target.getContext("2d");
	}
}