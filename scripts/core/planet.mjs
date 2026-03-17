//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Planet class                                                          //
//An object to represent a planet, handling rendering and update logic  //
//----------------------------------------------------------------------//
import {Colour, Vec2, DEG2RAD, normalizeAngle} from "../utility/miscellaneous.mjs";
import { Renderer } from './renderer.mjs';
import { Game } from './game.mjs';
import { Player } from './player.mjs';
import { Time } from '../utility/time.mjs';
//----------------------------------------------------------------------//
//Mountain class
//Simple data structure to store mountain data
export class Mountain {
    constructor(rad, width, height) {
        this.rad = rad;
        this.width = width;
        this.height = height;
    }
}
//----------------------------------------------------------------------//

//----------------------------------------------------------------------//
//Ocean class
//Simple data structure to store ocean data
export class Ocean {
    constructor(chunk, depth) {
        this.chunk = chunk;
        this.depth = depth;
    }
}
export class Planet {
    static GROUND_STROKE_WIDTH = 2; //Width of ground outline
    static MOUNTAIN_STROKE_WIDTH = 3; //Width of mountain outline
    constructor(name, pos, vel, mass, radius, atmoRadius, referenceBodyNames, colour, outlineColour, innerColour, mantleColour, outerCoreColour, innerCoreColour, atmoColourLow, atmoColourMid, mountainColour, snowColour, mountainOutlineColour, mountains, oceanColourShallow, oceanColourDeep, oceans) {
        //Base data
        this.name = name;
        this.pos = pos;
        this.vel = vel;
        this.mass = mass;
        this.radius = radius;
        this.atmoRadius = atmoRadius;
        
        //Orbit
        this.referenceBodyNames = referenceBodyNames; //The planets that can apply forces to this

        //Planet colours
        this.colour = colour;
        this.outlineColour = outlineColour;
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
        this.mountainOutlineColour = mountainOutlineColour;
        this.mountains = mountains;

        //Oceans
        this.oceanColourShallow = oceanColourShallow;
        this.oceanColourDeep = oceanColourDeep;
        this.oceans = oceans;


        //Discovered
        this.discovered = false;
    }

    //----------------------------------------------------------------------//
    //Update(dt)
    //Called every frame with (scaled) delta time dt
    Update(dt, planets) {
        for (var i = 0; i < this.referenceBodyNames.length; i++) {
            const NAME = this.referenceBodyNames[i];
            if (NAME == "none") continue; //don't apply gravity from no planet
            var other = null;
            for(var p = 0; p < planets.length; p++) {
                if (planets[p].name == NAME) {
                    other = planets[p];
                    break;
                }
            }
            if (other == null) {
                console.error("Planet.Update() : could not find reference body '" + NAME + "' in list of planets:");
                console.dir(planets); //Log the list of planets
                return;
            }
            const DELTA = other.pos.sub(this.pos);
            const DELTA_NORM = DELTA.norm();
            const DIST_SQUARED = DELTA.sqrMag();

            const ACCEL = Game.G * other.mass / (DIST_SQUARED) * dt * 0.5; //0.5 for verlet integration
            this.vel = this.vel.add(DELTA_NORM.mul(ACCEL));
        }
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //Integrate(dt)
    //integrate the planet's postiion with (scaled) delta time dt
    Integrate(dt) {
        //Integrate postiion based on velocity and delta time
        this.pos = this.pos.add(this.vel.mul(dt));
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
        this.DrawGroundOutline();
        this.DrawOceans();

        this.DrawLocatorOutline();
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawLocatorOutline()
    //draws a circle around the planet showing where it is
    DrawLocatorOutline() {
        Game.renderer.stroke(Colour.rgb(183, 100, 200), 2, false, true);
        Game.renderer.beginPath();
        Game.renderer.arc(this.pos, this.radius * 3, 0, Math.PI * 2, true, true);
        Game.renderer.strokeShape();
    }
    //----------------------------------------------------------------------//


    
    //----------------------------------------------------------------------//
    //DrawGroundOutline()
    //Draws an outline around the planet
    DrawGroundOutline() {
        Game.renderer.stroke(this.outlineColour, Planet.GROUND_STROKE_WIDTH, true, true);
        Game.renderer.beginPath();
        Game.renderer.arc(this.pos, this.radius - Planet.GROUND_STROKE_WIDTH / 2, 0, Math.PI * 2, true, true);
        Game.renderer.strokeShape();
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
        Game.renderer.arc(this.pos, this.radius - Planet.GROUND_STROKE_WIDTH / 2, 0, Math.PI * 2, true, true);
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
        Game.renderer.arc(this.pos, this.atmoRadius, 0, Math.PI * 2, true, true);
        Game.renderer.fillShape();
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawMountains()
    //Draws the mountains on the planet
    DrawMountains() {
        const FUDGE_FACTOR = 5; //Fudge factor to shift the mountain into the ground
        var mountainGrad = Game.renderer.radGradient(this.pos, this.pos, this.radius, this.atmoRadius, true, true);
        mountainGrad.addColorStop(0, this.mountainColour.txt());
        mountainGrad.addColorStop(0.28, this.mountainColour.txt());
        mountainGrad.addColorStop(0.3, this.snowColour.txt());
        mountainGrad.addColorStop(1, this.snowColour.txt());
        Game.renderer.fill(mountainGrad);
        Game.renderer.stroke(this.mountainOutlineColour, Planet.MOUNTAIN_STROKE_WIDTH, true, true);
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
            //
            //
            //
            const SIDE_ANGLE = MOUNTAIN.width / CIRCUMFERENCE * 500 * DEG2RAD; // MOUNTAIN.width / 5 to get units => degrees, then convert to radians
            const SIDE_ANGLE_HALF = SIDE_ANGLE / 2;

            const LEFT = new Vec2(
                Math.sin(MOUNTAIN.rad - SIDE_ANGLE_HALF / 2) * (this.radius - FUDGE_FACTOR),
                Math.cos(MOUNTAIN.rad - SIDE_ANGLE_HALF / 2) * (this.radius - FUDGE_FACTOR)
            );

            const RIGHT = new Vec2(
                Math.sin(MOUNTAIN.rad + SIDE_ANGLE_HALF / 2) * (this.radius - FUDGE_FACTOR),
                Math.cos(MOUNTAIN.rad + SIDE_ANGLE_HALF / 2) * (this.radius - FUDGE_FACTOR)
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
        var oceanGrad = Game.renderer.radGradient(this.pos, this.pos, 0, this.radius, true, true);
        oceanGrad.addColorStop(0, this.oceanColourDeep.txt());
        oceanGrad.addColorStop(0.97, this.oceanColourDeep.txt());
        oceanGrad.addColorStop(0.995, this.oceanColourShallow.txt());
        oceanGrad.addColorStop(1, this.oceanColourShallow.txt());
        
        //Loop through all the mountains and draw them
        for (var o = 0; o < this.oceans.length;o++) {
            const OCEAN = this.oceans[o];
            const CHUNK_WIDTH = 15;
            const LEFT = (OCEAN.chunk * CHUNK_WIDTH - CHUNK_WIDTH / 2) * DEG2RAD;
            const RIGHT = (OCEAN.chunk * CHUNK_WIDTH + CHUNK_WIDTH / 2) * DEG2RAD;
            Game.renderer.stroke(oceanGrad, OCEAN.depth, true, true);
            Game.renderer.beginPath();
            Game.renderer.arc(this.pos, this.radius - OCEAN.depth / 2, LEFT, RIGHT, true, true);
            Game.renderer.strokeShape();
        }
    }
    //----------------------------------------------------------------------//
}