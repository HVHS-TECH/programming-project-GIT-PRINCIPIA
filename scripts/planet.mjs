//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Planet class                                                          //
//An object to represent a planet, handling rendering and update logic  //
//----------------------------------------------------------------------//
import {Colour, Vec2} from './miscellaneous.mjs';
import { Renderer } from './renderer.mjs';
import { Game } from './game.mjs';
import { Player } from './player.mjs';
import { Time } from './time.mjs';
//----------------------------------------------------------------------//
//Mountain class
//Simple data structure to store mountain data
export class Mountain {
    constructor(rad, height) {
        this.rad = rad;
        this.height = height;
    }
}
//----------------------------------------------------------------------//

//----------------------------------------------------------------------//
//Ocean class
//Simple data structure to store ocean data
export class Ocean {
    constructor(rad, depth) {
        this.rad = rad;
        this.depth = depth;
    }
}
export class Planet {
    
    constructor(name, pos, vel, mass, radius, atmoRadius, colour, innerColour, mantleColour, outerCoreColour, innerCoreColour, atmoColourLow, atmoColourMid, mountainColour, snowColour, mountains, oceanColourShallow, oceanColourDeep, oceans) {
        //Base data
        this.name = name;
        this.pos = pos;
        this.vel = vel;
        this.mass = mass;
        this.radius = radius;
        this.atmoRadius = atmoRadius;

        //Planet colours
        this.colour = colour;
        this.innerColour = innerColour;
        this.mantleColour = mantleColour;
        this.outerCoreColour = outerCoreColour;
        this.innerCoreColour = innerCoreColour;

        //Atmosphere colours
        this.atmoColourLow = atmoColourLow;
        this.atmoColourMid = atmoColourMid;

        //Mountains
        this.mountainColour = mountainColour;
        this.snowColour = snowColour;
        this.mountains = mountains;

        //Oceans
        this.oceanColourShallow = oceanColourShallow;
        this.oceanColourDeep = oceanColourDeep;
        this.oceans = oceans;
    }

    //----------------------------------------------------------------------//
    //Update()
    //Called every frame
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
            var force = Game.G * other.mass / (dist * dist) * Time.scaleDeltaTime;
            this.vel = this.vel.add(deltaNorm.mul(new Vec2(force, force)));

        }
        //Integrate postiion based on velocity and delta time
        this.pos = this.pos.add(this.vel.mul(new Vec2(Time.scaleDeltaTime, Time.scaleDeltaTime)));
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //Draw()
    //Draws the planet and its features (atmosphere etc)
    Draw() {
        //Layered from back to front
        this.DrawAtmosphere();
        this.DrawMountains();
        this.DrawGround();
        this.DrawOceans();
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //DrawGround()
    //Draws the planet surface and interior 
    DrawGround() {
        //Draw planet ground
        var groundGrad = Game.renderer.radGradient(this.pos, this.pos, 0, this.radius, true, true);

        groundGrad.addColorStop(0.2, this.innerCoreColour.txt());
        groundGrad.addColorStop(0.4, this.outerCoreColour.txt());
        groundGrad.addColorStop(0.7, this.mantleColour.txt());
        groundGrad.addColorStop(0.8, this.mantleColour.txt());
        groundGrad.addColorStop(0.98, this.innerColour.txt());
        groundGrad.addColorStop(0.99, this.colour.txt());
        groundGrad.addColorStop(1, this.colour.txt());

        Game.renderer.fill(groundGrad);
        Game.renderer.beginPath();
        Game.renderer.arc(this.pos, this.radius, Math.PI * 2, true, true);
        Game.renderer.fillShape();
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawAtmosphere()
    //Draws the atmosphere of the planet
    DrawAtmosphere() {
        //Draw planet atmosphere
        var atmoGrad = Game.renderer.radGradient(this.pos, this.pos, this.radius, this.atmoRadius, true, true);

        
        atmoGrad.addColorStop(0, this.atmoColourLow.txt());
        atmoGrad.addColorStop(0.3, this.atmoColourMid.txt());
        atmoGrad.addColorStop(0.9, 'transparent');

        Game.renderer.fill(atmoGrad);
        Game.renderer.beginPath();
        Game.renderer.arc(this.pos, this.atmoRadius, Math.PI * 2, true, true);
        Game.renderer.fillShape();
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawMountains()
    //Draws the mountains on the planet
    DrawMountains() {
        var mountainGrad = Game.renderer.radGradient(this.pos, this.pos, this.radius, this.atmoRadius, true, true);
        mountainGrad.addColorStop(0, this.mountainColour.txt());
        mountainGrad.addColorStop(0.28, this.mountainColour.txt());
        mountainGrad.addColorStop(0.3, this.snowColour.txt());
        mountainGrad.addColorStop(1, this.snowColour.txt());
        Game.renderer.fill(mountainGrad);
        Game.renderer.stroke(Colour.rgb(0, 0,0), 3, true, true);
        const CIRCUMFERENCE = 2 * Math.PI * this.radius;
        //Loop through all the mountains and draw them
        for (var m = 0; m < this.mountains.length; m++) {
            const MOUNTAIN = this.mountains[m];

            //                ^
            //               / \
            //              /   \
            //             /     \
            //            /       \
            //           /         \
            //          /           \
            //         /             \
            //      __/__-----------__\__
            // __--- /_________________\ ---__
            //-                               -
            //
            //
            //
            //
            //
            //
            //
            //
            //
            //
            //                {} <- planet center
            const SIDE_LENGTH = 2;
            const SIDE_LENGTH_RAD = SIDE_LENGTH / (CIRCUMFERENCE / this.radius);

            const LEFT = new Vec2(
                Math.sin(MOUNTAIN.rad - SIDE_LENGTH_RAD / 2) * this.radius,
                Math.cos(MOUNTAIN.rad - SIDE_LENGTH_RAD / 2) * this.radius
            );

            const RIGHT = new Vec2(
                Math.sin(MOUNTAIN.rad + SIDE_LENGTH_RAD / 2) * this.radius,
                Math.cos(MOUNTAIN.rad + SIDE_LENGTH_RAD / 2) * this.radius
            );

            const TOP_DIST = MOUNTAIN.height + this.radius;

            const TOP = new Vec2(
                Math.sin(MOUNTAIN.rad) * TOP_DIST, 
                Math.cos(MOUNTAIN.rad) * TOP_DIST
            );
            const VERTICES = [TOP.add(this.pos), RIGHT.add(this.pos), LEFT.add(this.pos)];
            Game.renderer.drawPolygon(VERTICES, true, true);
            Game.renderer.fillShape();
            Game.renderer.strokeShape();
        }
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawOceans()
    //Draws the oceans of the planet
    DrawOceans() {

    }
    //----------------------------------------------------------------------//
}