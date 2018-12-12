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