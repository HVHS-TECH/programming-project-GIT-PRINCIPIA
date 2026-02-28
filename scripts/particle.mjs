//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Particle class                                                        //
//A class to describe a particle, manages movement and rendering        //
//----------------------------------------------------------------------//


import { Vec2 } from "./miscellaneous.mjs"


export class Particle {
    constructor(pos, rot, vel, angVel, width, startColour, midColour, endColour, update, onDeath) {
        this.pos = pos;
        this.rot = rot;
        this.vel = vel;
        this.angVel = angVel;
        this.width = width;
        this.startColour = startColour;
        this.midColour = midColour;
        this.endColour = endColour;
        this.update = update;
        this.onDeath = onDeath;
    }
    Update() {
        this.pos = this.pos.add(this.vel);
        this.rot += this.angVel;
        this.update();
    }
    OnDeath() {
        this.onDeath();

    }
    Draw() {
        
    }
}