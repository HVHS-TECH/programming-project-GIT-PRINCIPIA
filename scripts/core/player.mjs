//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Player class                                                          //
//Manages player movement and logic, as well as player rendering        //
//----------------------------------------------------------------------//
import { Planet } from "./planet.mjs";
import { Game } from "./game.mjs";
import { Input } from "../interface/input.mjs";
import { Vec2, Colour } from "../utility/miscellaneous.mjs";
import { Time } from "../utility/time.mjs";
import { Particle, spawnExplosion } from "../utility/particle.mjs";
import { lerp, clamp } from "../utility/miscellaneous.mjs";

import { State } from "../data/state.mjs";
export class Player {
    static pos = new Vec2(0, 0);
    static vel = new Vec2(0, 0);
    static dir = 0;
    static smoothDir = 0; //Smoothly rotating dir
    static ang_vel = 0;

    static smoothZoom = 0.00001; //Smooth zoom is initialized to be more zoomed out than zoom so that the camera 'zooms in' at the start of the game
    static zoom = 8;

    static MAX_FUEL = 200;
    static fuel = 100;
    static FUEL_USED_PER_FRAME = 0.05;
    static THRUSTER_FORCE = 0.01;
    static HEIGHT = 5;
    static WIDTH = 3;
    static deathCounter = 0; //A counter that starts counting up when the player dies. When it reaches deathCounterThreshold, the user is redirected to 'end.html'
    static exploded = false;
    static DEATH_COUNTER_THRESH = 120; //120 'frames' at 60 'fps'

    //Impacts
    static IMPACT_TOLERANCE = 1.5;
    static IMPACT_FATALITY_SIDEWAYS_COMPONENT = 0.7; //How severe sideways impacts are
    static IMPACT_FATALITY_DIRECTION_COMPONENT = 10; //How severe not being upright on impacts is
    
    //Reentry
    static REENTRY_TOLERANCE = 0.04; //The maximum drag force the player can withstand
    static REENTRY_PARTICLE_THRESH = 0.02;
    
    static IMMUNITY_TIME = 1; //<IMMUNITY_TIME> seconds of immunity

    static smoothScore = 0;
    static score = 0;
    
    //----------------------------------------------------------------------//
    //Update()
    //called every frame
    static Update() {
        if (Player.deathCounter > 0) {
            if (Player.deathCounter > Player.DEATH_COUNTER_THRESH) {
                Game.setPage(Game.END_TITLE); //Go to 'end.html'
                
            }
            Player.deathCounter += Time.scaleDeltaTime / Game.smoothTimeWarp;
            Player.applyGravity();
            Player.pos = Player.pos.add(Player.vel.mul(Time.scaleDeltaTime));
            return;
        }


        //----------------------------------------//
        //Smoothly rotate so that the nearest planet tends toward the bottom of the screen
        var closestPlanet = Game.getClosestPlanet(Player.pos, true);
        var otherPos = Game.PLANETS[closestPlanet].pos;
        var delta = otherPos.sub(Player.pos);
        const DELTA_NORM = delta.norm(); //Normalized vector from player to planet

        //How fast to reach the target value (higher = faster, lower = smoother)
        const DIRECTION_SMOOTHING = 0.01; 
        const SMOOTH_DIR_VEC = new Vec2(Math.sin(Player.smoothDir - Math.PI), Math.cos(Player.smoothDir - Math.PI));
        
        Player.smoothDir = Vec2.slerp(SMOOTH_DIR_VEC, DELTA_NORM, DIRECTION_SMOOTHING).dir() + Math.PI; 
        //----------------------------------------//
        

        //----------------------------------------//
        //Smoothly increase the displayed score to match the real score

        //How fast to reach the target value (higher = faster, lower = smoother)
        const SCORE_SMOOTHING = 0.1;
        Player.smoothScore = lerp(Player.smoothScore, Player.score, SCORE_SMOOTHING);
        //----------------------------------------//


        //----------------------------------------//
        //Smoothly interpolate the player zoom to match the input value

        //How fast to reach the target value (higher = faster, lower = smoother)
        const ZOOM_SMOOTHING = 0.1;

        //-------------//
        //Im not entirely sure how this works, but it's kind of like a damper. 
        //If you change it, have a look at how it affects LONG RANGE zooming - though values above 1 seem to dampen only one direction
        const ZOOOM_POWER = 0.00005; 
        //-------------//

        Player.smoothZoom = Math.pow(lerp(Math.pow(Player.smoothZoom, ZOOOM_POWER), Math.pow(Player.zoom, ZOOOM_POWER), ZOOM_SMOOTHING), 1/ZOOOM_POWER);
        //----------------------------------------//

        //----------------------------------------//
        //speed up time to cross large distances
        if (Input.KeyDown("Space")) {
            Game.timewarp = 5;
        } else {
            Game.timewarp = 1;
        }
        //----------------------------------------//

        Player.Integrate();
        Player.updateThruster();
        Player.applyGravity();
        Player.applyAtmosphericEffects();
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //updateThruster()
    //Manages thruster and fuel
    static updateThruster() {
        if (Player.fuel != 0) {
            var inputForward = (Input.KeyDown("KeyW")) * Player.THRUSTER_FORCE * Time.scaleDeltaTime;



            if (inputForward > 0) {
                //Integrate velocity based on input and delta time
                Player.vel.x += Math.sin(Player.dir) * inputForward;
                Player.vel.y += Math.cos(Player.dir) * inputForward;

                //Reduce fuel based on fuel consumption and delta time
                Player.fuel -= Player.FUEL_USED_PER_FRAME * Time.scaleDeltaTime;

                //----------------------------------------//
                //Thruster particle settings
                const DIR_RANDOMNESS = 0.1;
                const VEL_RANDOMNESS = 0.1;
                const SIZE_RANDOMNESS = 0.5;

                const BASE_DIR = Player.dir + Math.PI;
                const BASE_WIDTH = 0.5;
                const BASE_SPEED = 0.7;
                const FRAME_INTERVAL = 1; //Spawn particles every <FRAME_INTERVAL> frames
                //----------------------------------------//
                if (Time.frame % FRAME_INTERVAL == 0) {
                    
                    
                    
                    const NUM_PARTICLES = 6; //Spawn <NUM_PARTICLES> every <FRAME_INTERVAL> frames
                    for (var i = 0; i < NUM_PARTICLES; i++) {
                        //----------------------------------------//
                        //Flame particle settings
                        //Randomly vary the particle settings
                        const PARTICLE_WIDTH = BASE_WIDTH + (Math.random() * 2 - 1) * SIZE_RANDOMNESS;
                        const PARTICLE_POS = new Vec2(Math.sin(Player.dir + Math.PI) * (Player.HEIGHT / 2 + PARTICLE_WIDTH / 2), Math.cos(Player.dir + Math.PI) * (Player.HEIGHT / 2 + PARTICLE_WIDTH / 2))

                        const PARTICLE_DIR = BASE_DIR + (Math.random() * 2 - 1) * DIR_RANDOMNESS; //Opposite to player direction
                        const SPEED = BASE_SPEED + (Math.random() * 2 - 1) * VEL_RANDOMNESS;

                        var particleVel = Player.vel.add(
                            new Vec2(
                                Math.sin(PARTICLE_DIR) * SPEED, 
                                Math.cos(PARTICLE_DIR) * SPEED
                            )
                        );
                        //----------------------------------------//
                        Game.addParticle(new Particle(Player.pos.add(PARTICLE_POS), Player.dir, 
                        particleVel, 0, 
                        PARTICLE_WIDTH, 
                        Colour.rgba(255, 178, 115, 1), 
                        Colour.rgba(255, 102, 0, 0.2), 
                        Colour.rgba(0, 0, 0, 0), 
                        15,

                            //----------------------------------------//
                            //Update()
                            function(){ //Update
                                //Increase the width of the particle, but slowly decrease it as it ages
                                const CONSTANT_INCREASE = 0.2;
                                const GRADUAL_DECREASE = 0.6;
                                this.width += CONSTANT_INCREASE * Time.scaleDeltaTime - this.frame / this.lifetime * GRADUAL_DECREASE * Time.scaleDeltaTime;
                                
                                for (var p = 0; p < Game.PLANETS.length; p++) {
                                    const OTHER = Game.PLANETS[p];
                                    const DELTA = this.pos.sub(OTHER.pos);
                                    const DIST = DELTA.len() - this.width / 2;
                                    const DELTA_NORM = DELTA.norm();

                                    //If the particle is colliding with the planet, change the particle's velocity and shift it to above the surface to resolve the collision.
                                    if (DIST < OTHER.radius) {
                                        const LEN = this.vel.len();
                                        
                                        //Change the particle's direction to imitate a 'spread outward' effect
                                        const DOT = Vec2.dot(this.vel.sub(OTHER.vel), DELTA_NORM);

                                        const ROTATABLE_VEL = DELTA_NORM.mul(DOT); //Velocity RELATIVE TO PLANET along DELTA_NORM
                                        const DIF = this.vel.sub(ROTATABLE_VEL);//Difference between particle vel and relative particle vel along DELTA_NORM
                                        const ROTATED_VEL = ROTATABLE_VEL.rotate((Math.random() > 0.5) ? 0 : Math.PI); 
                                        this.vel = DIF.add(ROTATED_VEL.mul(2)); //Make the particle spread outward while still moving with the planet's orbital velocity

                                        this.startColour = Colour.rgba(100, 100, 110, 1);
                                        this.midColour = Colour.rgba(150,150,170, 0.3);
                                        this.endColour = Colour.rgba(210, 210, 255, 0);
                                        
                                        this.dir = DELTA.dir(); //Lock the player outward
                                        this.ang_vel = 2;
                                        this.frame = 0;
                                        this.lifetime *= 2;
                                        this.update = function(){

                                            //Get the closest planet
                                            var closestPlanet = Game.getClosestPlanet(this.pos, true);
                                            var other = Game.PLANETS[closestPlanet];
                                            var relVel = this.vel.sub(other.vel);//Relative velocity
                                            var delta = this.pos.sub(other.pos);//Difference in position between player and plaent
                                            
                                            const DELTA_NORM = delta.norm();//Normalized delta

                                            //The increase in width of the particle this frame
                                            const WIDTH_INCREASE = 0.2 * Time.scaleDeltaTime * relVel.len() * (Math.pow(this.frame / this.lifetime, 2) * 5); 
                                            this.width += WIDTH_INCREASE; //Increase width

                                            //Prevent the particle clipping into the planet by shifting it up by half the width increase this frame
                                            this.pos = this.pos.add(DELTA_NORM.mul(WIDTH_INCREASE / 2));
                                        };
                                        break;
                                    }
                                }
                            
                            }, 
                            //----------------------------------------//

                            

                            //----------------------------------------//
                            //OnDeath()
                            function(){}
                            //----------------------------------------//
                        ));
                    }
                    //End of particle constructor
                    //----------------------------------------//
                }
            }
            //----------------------------------------//
            
        }
        //----------------------------------------//
        //Since the above if statement might have reduced the player's fuel below 0, we need to check again
        if (Player.fuel <= 0) {
            Player.fuel = 0;
            State.setState(Game.DEATH_STATE_ID, "ran out of fuel");
            Player.die();
        }
        //----------------------------------------//
        
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //ApplyGravity()
    //Applies gravitational attraction from planets to the player
    static applyGravity() {
        //Apply gravity
        for (var p = 0; p < Game.PLANETS.length; p++) {
            const OTHER = Game.PLANETS[p];
            var delta = OTHER.pos.sub(Player.pos);
            var dist = delta.len() - Player.HEIGHT / 2;
            const DELTA_NORM = delta.norm();

            //If you are colliding with the planet, match its velocity and shift to above the surface to resolve the collision.
            if (dist < OTHER.radius) {
                //----------------------------------------//
                //resolve collision
                while (dist < OTHER.radius) {
                    delta = OTHER.pos.sub(Player.pos);
                    dist = delta.len() - Player.HEIGHT / 2;
                    Player.pos = Player.pos.sub(DELTA_NORM.mul(new Vec2(0.01, 0.01)));
                }
                //----------------------------------------//

                
                //----------------------------------------//
                const REL_VEL = Player.vel.sub(OTHER.vel);

                //Adjust velocity (skid / slide)
                const FRICTION = 0.9; //Closer to one = slicker
                const SKID_VEL = REL_VEL.mul(FRICTION);
                Player.vel = OTHER.vel.add(SKID_VEL);

                

                //only explode if the player hasn't already exploded
                if (Player.isImpactFatal(REL_VEL, DELTA_NORM) && !Player.exploded) {
                    State.setState(Game.DEATH_STATE_ID, "crashed");
                    Player.explode();
                    return;
                }
                //----------------------------------------//
                Player.discoverPlanet(p);//Must be called after checking for crash, because otherwise you could crash into a planet and still discover it.

                
                
                //Lock the player outward
                Player.dir = delta.dir(); 
                Player.ang_vel = 0;
                break;
            }
            //Update the player's velocity
            const FORCE = Game.G * OTHER.mass / (dist * dist) * Time.scaleDeltaTime;
            Player.vel = Player.vel.add(DELTA_NORM.mul(FORCE));
        }
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //isImpactFatal(relative velocity, deltaNorm)
    //returns true or false depending on how severe the impact was
    //true = die
    //false = live
    static isImpactFatal(relVel, deltaNorm) {
        const VEL_NORM = relVel.norm();
        const VEL_NORM_DOT_DELTA_NORM = Vec2.dot(VEL_NORM, deltaNorm);
        const DIR_DOT_DELTA_NORM = Vec2.dot(new Vec2(Math.sin(Player.dir), Math.cos(Player.dir)), deltaNorm);
        const IMPACT_SEVERITY = 
        Math.max(2 - VEL_NORM_DOT_DELTA_NORM, 0) * Player.IMPACT_FATALITY_SIDEWAYS_COMPONENT //Punish the player for landing while moving sideways
            + Math.max(DIR_DOT_DELTA_NORM, 0) * Player.IMPACT_FATALITY_DIRECTION_COMPONENT; //Punish the player for not landing upright
        return (relVel.len() > (Player.IMPACT_TOLERANCE - IMPACT_SEVERITY));
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //getDrag()
    //returns the drag force experienced by the player at velocity 'vel' and
    //position 'pos'
    static getDrag(pos, vel, planets = Game.PLANETS) {
        //----------------------------------------//
        //is the player in an atmosphere?
        const OTHER = planets[Game.getClosestPlanet(pos, true, planets)];
        const DELTA = OTHER.pos.sub(pos);
        const DIST = DELTA.len();
        const ATMO_RAD = OTHER.atmoRadius;
        if (DIST > ATMO_RAD) {
            //We are not in an atmosphere - exiting function!
            return new Vec2(0,0);
        }
        //----------------------------------------//

        //----------------------------------------//
        //We ARE in an atmosphere
        const REL_VEL = vel.sub(OTHER.vel);
        const REL_VEL_NORM = REL_VEL.norm();

        const SQR_VEL_MAG = REL_VEL.sqrMag();

        //----------------------------------------//
        //getAirDensity()
        //returns the air density from 0 - 1 at a given distance
        //must be multiplied by the real density at sea level
        function getAirDensity(radius, atmoRad, dist, power) {
            const X1 = radius;
            const X2 = atmoRad;

            const Y1 = 1; //Full air density at radius
            const Y2 = 0; //No air at atmorad

            const M = (Y2 - Y1) / (X2 - X1);
            return Math.pow(M * (dist - X1) + Y1, power);
        }
        //----------------------------------------//


        const DENSITY_POWER = 5;
        const SEA_LEVEL_DENSITY = 0.2;
        const AIR_DENSITY = SEA_LEVEL_DENSITY * getAirDensity(OTHER.radius, ATMO_RAD, DIST, DENSITY_POWER);


        const DRAG_COEFFICIENT = 0.5;
        
        const DRAG_FORCE = REL_VEL_NORM.mul(-1 * 0.5 * DRAG_COEFFICIENT * SQR_VEL_MAG * AIR_DENSITY);

        return DRAG_FORCE;
        //----------------------------------------//
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //GetReentrySeverity()
    //pos: the position of the assessment of severity
    //vel: the velocity of the assessment of severity
    //returns: a number based on how severe the reentry is at pos and vel
    static getReentrySeverity(pos, vel, planets = Game.PLANETS) {
        const DRAG = Player.getDrag(pos, vel, planets);
        const DRAG_MAGNITUDE = DRAG.len();
        return DRAG_MAGNITUDE;
    }
    //----------------------------------------------------------------------//

    
    //----------------------------------------------------------------------//
    //applyAtmosphericEffects()
    //Returns velocity 'vel' with aerodynamic forces applied
    static applyAtmosphericEffects() {
        //Drag
        const DRAG = Player.getDrag(Player.pos, Player.vel);
        Player.vel = Player.vel.add(DRAG); //Drag is already negative, so we add it to velocity

        //Reentry
        const REENTRY_SEVERITY = Player.getReentrySeverity(Player.pos, Player.vel);
        Player.spawnReentryParticles(REENTRY_SEVERITY);
        if (REENTRY_SEVERITY > Player.REENTRY_TOLERANCE) {
            State.setState(Game.DEATH_STATE_ID, "burnt up during reentry");
            Player.explode();
            return;
        }
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //spawnReentryParticles()
    //severity: the severity of the current reentry state
    static spawnReentryParticles(severity) {
        const INTERVAL = 0.9;
        if (severity > Player.REENTRY_PARTICLE_THRESH && Time.seconds % 1 < INTERVAL) {
            //Reentry is severe enough to spawn particles
            const CLOSEST_IDX = Game.getClosestPlanet(Player.pos, true);
            const OTHER_VEL = Game.PLANETS[CLOSEST_IDX].vel;
            Game.addParticle(
                new Particle(Player.pos, Player.dir, OTHER_VEL, 0, 3, Colour.rgba(250, 150, 50, 0.8), Colour.rgba(150,120,0, 0.5), Colour.rgba(100, 20, 0, 0), 10, function(){}, function(){})
            );
        }
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //Integrate()
    //Integrates the players position and rotation
    static Integrate() {
        //Integrate position based on velocity and delta time
        Player.pos = Player.pos.add(Player.vel.mul(Time.scaleDeltaTime));

        //Integrate rotation based on angular velocity and delta time
        Player.dir += Player.ang_vel * Time.scaleDeltaTime / Game.smoothTimeWarp;

        //Integrate zoom based on input and delta time
        const ZOOM_SPEED = 0.05 / Game.smoothTimeWarp;
        Player.zoom *= ((Input.KeyDown("ArrowUp") * ZOOM_SPEED * Time.scaleDeltaTime + 1) / (Input.KeyDown("ArrowDown") * ZOOM_SPEED * Time.scaleDeltaTime + 1));
        Player.zoom = clamp(Player.zoom, 0.015, 50); //Restrict player zoom
        var rotate = (Input.KeyDown("KeyD") - Input.KeyDown("KeyA")) * 0.005;

        Player.ang_vel += rotate / (Player.ang_vel + 1) * Time.scaleDeltaTime;
        Player.ang_vel *= 0.95;
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //Draw()
    //Calls DrawPlayer() with default values
    static Draw() {
        this.drawTrajectory();
        this.drawPlayer(new Vec2(0, 0), 1, true, true, false);
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //drawPlayer(offset, scale, playerRelative, doScreenScale, useSmoothDirDiff)
    //Draws the player based on an offset, scale, and whether it is relative to the player position and or scales with screen size
    //useSmoothDirDiff: if true, replace Player.dir with Player.dir - Player.smoothDir
    static drawPlayer(offset, scale, playerRelative, doScreenScale, useSmoothDirDiff) {
        if (this.exploded) return; //Don't render the player if they exploded!
        if (playerRelative) offset = offset.add(Player.pos);

        const DIR = (useSmoothDirDiff) ? Player.dir - Player.smoothDir : Player.dir;
        const heightOffset = new Vec2(Math.sin(DIR) * Player.HEIGHT * scale, Math.cos(DIR) * Player.HEIGHT * scale);
        const widthOffset = new Vec2(Math.sin(DIR + Math.PI / 2) * Player.WIDTH * scale, Math.cos(DIR + Math.PI / 2) * Player.WIDTH * scale);

        //Draw the player, centered
        var deltaFront = heightOffset.mul(new Vec2(0.5, 0.5));
        var deltaRight = heightOffset.mul(new Vec2(-0.5, -0.5)).add(widthOffset.mul(new Vec2(0.5, 0.5)));
        var deltaLeft = heightOffset.mul(new Vec2(-0.5, -0.5)).add(widthOffset.mul(new Vec2(-0.5, -0.5)));
        var vertices = [offset.add(deltaFront), offset.add(deltaRight), offset.add(deltaLeft)];

        Game.renderer.fill('white');
        Game.renderer.stroke('black', 0.5 * scale, playerRelative, doScreenScale);
        Game.renderer.drawPolygon(vertices, playerRelative, doScreenScale);
        Game.renderer.fillShape();
        Game.renderer.strokeShape();
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //drawTrajectory()
    //draws the trajectory of the player
    static drawTrajectory() {
        const DEPTH = 10000;
        const DT = 1; //1 / <DT> times as accurate e.g a value of 1 is 'perfectly' accurate (no guarantees!)
        var startSunIdx;
        for (var p = 0; p < Game.PLANETS.length; p++) {
            if (Game.PLANETS[p].name == "sun") {
                startSunIdx = p; 
                break;
            }
        }
        const START_SUN_POS = Game.PLANETS[startSunIdx].pos;

        //----------------------------------------//
        //Simulation state variables
        var pos = Player.pos;
        var posDraw = pos;
        var vel = Player.vel;

        var lastPos = pos;
        var lastPosDraw = lastPos;

        //Make sure to not just assign a reference to Game.PLANETS - make an actual copy
        var fake_planets = [];
        var prevPlanetPositions = [];
        for (var i = 0; i < Game.PLANETS.length; i++) {
            const REAL_PLANET = Game.PLANETS[i];
            fake_planets.push(new Planet(REAL_PLANET.name, REAL_PLANET.pos, REAL_PLANET.vel, REAL_PLANET.mass, REAL_PLANET.radius, REAL_PLANET.atmoRadius, REAL_PLANET.colour, REAL_PLANET.outlineColour, REAL_PLANET.innerColour, REAL_PLANET.mantleColour, REAL_PLANET.outerCoreColour, REAL_PLANET.innerColourColour, REAL_PLANET.atmoColourLow, REAL_PLANET.atmoColourMid, REAL_PLANET.mountainColour, REAL_PLANET.snowColour, REAL_PLANET.mountainOutlineColour, REAL_PLANET.mountains, REAL_PLANET.oceanColourShallow, REAL_PLANET.oceanColourDeep, REAL_PLANET.oceans));
            prevPlanetPositions[i] = fake_planets[i].pos;
        }

        
        //----------------------------------------//
        const LINE_COLOUR = Colour.rgb(255, 17, 17);
        
        Game.renderer.beginPath();
        Game.renderer.stroke(LINE_COLOUR, 2, false, true);
        var drawIterations = 0; //Counts up every time i % <FREQUENCY> == 0
        for (var i = 0; i < DEPTH; i++) {
            //----------------------------------------//
            //verlet integration
            for (var p = 0; p < fake_planets.length; p++) {
                fake_planets[p].Update(DT, fake_planets);
            }
            for (var p = 0; p < fake_planets.length; p++) {
                fake_planets[p].Integrate(DT, fake_planets);
            }
            for (var p = 0; p < fake_planets.length; p++) {
                fake_planets[p].Update(DT, fake_planets);
            }
            //----------------------------------------//

            //----------------------------------------//
            //apply gravity to fake player
            for (var p = 0; p < fake_planets.length; p++) {
                const DELTA = fake_planets[p].pos.sub(pos);
                const DELTA_NORM = DELTA.norm();
                const DIST_SQUARED = DELTA.sqrMag();
                const ACCEL = Game.G * fake_planets[p].mass / (DIST_SQUARED) * DT;
                vel = vel.add(DELTA_NORM.mul(ACCEL));
                if (DIST_SQUARED < fake_planets[p].radius * fake_planets[p].radius) {
                    
                    Game.renderer.strokeShape(); //finish drawing the trajectory

                    const MIN_DIST_FOR_IMPACT_MARKER = 50;
                    if (Vec2.dist(Player.pos, pos) < MIN_DIST_FOR_IMPACT_MARKER) return; //Only draw an impact marker 'far' away from the player


                    //Draw a huge outline around the impact circle (for when the player is zoomed out)
                    const THIS_ITERATION_CLOSEST_PLANET = Game.getClosestPlanet(pos, true, fake_planets);
                    const THIS_ITERATION_CLOSEST_PLANET_POS = fake_planets[THIS_ITERATION_CLOSEST_PLANET].pos;
                    
                    Game.renderer.stroke(Colour.rgba(255, 200, 20, 0.8), 10, true, true);
                    Game.renderer.beginPath();
                    Game.renderer.arc(pos.sub(THIS_ITERATION_CLOSEST_PLANET_POS).add(Game.PLANETS[THIS_ITERATION_CLOSEST_PLANET].pos), 300, 0, Math.PI * 2, true, true);
                    Game.renderer.strokeShape();
                    


                    //Draw an impact circle
                    const SAFE_IMPACT_COLOUR = Colour.rgba(100, 220, 50, 0.5); //Green if safe
                    const FATAL_IMPACT_COLOUR = Colour.rgba(255, 55, 20, 0.9); //Red if fatal
                    const STROKE_COLOUR = (Player.isImpactFatal(vel.sub(fake_planets[p].vel), DELTA_NORM)) ? FATAL_IMPACT_COLOUR : SAFE_IMPACT_COLOUR;
                    Game.renderer.stroke(STROKE_COLOUR, 5, true, true);
                    Game.renderer.beginPath();
                    Game.renderer.arc(pos.sub(THIS_ITERATION_CLOSEST_PLANET_POS).add(Game.PLANETS[THIS_ITERATION_CLOSEST_PLANET].pos), 10, 0, Math.PI * 2, true, true);
                    Game.renderer.strokeShape();

                        
                    return;
                }
            }
            //----------------------------------------//

            pos = pos.add(vel.mul(DT));
            vel = vel.add(Player.getDrag(pos, vel, fake_planets));
            
            //----------------------------------------//
            //Only draw lines every so many iterations
            const FREQUENCY = 1;
            if (i % FREQUENCY == 0) {
                drawIterations ++;
                const FAKE_CLOSEST_PLANET_POS = fake_planets[startSunIdx].pos;
                posDraw = pos.sub(FAKE_CLOSEST_PLANET_POS);
                //----------------------------------------//
                //Draw intercept lines
                const THIS_ITERATION_CLOSEST_PLANET = Game.getClosestPlanet(pos, true, fake_planets);
                const THIS_ITERATION_CLOSEST_PLANET_POS = fake_planets[THIS_ITERATION_CLOSEST_PLANET].pos;
                const LAST_ITERATION_CLOSEST_PLANET_POS = prevPlanetPositions[THIS_ITERATION_CLOSEST_PLANET];
                const DELTA = THIS_ITERATION_CLOSEST_PLANET_POS.sub(pos);
                const DIST = DELTA.len();
                const THRESH_MUL_RAD = 5;


                if (DIST < fake_planets[THIS_ITERATION_CLOSEST_PLANET].radius * THRESH_MUL_RAD
                    && THIS_ITERATION_CLOSEST_PLANET != startSunIdx) 
                {
                    
                    //Draw an intercept line
                    Game.renderer.line(
                        pos.sub(THIS_ITERATION_CLOSEST_PLANET_POS).add(Game.PLANETS[THIS_ITERATION_CLOSEST_PLANET].pos), 

                        lastPos.sub(LAST_ITERATION_CLOSEST_PLANET_POS).add(Game.PLANETS[THIS_ITERATION_CLOSEST_PLANET].pos), 
                        true, true
                    );
                }
                else {
                    //----------------------------------------//
                    //draw a line from the previous position to this iteration's position
                    
                    Game.renderer.line(
                        posDraw.add(START_SUN_POS), 

                        lastPosDraw.add(START_SUN_POS), 
                        true, true
                    );
                    //----------------------------------------//
                }
                //----------------------------------------//
                
                

                //Update last pos
                lastPos = pos;
                lastPosDraw = posDraw;

                //Update planet last positions
                for (var p = 0; p < fake_planets.length; p++) {
                    prevPlanetPositions[p] = fake_planets[p].pos;
                }
            }
            //----------------------------------------//
        }
        Game.renderer.strokeShape();
        
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //discoverPlanet(planetIdx)
    //Mark the planet at 'Game.PLANETS[planetIdx]' as discovered
    //Increment player score
    static discoverPlanet(planetIdx) {
        if (Game.PLANETS[planetIdx].discovered) return; //Can't discover a planet twice
        Game.PLANETS[planetIdx].discovered = true; //mark as discovered
        const VALUE = (1000 / Game.PLANETS[planetIdx].radius);
        Player.score += VALUE * 1000;
        Player.fuel = clamp(Player.fuel + VALUE * 20, 0, Player.MAX_FUEL);
    }
    //----------------------------------------------------------------------//



    //----------------------------------------------------------------------//
    //die()
    //kill the player!
    static die() {
        Player.deathCounter = 1;
        State.setState(Game.SCORE_STATE_ID, Player.score);
        Player.smoothScore = Player.score; //Don't confuse the player by showing the wrong score!
        
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //explode()
    //spawns two rings of explosion particles, deletes the player image
    static explode() {
        //Don't explode when the game is still starting
        if (Time.seconds < Player.IMMUNITY_TIME) return;

        Player.exploded = true;
        const NUM_PARTICLES = 80;
        const SPEED = 5;
        const INNER_SPEED = 1;
        const RANDOMNESS = 0.5;
        spawnExplosion(Player.pos, Player.vel, INNER_SPEED, SPEED, NUM_PARTICLES, RANDOMNESS, Colour.rgba(250,150,100,1), Colour.rgba(255, 72, 0, 0.5), Colour.rgba(151, 151, 151, 0))
        
        Player.die();//Die!!!
    }
    //----------------------------------------------------------------------//
}
