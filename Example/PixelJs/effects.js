function CreateEffect_Random(args){
    return {
        effect: fargs => {
            if("x" in fargs) fargs.x += (Math.random() - 0.5) * args.mag() * 2;
            if("y" in fargs) fargs.y += (Math.random() - 0.5) * args.mag() * 2;
            return fargs;
        }
    };
}

function CreateEffect_Spread(args){
    return {
        effect: fargs => {
            if(!("x" in fargs) || !("y" in fargs)) return fargs;

            let dx = fargs.x - args.x();
            let dy = fargs.y - args.y();
            let mag = dx * dx + dy * dy;
            fargs.x += dx * args.mag(mag);
            fargs.y += dy * args.mag(mag);

            return fargs;
        }
    };
}

function CreateEffect_ScreenShake(){
    let shaking = 0;

    return {
        frame: _ => {
            shaking *= 0.99;
        },
        effect: CreateEffect_Random({ mag: _ => shaking }).effect,
        Shake: intensity => {
            shaking += intensity;
        }
    };
}