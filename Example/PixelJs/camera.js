class Camera {
    constructor(screen, x, y, scale){
        this.screen = screen;
        this.pos = { x: x, y: y };
        this.scale = scale;
    }

    static FromID(id, x, y, scale){
        return new Camera(Screen.FromID(id), x, y, scale);
    }

    static FromScreen(screen, x, y, scale){
        return new Camera(screen, x, y, scale);
    }

    WorldToScreen(world_pos){
        return {
            x: (world_pos.x - this.pos.x) * this.scale + this.screen.width/2,
            y: (world_pos.y - this.pos.y) * this.scale + this.screen.height/2
        };
    }

    ScreenToWorld(screen_pos){
        return {
            x: (screen_pos.x - this.screen.width/2) / this.scale + this.pos.x,
            y: (screen_pos.y - this.screen.height/2) / this.scale + this.pos.y
        };
    }
    Clear(color){
        this.screen.Clear(color);

        return this;
    }
    DrawRect(x, y, width, height, color){
        let pos = this.WorldToScreen({ x: x, y: y});
        width *= this.scale;
        height *= this.scale;
        this.screen.DrawRect(pos.x - width / 2, pos.y - height / 2, width, height, color);

        return this;
    }
    DrawGraphic(graphic, x, y, width, height){
        let pos = this.WorldToScreen({ x: x, y: y });
        width *= this.scale;
        height *= this.scale;
        this.screen.DrawGraphic(graphic, pos.x-width/2, pos.y-height/2, width, height);
    }
    DrawTexture(texture, x, y, width, height){
        let pos = this.WorldToScreen({ x: x, y: y});
        width *= this.scale;
        height *= this.scale;
        this.screen.DrawTexture(texture, pos.x-width/2, pos.y-height/2, width, height);

        return this;
    }
    DrawTilemap(tilemap, draw_tile){
        let ul = tilemap.WorldToTilemap(this.ScreenToWorld({ x: 0, y: 0}));
        let dr = tilemap.WorldToTilemap(this.ScreenToWorld({
            x: this.screen.width, y: this.screen.height }));
        let scale = Math.floor(this.scale * tilemap.tile_scale);

        let origin = this.WorldToScreen(tilemap.TilemapToWorld({ x: Math.floor(ul.x), y: Math.floor(ul.y) }));
        origin.x = Math.floor(origin.x);
        origin.y = Math.floor(origin.y);
        let pos_x = origin.x;
        for(let x = Math.floor(ul.x - 1); x <= Math.ceil(dr.x - 1); x++){
            let pos_y = origin.y;
            for(let y = Math.floor(ul.y - 1); y <= Math.ceil(dr.y - 1); y++){
                draw_tile(
                    this.screen, 
                    tilemap.GetTile(x, y), 
                    { x: x, y: y },
                    { x: pos_x - scale / 2, y: pos_y - scale / 2 },
                    scale
                );
                pos_y += scale;
            }
            pos_x += scale;
        }

        return this;
    }
}