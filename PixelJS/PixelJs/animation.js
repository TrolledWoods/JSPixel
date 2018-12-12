class Animation{
	constructor(frames, fps){
		this.frames = frames;
		this.frame_delta_time = 1000 / fps;
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