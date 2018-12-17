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