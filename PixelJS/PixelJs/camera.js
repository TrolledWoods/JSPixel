class Camera {
    constructor(screen, x, y, scale){
        this.screen = screen;
        this.pos = { x: x, y: y };
        this.scale = scale;
    }

    static FromID(id, x, y, scale){
        return new Camera(Screen.FromID(id), x, y, scale);
    }

    WorldToScreen(world_x, world_y){
        return {
            x: (world_x - this.pos.x) * this.scale + this.screen.width/2,
            y: (world_y - this.pos.y) * this.scale + this.screen.height/2
        };
    }

    ScreenToWorld(screen_x, screen_y){
        return {
            x: (screen_x - this.screen.width/2) / this.scale - this.pos.x,
            y: (screen_y - this.screen.height/2) / this.scale - this.pos.y
        };
    }
    Clear(color){
        this.screen.Clear(color);
    }
    DrawRect(x, y, width, height, color){
        let pos = this.WorldToScreen(x, y);
        this.screen.DrawRect(pos.x, pos.y, width*this.scale, height*this.scale, color);
    }
}