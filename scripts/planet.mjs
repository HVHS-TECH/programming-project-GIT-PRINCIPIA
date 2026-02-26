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
import { Player } from './player.mjs';
export class Planet {
    
    constructor(name, pos, vel, mass, radius, atmoRadius, colour, innerColour, atmoColourLow, atmoColourMid) {
        this.name = name;
        this.pos = pos;
        this.vel = vel;
        this.mass = mass;
        this.radius = radius;
        this.atmoRadius = atmoRadius;
        this.colour = colour;
        this.innerColour = innerColour;
        this.atmoColourLow = atmoColourLow;
        this.atmoColourMid = atmoColourMid;
        
    }
    Update() {
        //Do orbital physics
        //Loop through all the planets
        for (var p = 0; p < Game.PLANETS.length; p++) {
            //If the planet is this, don't apply a force
            if (Game.PLANETS[p] == this) continue;
            var other = Game.PLANETS[p];
            var delta = other.pos.sub(this.pos);
            var dist = delta.len();
            var deltaNorm = delta.norm();
            var force = Game.G * other.mass / (dist * dist);
            this.vel = this.vel.add(deltaNorm.mul(new Vec2(force, force)));

        }
        //Integrate postiion
        this.pos = this.pos.add(this.vel);
    }
    Draw() {
        //Draw planet
        //var relPos = this.pos.sub(Player.pos);
        var atmoGrad = Game.renderer.radGradient(this.pos, this.pos, this.radius, this.atmoRadius, false);

        
        atmoGrad.addColorStop(0, this.atmoColourLow);
        atmoGrad.addColorStop(0.3, this.atmoColourMid);
        atmoGrad.addColorStop(0.9, 'transparent');

        Game.renderer.fill(atmoGrad);
        Game.renderer.beginPath();
        Game.renderer.arc(this.pos, this.atmoRadius, Math.PI * 2, false);
        Game.renderer.fillShape();


        var groundGrad = Game.renderer.radGradient(this.pos, this.pos, 0, this.radius, false);

        groundGrad.addColorStop(0.75, 'black');
        groundGrad.addColorStop(0.98, this.innerColour);
        groundGrad.addColorStop(0.99, this.colour);
        groundGrad.addColorStop(1, this.colour);

        Game.renderer.fill(groundGrad);
        Game.renderer.beginPath();
        Game.renderer.arc(this.pos, this.radius, Math.PI * 2), false;
        Game.renderer.fillShape();

        
    }
}