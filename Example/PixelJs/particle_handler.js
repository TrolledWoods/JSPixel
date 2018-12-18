class ParticleHandler {
    constructor() {
        /**
         * metadata: metadata for the particle
         * type    : contains all the methods for the particle 
         */
        this.particles = [];
    }
    
    Add(args){
        this.particles.push({
            type: args.type,
            data: args.type.init({ data: args.data })
        });
    }

    Update(args){
        for(let i = this.particles.length - 1; i >= 0; i--){
            let particle = this.particles[i];
            particle.type.update({ data: particle.data });

            if(particle.data.dead){
                this.particles.splice(i, 1);
            }
        }
    }
}