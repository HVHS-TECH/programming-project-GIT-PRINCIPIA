//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Particle class                                                        //
//A class to describe a particle, manages movement and rendering        //
//----------------------------------------------------------------------//


import { Vec2 } from "./miscellaneous.mjs"
import { Game } from "./game.mjs";
import { Renderer } from "./renderer.mjs";


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

        this.frame = 0;
    }

    //----------------------------------------------------------------------//
    //Update()
    //Updates the particle position and other variables
    Update() {
        this.pos = this.pos.add(this.vel);
        this.rot += this.angVel;
        this.update();
        this.frame ++;
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //OnDeath()
    //Called when particle is destroyed
    OnDeath() {
        this.onDeath();

    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //Draw()
    //Draws the particle
    Draw() {
        //Draw a square with width this.width at this.pos
        var tl = new Vec2(-1, 1);
        var tr = new Vec2(1, 1);
        var bl = new Vec2(-1, -1);
        var br = new Vec2(1, -1);


        //Rotate
        tl = tl.rotate(this.rot);
        tr = tr.rotate(this.rot);
        bl = bl.rotate(this.rot);
        br = br.rotate(this.rot);


        //Scale
        tl = tl.mul(this.width / 2);
        tr = tr.mul(this.width / 2);
        bl = bl.mul(this.width / 2);
        br = br.mul(this.width / 2);


        //Translate
        tl = tl.add(this.pos);
        tr = tr.add(this.pos);
        bl = bl.add(this.pos);
        br = br.add(this.pos);


        //Draw
        Game.renderer.fill(this.startColour);
        Game.renderer.drawPolygon([tl, tr, br, bl], true, true);
        Game.renderer.fillShape();

        


    }
    //----------------------------------------------------------------------//
}