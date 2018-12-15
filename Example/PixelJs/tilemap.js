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
    static ParseList(list, min_x, min_y, max_x, max_y, map_func){
        let width  = max_x - min_x + 1;
        let height = max_y - min_y + 1;

        let tiles = [];
        for(let i = 0; i < list.length; i++){
            tiles.push(map_func(list[i]));
        }
        return new Tilemap(tiles, min_x, min_y, width, height);
    }
    WorldToTilemap(world_pos){
        return {
            x: (world_pos.x - this.x) / this.tile_scale,
            y: (world_pos.y - this.y) / this.tile_scale
        };
    }
    TilemapToWorld(tilemap_pos){
        return {
            x: tilemap_pos.x * this.tile_scale + this.x,
            y: tilemap_pos.y * this.tile_scale + this.y
        };
    }
    IsInside(x, y){
        return x>=this.x && x<this.x+this.width &&
               y>=this.y && y<this.y+this.height;
    }
    GetIndex(x, y){
        if(!this.IsInside(x, y)) return -1;

        return  (x-this.x) + (y-this.y) * this.height;
    }
    GetTile(x, y){
        let index = this.GetIndex(x, y);
        if(index < 0) return null;

        return this.tiles[index];
    }
    SetTile(x, y, tile){
        let index = this.GetIndex(x, y);
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