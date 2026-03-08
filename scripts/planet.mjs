//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Planet class                                                          //
//An object to represent a planet, handling rendering and update logic  //
//----------------------------------------------------------------------//
import {Colour, Vec2, DEG2RAD} from './miscellaneous.mjs';
import { Renderer } from './renderer.mjs';
import { Game } from './game.mjs';
import { Player } from './player.mjs';
import { Time } from './time.mjs';
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
    constructor(name, mass, radius, atmoRadius, referenceBody, eccentricity, semiMajorAxis, colour, outlineColour, innerColour, mantleColour, outerCoreColour, innerCoreColour, atmoColourLow, atmoColourMid, mountainColour, snowColour, mountainOutlineColour, mountains, oceanColourShallow, oceanColourDeep, oceans) {
        //Base data
        this.name = name;
        this.mass = mass;
        this.radius = radius;
        this.atmoRadius = atmoRadius;

        //Orbit
        this.referenceBody = referenceBody;
        this.eccentricity = eccentricity;
        this.semiMajorAxis = semiMajorAxis;

        this.orbitalPeriod = 0; //To be calculated later

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
    //calculateOrbitalParameters()
    //initializes the orbit parameters of the planet (this can't be accessed while the planets array is still being created)
    calculateOrbitalParameters() {
        if (this.referenceBody == "") return;
        this.orbitalPeriod = (2.0 * Math.PI) * Math.sqrt(
            Math.pow(this.semiMajorAxis, 3) / 
            (Game.G * Game.getPlanet(this.referenceBody)).mass);
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //Update()
    //Called every frame
    Update() {
        
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //Integrate()
    //integrate the planet's postiion
    Integrate() {
        //Integrate postiion based on velocity and delta time
        //this.pos = this.pos.add(this.vel.mul(new Vec2(Time.scaleDeltaTime, Time.scaleDeltaTime)));
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //getPosition(time)
    //gets the position of the planet at time 'time' in seconds
    getPosition(time) {
        if (this.referenceBody == "") return new Vec2(0,0);
        const MEAN_ANOMALY = (2.0 * Math.PI * (time % this.orbitalPeriod)) / this.orbitalPeriod;
        
        //Iteratively solve keplers equation M = E - e*sin(E) for E
        var E = MEAN_ANOMALY; // Initial guess
        for (var i = 0; i < 10; i++) { // Iterative solution
            E = E - (E - this.eccentricity * Math.sin(E) - MEAN_ANOMALY) / (1 - this.eccentricity * Math.cos(E));
        }

        //Get the distance from the reference body (focus)
        var cosE = Math.cos(E);
        var sinE = Math.sin(E);

        //(relative to focus)
        var x = this.semiMajorAxis * (cosE - this.eccentricity);
        var y = this.semiMajorAxis * Math.sqrt(1 - this.eccentricity * this.eccentricity) * sinE;
        
        //convert to world space
        var ret = new Vec2(x,y).add(Game.getPlanet(this.referenceBody).getPosition(time));

        return ret;
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //getVelocity(time)
    //get the current velocity at time 'time' in seconds
    getVelocity(time) {
        return this.getPosition(time);
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //Draw()
    //Draws the planet and its features (atmosphere etc)
    Draw() {
        var position = this.getPosition(Time.seconds);
        //Layered from back to front
        this.DrawAtmosphere(position);
        
        this.DrawMountains(position);
        this.DrawGround(position);
        this.DrawGroundOutline(position);
        this.DrawOceans(position);
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //DrawGroundOutline(position)
    //Draws an outline around the planet
    DrawGroundOutline(position) {
        Game.renderer.stroke(this.outlineColour, Planet.GROUND_STROKE_WIDTH, true, true);
        Game.renderer.beginPath();
        Game.renderer.arc(position, this.radius - Planet.GROUND_STROKE_WIDTH / 2, 0, Math.PI * 2, true, true);
        Game.renderer.strokeShape();
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawGround(position)
    //Draws the planet surface and interior 
    DrawGround(position) {
        //Draw planet ground
        var groundGrad = Game.renderer.radGradient(position, this.pos, 0, this.radius, true, true);

        groundGrad.addColorStop(0.2, this.innerCoreColour.txt());
        groundGrad.addColorStop(0.4, this.outerCoreColour.txt());
        groundGrad.addColorStop(0.7, this.mantleColour.txt());
        groundGrad.addColorStop(0.8, this.mantleColour.txt());
        groundGrad.addColorStop(0.98, this.innerColour.txt());
        groundGrad.addColorStop(0.99, this.colour.txt());
        groundGrad.addColorStop(1, this.colour.txt());

        Game.renderer.fill(groundGrad);
        
        Game.renderer.beginPath();
        Game.renderer.arc(position, this.radius - Planet.GROUND_STROKE_WIDTH / 2, 0, Math.PI * 2, true, true);
        Game.renderer.fillShape();
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawAtmosphere(position)
    //Draws the atmosphere of the planet
    DrawAtmosphere(position) {
        //Draw planet atmosphere
        var atmoGrad = Game.renderer.radGradient(position, position, this.radius, this.atmoRadius, true, true);

        
        atmoGrad.addColorStop(0, this.atmoColourLow.txt());
        atmoGrad.addColorStop(0.3, this.atmoColourMid.txt());
        atmoGrad.addColorStop(0.9, 'transparent');

        Game.renderer.fill(atmoGrad);
        Game.renderer.beginPath();
        Game.renderer.arc(position, this.atmoRadius, 0, Math.PI * 2, true, true);
        Game.renderer.fillShape();
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawMountains(position)
    //Draws the mountains on the planet
    DrawMountains(position) {
        const FUDGE_FACTOR = 5; //Fudge factor to shift the mountain into the ground
        var mountainGrad = Game.renderer.radGradient(position, position, this.radius, this.atmoRadius, true, true);
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
            const VERTICES = [TOP.add(position), RIGHT.add(position), LEFT.add(position)];
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
        var oceanGrad = Game.renderer.radGradient(position, position, 0, this.radius, true, true);
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
            Game.renderer.arc(position, this.radius - OCEAN.depth / 2, LEFT, RIGHT, true, true);
            Game.renderer.strokeShape();
        }
    }
    //----------------------------------------------------------------------//
}