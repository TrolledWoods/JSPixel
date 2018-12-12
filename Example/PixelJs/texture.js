// A texture is just a subsection of an image
class Texture {
	constructor(img, crop_x, crop_y, width, height){
		this.img = img;
		this.crop_x = crop_x;
		this.crop_y = crop_y;
		this.width = width;
		this.height = height;
	}

	static LoadFromFile(file){
		return new Promise((resolve, reject) => {
			let image = new Image();
			image.onload  = () => resolve(new Texture(image, 0, 0, image.width, image.height));
			image.onerror = () => reject (new Error("Failed to load texture " + file));
			image.src = file;
		});
	}

	static async LoadFromFiles(files){
		let is_array = files.constructor == Array;
		
		// Create a promise for each file
		let promises = [];
		for(let key in files){
			promises.push(Texture.LoadFromFile(is_array ? files[key] : files[key]));
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