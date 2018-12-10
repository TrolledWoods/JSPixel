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

class ndTileMap {
	constructor(dimensions, min_point, max_point, tiles) {
		if(typeof dimensions !== "number") throw "Dimensions have to be integers";
		if(dimensions <= 0) throw "Dimensions given to a tilemap have to be larger than 0";
		this.dimensions = dimensions;
		this.tiles = tiles;
		
		if(min_point.length !== this.dimensions || max_point.length !== this.dimensions)
			throw "Vectors given to tilemap do not contain the correct number of elements";
		
		this.min_point = min_point;
		this.max_point = max_point;
		this.scale = min_point.map((_, i) => {
			if(min_point[i] > max_point[i]) 
				throw "Every element in min_point has to be smaller than the corresponding element in max_point!";
			return max_point[i] - min_point[i] + 1;
		});
	}
	
	ThrowIfUnacceptableVector(vec, msg = "The dimensions of a vector does not correspond to the dimensions of the tilemap"){
		if(vec.length !== this.dimensions) throw msg;
	}
	
	GetIndexOf(pos){
		pos = VecSub(pos, this.min_point)
		let index = 0;
		for(let d = this.dimensions - 1; d >= 0; d--){
			index *= this.scale[d];
			index += pos[d];
		}
		return index;
	}
	
	GetPosOf(index){
		// Get the largest coordinate
		let biggest_scaler = 1;
		for(let d = 0; d < this.dimensions - 1; d++) {
			biggest_scaler *= this.scale[d];
		}
		
		let pos = [];
		for(let d = this.dimensions - 1; d >= 0; d--) {
			let coord_val = Math.floor(1.0 * index / biggest_scaler);
			index -= coord_val * biggest_scaler;
			biggest_scaler /= this.scale[d];
			pos.splice(0, 0, coord_val);
		}
		
		return VecAdd(pos, this.min_point);
	}
	
	GetTile(pos){
		this.ThrowIfUnacceptableVector(pos);
		
		for(let i = 0; i < pos.length; i++){
			if(pos[i] < this.min_point[i] || pos[i] >= this.min_point[i] + this.scale[i])
				return null;
		}
		
		return this.tiles[this.GetIndexOf(pos)];
	}
	
	SetTile(pos, tile) {
		this.ThrowIfUnacceptableVector(pos);
		
		this.tiles[this.GetIndexOf(pos)] = tile;
	}
	
	ForEachTile(func, pos = [], dim = 0){
		if(dim >= this.dimensions){
			func(this.GetTile(pos), this.GetGetRelTileFunc(pos), this.GetSetRelTileFunc(pos));
			return;
		}
		
		for(let i = this.min_point[dim]; i <= this.max_point[dim]; i++){
			pos.push(i);
			this.ForEachTile(func, pos, dim + 1);
			pos.pop();
		}
	}
	
	Map(change_tile){
		let new_tiles = [];
		this.ForEachTile((tile, GetRelTile, SetRelTile) => {
			new_tiles.push(change_tile(tile, GetRelTile, SetRelTile));
		});
		this.tiles = new_tiles;
	}
	
	GetGetRelTileFunc(origin){
		return (pos) => this.GetTile(VecAdd(origin, pos));
	}
	
	GetSetRelTileFunc(origin){
		return (pos, tile) => this.SetTile(VecAdd(origin, pos), tile);
	}
}

function VecAdd(a, b){
	return a.map((_, i) => a[i] + b[i]);
}

function VecSub(a, b){
	return a.map((_, i) => a[i] - b[i]);
}

// The screen takes a canvas, and stores it in a format that's easy to use for the engine
class Screen {
	constructor(target){ 
		this.SetTarget(target);
	}
	
	static FromID(id){
		return new Screen(document.getElementById(id));
	}
}

Screen.prototype.Clear = function(color){
	this.context.fillStyle = color;
	this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
}

Screen.prototype.DrawGraphic = function(graphic, x, y, width, height){
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

Screen.prototype.DrawTexture = function(texture, x, y, width, height) {
	// Set default values for with and height if they are not defined
	if(!width) width = texture.width;
	if(!height) height = texture.height;
	
	// Draw the texture
	this.context.drawImage(texture.img, 
								  texture.crop_x, texture.crop_y, texture.width, texture.height,
								  x, y, width, height);
}

Screen.prototype.DrawAnimation = function(animation, x, y, width, height){
	let frame = animation.GetCurrentFrame();
	
	// Default values for width and height
	if (!width) width = frame.width;
	if (!height) height = frame.height;
	
	// Draw the animation
	this.context.drawImage(frame.img,
								 frame.crop_x, frame.crop_y, frame.width, frame.height,
								 x, y, width, height);
}

Screen.prototype.DrawAnimationController = function(controller, x, y, width, height){
	if(controller.current_animation !== null)
		this.DrawAnimation(controller.current_animation, x, y, width, height);
}

Screen.prototype.DrawNDTileMap = function(tile_map, center_pos, tile_width, tile_height, render_func, x, y, width, height) {
	// Figure out what tiles are onscreen
	let topleft     = ScreenToNDTileMap(x      , y       , tile_map, center_pos[0], center_pos[1], 
														tile_width, tile_height, x, y, width, height);
	let bottomright = ScreenToNDTileMap(x+width, y+height, tile_map, center_pos[0], center_pos[1],
														tile_width, tile_height, x, y, width, height);
	
	let top = Math.max(Math.floor(topleft.y), tile_map.top);
	
	// Draw all the tiles
	for(let j = Math.floor(topleft.y); j <= Math.floor(bottomright.y); j++){
		for(let i = Math.floor(topleft.x); i <= Math.floor(bottomright.x); i++){
			let tile = tile_map.GetTile([i, j].concat(center_pos.slice(2)));
			let pos = NDTileMapToScreen(
				i, j, tile_map, center_pos[0], center_pos[1], 
				tile_width, tile_height, x, y, width, height);
			render_func(this, tile, tile_map.GetGetRelTileFunc([i, j].concat(center_pos.slice(2))),
				pos.x, pos.y, tile_width, tile_height);
		}
	}
}

Screen.prototype.DrawTileMap = function(tile_map, center_tile_x, center_tile_y, tile_width, tile_height, render_func, x, y, width, height) {
	// Figure out what tiles are onscreen
	let topleft     = ScreenToTileMap(x      , y       , tile_map, center_tile_x, center_tile_y, 
														tile_width, tile_height, x, y, width, height);
	let bottomright = ScreenToTileMap(x+width, y+height, tile_map, center_tile_x, center_tile_y,
														tile_width, tile_height, x, y, width, height);
	
	let top = Math.max(Math.floor(topleft.y), tile_map.top);
	
	// Draw all the tiles
	for(let j = Math.floor(topleft.y); j <= Math.floor(bottomright.y); j++){
		for(let i = Math.floor(topleft.x); i <= Math.floor(bottomright.x); i++){
			let tile = tile_map.GetTile(i, j);
			let pos = TileMapToScreen(
				i, j, tile_map, center_tile_x, center_tile_y, 
				tile_width, tile_height, x, y, width, height);
			render_func(this, tile, 
				(tile_x, tile_y) => tile_map.GetTile(tile_x + i, tile_y + j),
				pos.x, pos.y, tile_width, tile_height);
		}
	}
}

Screen.prototype.DrawText = function(text, x, y, font, color) {
	this.context.font = font;
	this.context.fillStyle = color;
	this.context.fillText(text, x, y);
}

Screen.prototype.DrawRect = function(x, y, width, height, color){
	this.context.fillStyle = color;
	this.context.fillRect(x, y, width, height);
}

Screen.prototype.DrawCircle = function(x, y, r, color){
	this.context.fillStyle = color;
	this.context.beginPath();
	this.context.arc(x, y, r, 0, Math.PI * 2);
	this.context.fill();
}

Screen.prototype.DrawLine = function(x1, y1, x2, y2, color){
	// Set up the path
	this.context.beginPath();
	this.context.moveTo(x1, y1);
	this.context.lineTo(x2, y2);
	
	// Draw the line
	this.context.strokeStyle = color;
	this.context.stroke();
}

Screen.prototype.SetTarget = function(target){
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

Screen.prototype.SetTargetTexture = function(target){
	this.width = target.width;
	this.height = target.height;
	this.canvas = document.createElement('canvas');
	this.canvas.width = target.width;
	this.canvas.height = target.height;
	this.context = this.canvas.getContext("2d");
	this.DrawTexture(target, 0, 0);
	target.img = this.canvas;
}

Screen.prototype.SetTargetCanvas = function(target){
	this.width = target.width;
	this.height = target.height;
	this.canvas = target;
	this.context = target.getContext("2d");
}

// A texture is just a subsection of an image
class Texture {
	constructor(img, crop_x, crop_y, width, height){
		this.img = img;
		this.crop_x = crop_x;
		this.crop_y = crop_y;
		this.width = width;
		this.height = height;
	}
}

// Asynchronously loads a texture
function LoadTexture(file){
	return new Promise((resolve, reject) => {
		let image = new Image();
		image.onload  = () => resolve(new Texture(image, 0, 0, image.width, image.height));
		image.onerror = () => reject (new Error("Failed to load texture " + file));
		image.src = file;
	});
}

// Files are sorted as [{ name, path }] or in an array
async function LoadTextures(files){
	let is_array = files.constructor == Array;
	
	// Create a promise for each file
	let promises = [];
	for(let key in files){
		promises.push(LoadTexture(is_array ? files[key] : files[key]));
	}
	
	// Wait for all the textures to be loaded
	let textures_array = await Promise.all(promises);
	
	let textures;
	if(!is_array){
		// Put the textures in an object for easier use in the future
		textures = {};
		let index = 0;
		for(const file in files){
			textures[file] = textures_array[index];
			index++;
		}
	}
	
	return is_array ? textures_array : textures;
}

// Get an area of this texture
Texture.prototype.GetArea = function(x, y, width, height){
	return new Texture(this.img, this.crop_x + x, this.crop_y + y, width, height);
}

Texture.prototype.GetAreas = function(locations, width, height){
	let areas = [];
	for(let i = 0; i < locations.length - 1; i += 2){
		areas.push(this.GetArea(locations[i], locations[i+1], width, height));
	}
	return areas;
}

Texture.prototype.SplitIntoGrid = function(off_x, off_y, tile_off_x, tile_off_y, tile_width, tile_height, grid_width, grid_height){
	// How much space is needed to get one tile
	let tile_total_width  = tile_off_x + tile_width;
	let tile_total_height = tile_off_y + tile_height;
	
	// If the grid dimensions are not specified, figure them out
	if(!grid_width)  grid_width  = Math.floor((this.width  - off_x) / tile_total_width );
	if(!grid_height) grid_height = Math.floor((this.height - off_y) / tile_total_height);
	
	// Go through the grid and add all the areas
	let areas = [];
	let y = off_y;
	for(let j = 0; j < grid_height; j++){
		let x = off_x;
		for(let i = 0; i < grid_width; i++){
			areas.push(this.GetArea(x, y, tile_width, tile_height));
			x += tile_total_width;
		}
		y += tile_total_height;
	}
	
	return areas;
}

let WrapModes = { None: 0, Wrap: 1 };
Object.freeze(WrapModes);

class TileMap {
	constructor(tiles, left, top, right, bottom){
		this.tiles = tiles;
		this.left = left;
		this.top = top;
		this.right = right;
		this.bottom = bottom;
		this.width = right - left + 1;
		this.height = bottom - top + 1;
		
		this.wrap_mode = WrapModes.None;
	}
	
	Map(mapping_function){
		let new_tiles = [];
		for(let x = this.left; x <= this.right; x++){
			for(let y = this.top; y <= this.bottom; y++){
				let index = this.PosToIndex(x, y);
				new_tiles[index] = mapping_function(
					this.tiles[index], (t_x, t_y) => this.GetTile(x + t_x, y + t_y)
				);
			}
		}
		this.tiles = new_tiles;
		return new_tiles;
	}
}

function CreateFilledTileMap(create_filled_instance, left, top, right, bottom) {
	let tiles = [];
	let size = (bottom - top + 1) * (right - left + 1);
	
	for(let i = 0; i < size; i++){
		tiles.push(create_filled_instance());
	}
	
	return new TileMap(tiles, left, top, right, bottom);
}

TileMap.prototype.PosToIndex = function(x, y){
	if(x < this.left || x > this.right){
		switch(this.wrap_mode){
			case WrapModes.None:
				return -1;
			case WrapModes.Wrap:
				x -= Math.floor((x - this.left) / this.width) * this.width;
				break;
		}
	}
	
	if(y < this.top || y > this.bottom){
		switch(this.wrap_mode){
			case WrapModes.None:
				return -1;
			case WrapModes.Wrap:
				y -= Math.floor((y - this.top) / this.height) * this.height;
				break;
		}
	}
	
	return (y - this.top) * this.width + (x - this.left);
}

TileMap.prototype.GetTile = function(x, y){
	let index = this.PosToIndex(x, y);
	return index >= 0 ? this.tiles[index] : null;
}

TileMap.prototype.SetTile = function(tile, x, y){
	let index = this.PosToindex(x, y);
	if(index >= 0)
		this.tiles[index] = tile;
}

// func(tile, get_rel, set_rel)
TileMap.prototype.RunFunction = function(func){
	for(let j = this.top; j <= this.bottom; j++){
		for(let i = this.left; i <= this.right; i++){
			func(this.GetTile(i, j), 
				 (x, y)       => {
				return this.GetTile(i + x, j + y);
				},
				 (tile, x, y) => this.SetTile(tile, i + x, j + y));
		}
	}
}

function TileMapToScreen(tile_x, tile_y, tilemap, center_tile_x, center_tile_y, tile_width, tile_height, x, y, width, height){
	// Calculate the position
	return {
		x: x + width  / 2 + (tile_x - center_tile_x + tilemap.left) * tile_width,
		y: y + height / 2 + (tile_y - center_tile_y + tilemap.top ) * tile_height
	};
}

function ScreenToTileMap(screen_x, screen_y, tilemap, center_tile_x, center_tile_y, tile_width, tile_height, x, y, width, height){
	return {
		x: -tilemap.left + center_tile_x + (screen_x - x - width  / 2) / tile_width,
		y: -tilemap.top  + center_tile_y + (screen_y - y - height / 2) / tile_height
	}
}

function NDTileMapToScreen(tile_x, tile_y, tilemap, center_tile_x, center_tile_y, tile_width, tile_height, x, y, width, height){
	// Calculate the position
	return {
		x: x + width  / 2 + (tile_x - center_tile_x) * tile_width,
		y: y + height / 2 + (tile_y - center_tile_y) * tile_height
	};
}

function ScreenToNDTileMap(screen_x, screen_y, tilemap, center_tile_x, center_tile_y, tile_width, tile_height, x, y, width, height){
	return {
		x: center_tile_x + (screen_x - x - width  / 2) / tile_width,
		y: center_tile_y + (screen_y - y - height / 2) / tile_height
	}
}