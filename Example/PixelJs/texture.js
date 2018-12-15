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