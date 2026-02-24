//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Planet class                                                          //
//An object to represent a planet, handling rendering and update logic  //
//----------------------------------------------------------------------//
import {Vec2} from './miscellaneous.mjs';
import { Renderer } from './renderer.mjs';
import { Game } from './game.mjs';
export class Planet {
    
    constructor(name, pos, vel, radius, atmoRadius, colour, innerColour, atmoColourLow, atmoColourMid) {
        this.name = name;
        this.pos = pos;
        this.vel = vel;
        this.radius = radius;
        this.atmoRadius = atmoRadius;
        this.colour = colour;
        this.innerColour = innerColour;
        this.atmoColourLow = atmoColourLow;
        this.atmoColourMid = atmoColourMid;
    }
    Update() {
        //Do orbital physics
    }
    Draw() {
        //Draw planet
        var relPos = this.pos.add(Player.pos);
        
        var atmoGrad = renderer.radGradient(relPos, relPos, this.radius, this.atmoRadius);

        
        atmoGrad.addColorStop(0, this.atmoColourLow);
        atmoGrad.addColorStop(0.3, this.atmoColourMid);
        atmoGrad.addColorStop(0.9, 'transparent');

        renderer.fill(atmoGrad);
        renderer.beginPath();
        renderer.arc(relPos, this.atmoRadius, Math.PI * 2);
        renderer.fillShape();


        var groundGrad = renderer.radGradient(relPos, relPos, 0, this.radius);

        groundGrad.addColorStop(0.75, 'black');
        groundGrad.addColorStop(0.98, this.innerColour);
        groundGrad.addColorStop(0.99, this.colour);
        groundGrad.addColorStop(1, this.colour);

        renderer.fill(groundGrad);
        renderer.beginPath();
        renderer.arc(relPos, this.radius, Math.PI * 2);
        renderer.fillShape();

        
    }
}