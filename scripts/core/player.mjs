//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Player class                                                          //
//Manages player movement and logic, as well as player rendering        //
//----------------------------------------------------------------------//
"use strict";
import { Planet, PlanetAtmosphere, PlanetData, PlanetOceans, PlanetSurface } from "./planet.mjs";
import { Game } from "./game.mjs";
import { Input } from "../interface/input.mjs";
import { Vec2, Colour } from "../utility/miscellaneous.mjs";
import { Time } from "../utility/time.mjs";
import { Particle, spawnExplosion } from "../utility/particle.mjs";
import { lerp, clamp, normalizeAngle } from "../utility/miscellaneous.mjs";

import { State } from "../data/state.mjs";
import { Difficulty } from "../data/difficulty.mjs";
class LineSegment {
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
}
class Trajectory {
    constructor(colour, thickness) {
        this.segments = [];
        this.colour = colour;
        this.thickness = thickness;
    }
    addSegment(segment) {
        this.segments.push(segment);
    }
    Draw() {
        Game.renderer.stroke(this.colour, this.thickness, false, true);
        Game.renderer.beginPath();
        for (var i = 0; i < this.segments.length; i++) {
            const SEGMENT = this.segments[i];
            Game.renderer.line(SEGMENT.start, SEGMENT.end, true, true);
        }
        Game.renderer.strokeShape();
    }
}
export class Player {
    static pos = new Vec2(0, 0);
    static vel = new Vec2(0, 0);
    static dir = 0;
    static smoothDir = 0; //Smoothly rotating dir
    static ang_vel = 0;

    static smoothZoom = 0.00001; //Smooth zoom is initialized to be more zoomed out than zoom so that the camera 'zooms in' at the start of the game
    static zoom = 8;

    static fuel = 100;
    
    static HEIGHT = 5;
    static WIDTH = 3;
    static deathCounter = 0; //A counter that starts counting up when the player dies. When it reaches deathCounterThreshold, the user is redirected to 'end.html'
    static exploded = false;
    static mightExplodeOnReentry = false; //If drawTrajectory realises that the player will explode on reentry, slow down time
    static DEATH_COUNTER_THRESH = 180; //<DEATH_COUNTER_THRESH> 'frames' at 60 'fps'

    
    
    //Reentry
    static REENTRY_PARTICLE_THRESH = 0.0008; //The drag force needed for the player to spawn reentry particles
    
    static IMMUNITY_TIME = 1; //<IMMUNITY_TIME> seconds of immunity

    static smoothScore = 0;
    static score = 0;
    
    //----------------------------------------------------------------------//
    //Initialize()
    //Initialize player state
    static Initialize() {
        Player.deathCounter = 0;
        Player.exploded = false;
        Player.fuel = 100;
        Player.score = 0; //Don't reset smoothScore - the score resetting back to 0 looks cool
        Player.zoom = 8;
        Player.ang_vel = 0;
        Player.dir = 0;
        Player.smoothDir = 0;
        Player.smoothZoom = 0.00001;
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //Update()
    //called every frame
    static Update(dt) {
        Player.manageInterpolatedValues(dt);

        //----------------------------------------//
        //restart the game if the player presses 'r'
        if (Input.KeyDown("KeyR")) {
            Game.Restart();
        }
        //----------------------------------------//

        //Cancel all further functions if player is dying / dead
        if (Player.deathCounter > 0) {
            if (Player.fuel > 0 && !Player.exploded) {
                Player.deathCounter = 0;
            } else {
                Player.deathCounter += Time.scaleDeltaTime / Game.smoothTimeWarp;
            }
            if (Player.deathCounter > Player.DEATH_COUNTER_THRESH) {
                Game.setPage(Game.END_TITLE); //Go to 'end.html'
                
            }
            //Don't use dt for death counter, instead use the raw time.scaleDeltaTime
            //dt scales with timewarp - but dying faster when timewarping reduces the player's awareness of dying
            
            Player.applyGravity(dt);
            Player.pos = Player.pos.add(Player.vel.mul(dt));
            return;
        }

        //----------------------------------------//
        //speed up time to cross large distances
        if (Player.mightExplodeOnReentry) {
            Game.timewarp = 0.3; //Slow down time to let the player see themselves explode!
        }
        else if (Input.KeyDown("Space")) {
            Game.timewarp = 5;
        } else {
            Game.timewarp = 1;
        }
        
        //----------------------------------------//

        

        Player.Integrate(dt);
        Player.updateThruster(dt);
        Player.applyGravity(dt);
        Player.applyAtmosphericEffects(dt);
    }
    //----------------------------------------------------------------------//

    //----------------------------------------//
    //manageInterpolatedValues()
    //interpolates things like smooth zoom, smooth score, etc
    static manageInterpolatedValues(dt) {
        //----------------------------------------//
        //Smoothly rotate so that the nearest planet tends toward the bottom of the screen
        var closestPlanet = Game.getClosestPlanet(Player.pos, true);
        var otherPos = Game.PLANETS[closestPlanet].data.pos;
        var delta = otherPos.sub(Player.pos);
        const DELTA_NORM = delta.norm(); //Normalized vector from player to planet

        //How fast to reach the target value (higher = faster, lower = smoother)
        const DIRECTION_SMOOTHING = 0.01; 
        const SMOOTH_DIR_VEC = new Vec2(Math.sin(Player.smoothDir - Math.PI), Math.cos(Player.smoothDir - Math.PI));
        
        Player.smoothDir = Vec2.slerp(SMOOTH_DIR_VEC, DELTA_NORM, DIRECTION_SMOOTHING * dt).dir() + Math.PI; 
        //----------------------------------------//
        

        //----------------------------------------//
        //Smoothly increase the displayed score to match the real score

        //How fast to reach the target value (higher = faster, lower = smoother)
        const SCORE_SMOOTHING = 0.1;
        Player.smoothScore = lerp(Player.smoothScore, Player.score, SCORE_SMOOTHING * dt);
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

        Player.smoothZoom = Math.pow(lerp(Math.pow(Player.smoothZoom, ZOOOM_POWER), Math.pow(Player.zoom, ZOOOM_POWER), ZOOM_SMOOTHING * dt), 1/ZOOOM_POWER);
        //----------------------------------------//
    }
    //----------------------------------------------------------------------//
    

    //----------------------------------------------------------------------//
    //updateThruster()
    //Manages thruster and fuel
    //Spawns thruster particles
    static updateThruster(dt) {
        if (Player.fuel != 0) {
            var inputForward = (Input.KeyDown("KeyW")) * Difficulty.Player.THRUSTER_FORCE * dt;



            if (inputForward > 0) {
                //Integrate velocity based on input and delta time
                Player.vel.x += Math.sin(Player.dir) * inputForward;
                Player.vel.y += Math.cos(Player.dir) * inputForward;

                //Reduce fuel based on fuel consumption and delta time
                Player.fuel -= Difficulty.Player.FUEL_USED_PER_FRAME * dt;

                Player.spawnThrusterParticles();
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
    //spawnRCSparticles(dir)
    //dir: boolean value, true => right, false => left
    //RCS stands for reaction control system - it is the 'propulsion' system used to rotate many rockets in space
    //I'm using it here because it looks cool
    static spawnRCSparticles(dir, strength) {
        const FRONT_DIR = new Vec2(Math.sin(Player.dir), Math.cos(Player.dir));
        const RIGHT_DIR = new Vec2(Math.sin(Player.dir + Math.PI / 2), Math.cos(Player.dir + Math.PI / 2));

        //What fraction of height up the player's length is the port (thruster)?
        const PORT_HEIGHT_FRAC = 0.9;

        //Position of the thruster port
        const PORT_POS = Player.pos.add(
            FRONT_DIR.mul(Player.HEIGHT / 2 * PORT_HEIGHT_FRAC).add(
                //Left or right
                (dir) ? 
                //Left (rotating right)
                    RIGHT_DIR.mul(-1 * (1 - PORT_HEIGHT_FRAC) * Player.WIDTH / 2)
                :
                //Right (rotating left)
                    RIGHT_DIR.mul((1 - PORT_HEIGHT_FRAC) * Player.WIDTH / 2)

            )
        );
        const NUM_PARTICLES = 20 * Time.scaleDeltaTime; //How many particles to spawn
        for (var i = 0; i < NUM_PARTICLES; i++) {
            const PARTICLE_VEL_DIR = Player.dir + ((dir) ? -Math.PI / 2 : Math.PI / 2);
            const VEL_RANDOMNESS = (Math.random() * 2 - 1) * 0.2 / strength;
            const PARTICLE_SPEED = 1 * strength + VEL_RANDOMNESS;
            const DIR_RANDOMNESS = ((Math.random() * 2 - 1) * 0.2) / strength;
            const PARTICLE_VEL = new Vec2(Math.sin(PARTICLE_VEL_DIR + DIR_RANDOMNESS) * PARTICLE_SPEED, Math.cos(PARTICLE_VEL_DIR + DIR_RANDOMNESS) * PARTICLE_SPEED);

            Game.addParticle(
                new Particle(
                    PORT_POS,
                    Player.dir,
                    PARTICLE_VEL.add(Player.vel),
                    0,
                    0.35,
                    Colour.rgba(200, 200, 200, 1 * strength),
                    Colour.rgba(200, 200, 200, 0.1 * strength),
                    Colour.rgba(200, 200, 200, 0),
                    3, 
                    function(){
                        this.width *= 1 - 0.2 * Time.scaleDeltaTime;
                    },
                    function(){}
                )
            );
        }
        
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //spawnThrusterParticles()
    static spawnThrusterParticles() {
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
        //We can change how often the particles spawn
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
                    function(dt){ //Update
                        //Increase the width of the particle, but slowly decrease it as it ages
                        const CONSTANT_INCREASE = 0.2;
                        const GRADUAL_DECREASE = 0.6;
                        this.width += CONSTANT_INCREASE * dt - this.frame / this.lifetime * GRADUAL_DECREASE * dt;
                        
                        var p = Game.getClosestPlanet(this.pos, true);
                        const OTHER = Game.PLANETS[p];
                        const DELTA = this.pos.sub(OTHER.data.pos);
                        const DIST = DELTA.len() - this.width / 2;
                        const DELTA_NORM = DELTA.norm();

                        //If the particle is colliding with the planet, change the particle's velocity and shift it to above the surface to resolve the collision.
                        if (DIST < OTHER.data.radius) {
                            
                            //Change the particle's direction to imitate a 'spread outward' effect
                            const DOT = Vec2.dot(this.vel.sub(OTHER.data.vel), DELTA_NORM);

                            const ROTATABLE_VEL = DELTA_NORM.mul(DOT); //Velocity RELATIVE TO PLANET along DELTA_NORM
                            const DIF = this.vel.sub(ROTATABLE_VEL);//Difference between particle vel and relative particle vel along DELTA_NORM
                            const ROTATED_VEL = ROTATABLE_VEL.rotate((Math.random() > 0.5) ? 0 : Math.PI); 
                            this.vel = DIF.add(ROTATED_VEL.mul(2)); //Make the particle spread outward while still moving with the planet's orbital velocity

                            var colour = Colour.rgb(164, 164, 164);
                            var landColour = Colour.rgb(0,0,0);
                            //Use mantle colour for consistensy (e.g avoid earth's grass 'land.colour', or mars's dark 'land.innerColour')
                            if (OTHER.land != null) landColour = Colour.rgba(OTHER.land.mantleColour.r, OTHER.land.mantleColour.g, OTHER.land.mantleColour.b, 0);
                            this.startColour = Colour.lerp(colour, landColour, 0);
                            this.startColour.a = 0.8;
                            this.midColour = Colour.lerp(colour, landColour, 0.3);
                            this.midColour.a = 0.3;
                            this.endColour = Colour.lerp(colour, landColour, 0.7);
                            this.endColour.a = 0;
                            
                            this.dir = DELTA.dir(); //Lock the player outward
                            this.angVel = (Math.random() * 2 - 1) * 0.1;
                            this.frame = 0;
                            this.lifetime *= 2;
                            this.update = function(dt){

                                //Get the closest planet
                                var closestPlanet = Game.getClosestPlanet(this.pos, true);
                                var other = Game.PLANETS[closestPlanet];
                                var relVel = this.vel.sub(other.data.vel);//Relative velocity
                                var delta = this.pos.sub(other.data.pos);//Difference in position between player and plaent
                                
                                const DELTA_NORM = delta.norm();//Normalized delta

                                //The increase in width of the particle this frame
                                const WIDTH_INCREASE = 0.2 * dt * relVel.len() * (Math.pow(this.frame / this.lifetime, 2) * 5); 
                                this.width += WIDTH_INCREASE; //Increase width

                                //Prevent the particle clipping into the planet by shifting it up by half the width increase this frame
                                this.pos = this.pos.add(DELTA_NORM.mul(WIDTH_INCREASE / 2));
                            };
                            
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
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //applyGravity()
    //Applies gravitational attraction from planets to the player
    static applyGravity(dt) {
        //Loop through all the planets, calculate the attraction and apply it
        for (var p = 0; p < Game.PLANETS.length; p++) {
            const OTHER = Game.PLANETS[p];
            
            var delta = OTHER.data.pos.sub(Player.pos);
            var dist = delta.len() - Player.HEIGHT / 2;
            const DELTA_NORM = delta.norm();
            const GRAVITY = Game.G * OTHER.data.mass / (dist * dist) * dt;
            
            Player.collideWithPlanet(p, OTHER, DELTA_NORM, GRAVITY, dt);
            
            
            //Update the player's velocity
            //Gravity is defined above the if statement so as to be visible to both this line
            //and the tipping / stabilizing logic above.
            Player.vel = Player.vel.add(DELTA_NORM.mul(GRAVITY));
        }
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //collideWithPlanet(OTHER, DELTA_NORM)
    //OTHER: the planet you collided with
    //DELTA_NORM: the normalized delta position between planet and player
    static collideWithPlanet(idx, OTHER, DELTA_NORM, GRAVITY, dt) {
        if (OTHER.land == null) return; //Planet has no surface to collide with
        
        //If you are colliding with the planet, match its velocity and shift to above the surface to resolve the collision.
        if (Player.isIntersecting(Player.pos, OTHER.data.pos, OTHER.data.radius)) {
            //----------------------------------------//
            //resolve collision
            while (Player.isIntersecting(Player.pos, OTHER.data.pos, OTHER.data.radius)) {
                
                Player.pos = Player.pos.sub(DELTA_NORM.mul(new Vec2(0.01, 0.01)));
            }
            //Update variables as they are used later
            var delta;
            var dist;
            delta = OTHER.data.pos.sub(Player.pos);
            dist = delta.len();
            //----------------------------------------//

            
            //----------------------------------------//
            const REL_VEL = Player.vel.sub(OTHER.data.vel);

            //Adjust velocity (skid / slide)
            const FRICTION = 0.9; //Closer to one = slicker
            const SKID_VEL = REL_VEL.mul(FRICTION);
            Player.vel = OTHER.data.vel.add(SKID_VEL);

            

            //only explode if the player hasn't already exploded
            //don't explode if not moving
            const MIN_VEL = 0.05;
            if (Player.isImpactFatal(REL_VEL, DELTA_NORM) && !Player.exploded && REL_VEL.len() > MIN_VEL) {
                State.setState(Game.DEATH_STATE_ID, "crashed");
                Player.explode();
                return;
            }
            //----------------------------------------//

            //Only discover a planet if you can do so
            if (!Player.exploded) Player.discoverPlanet(idx);

            
            
            const DIR_DIFF = normalizeAngle(Player.dir) - normalizeAngle(delta.dir());
            
            
            const MIN_VEL_FOR_SHEAR_TILT = 0.05;
            if (REL_VEL.len() > MIN_VEL_FOR_SHEAR_TILT) {
                //Player is sliding sideways, tip over

                //Parallel to planet surface
                const SIDE_AXIS = Vec2.rotatePoint(DELTA_NORM, Math.PI / 2);

                const VEL_DOT_AXIS = Vec2.dot(REL_VEL, SIDE_AXIS);

                //The proportion of REL_VEL along SIDE_AXIS
                const PROJECTION_ALONG_SIDE_AXIS = SIDE_AXIS.mul(VEL_DOT_AXIS);


                const SHEAR_TORQUE = PROJECTION_ALONG_SIDE_AXIS.len() * Math.sign(VEL_DOT_AXIS) * 1;
                Player.ang_vel = SHEAR_TORQUE * dt;
            }

            const TIP_THRESH = 0.55;
            
            if (Math.abs(DIR_DIFF) > TIP_THRESH) {
                //Player is unbalanced, tip over
                //The force will increase due to leverage
                //Power of 3 is just an arbritrary value that looks good
                Player.ang_vel += ((DIR_DIFF * 2) ** 3) * GRAVITY * dt * 4;
            } else {
                //Stabilize the player
                const LOSS = 0.005; //e.g damping, losses in collision / bounce
                Player.ang_vel *= 1 - LOSS ** (1 / dt);
                Player.ang_vel -= ((DIR_DIFF) * GRAVITY) * dt * 4;
            }
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
        //Punish the player for not landing upright
        Math.max(DIR_DOT_DELTA_NORM, 0) * Difficulty.Player.IMPACT_FATALITY_DIRECTION_COMPONENT; 
        
        return (relVel.len() > (Difficulty.Player.IMPACT_TOLERANCE - IMPACT_SEVERITY));
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //isIntersecting(pos, point, radius)
    //pos: player pos
    //point: is this point intersecting the player
    //radius: the distance to point 'point' required for an intersection - could be planet radius or just padding
    static isIntersecting(pos, point, radius) {
        const HEIGHT_OFFSET = new Vec2(Math.sin(Player.dir) * Player.HEIGHT, Math.cos(Player.dir) * Player.HEIGHT);
        const WIDTH_OFFSET = new Vec2(Math.sin(Player.dir + Math.PI / 2) * Player.WIDTH, Math.cos(Player.dir + Math.PI / 2) * Player.WIDTH);

        //The local space positions of the player's vertices
        const DELTA_FRONT = HEIGHT_OFFSET.mul(new Vec2(0.5, 0.5));
        const DELTA_RIGHT = HEIGHT_OFFSET.mul(new Vec2(-0.5, -0.5)).add(WIDTH_OFFSET.mul(new Vec2(0.5, 0.5)));
        const DELTA_LEFT = HEIGHT_OFFSET.mul(new Vec2(-0.5, -0.5)).add(WIDTH_OFFSET.mul(new Vec2(-0.5, -0.5)));

        //The world space positions of the player's vertices
        const FRONT = DELTA_FRONT.add(pos);
        const RIGHT = DELTA_RIGHT.add(pos);
        const LEFT = DELTA_LEFT.add(pos);

        const FRONT_DIST = Vec2.dist(FRONT, point);
        const FRONT_INTERSECTING = FRONT_DIST < radius;
        if (FRONT_INTERSECTING) return true;

        const RIGHT_DIST = Vec2.dist(RIGHT, point);
        const RIGHT_INTERSECTING = RIGHT_DIST < radius;
        if (RIGHT_INTERSECTING) return true;

        const LEFT_DIST = Vec2.dist(LEFT, point);
        const LEFT_INTERSECTING = LEFT_DIST < radius;
        if (LEFT_INTERSECTING) return true;

        return false; //No intersection
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //getHeat()
    //basically just proportional to drag
    static getHeat(pos, vel, planets = Game.PLANETS) {
        //From 0 - Player.REENTRY_TOLERANCE
        const DRAG = Player.getReentrySeverity(pos, vel, planets);
        const SCALE_DRAG = DRAG / Difficulty.Player.REENTRY_TOLERANCE;

        return SCALE_DRAG;
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
        if (OTHER.atmosphere == null) return new Vec2(0,0); //Closest planet has no atmosphere anyway
        
        
        const DELTA = OTHER.data.pos.sub(pos);
        const DIST = DELTA.len();

        const ATMO_RAD = OTHER.atmosphere.radius;
        if (DIST > ATMO_RAD) {
            //We are not in an atmosphere - exit function!
            return new Vec2(0,0);
        }
        //----------------------------------------//

        //----------------------------------------//
        //We ARE in an atmosphere
        const REL_VEL = vel.sub(OTHER.data.vel);
        const REL_VEL_NORM = REL_VEL.norm();

        const SQR_VEL_MAG = REL_VEL.sqrMag();

        //----------------------------------------//
        //getAirDensity()
        //returns the air density from 0 - 1 at a given distance
        //must be multiplied by the real density at sea level
        function getAirDensity(radius, atmoRad, dist, power) {
            const X1 = radius;
            const X2 = atmoRad;

            const Y1 = 1; //Full air density at radius (sea level)
            const Y2 = 0; //No air at atmoRad (space)

            const M = (Y2 - Y1) / (X2 - X1);
            return Math.pow(M * (dist - X1) + Y1, power);
        }
        //----------------------------------------//


        const DENSITY_POWER = 5;
        const SEA_LEVEL_DENSITY = OTHER.atmosphere.seaLvlDensity;
        const AIR_DENSITY = SEA_LEVEL_DENSITY * getAirDensity(OTHER.atmosphere.seaLvlRadius, ATMO_RAD, DIST, DENSITY_POWER);

        //Player direction expressed as a vector
        const DIR_VEC_NORM = new Vec2(Math.sin(Player.dir), Math.cos(Player.dir));

        //REL_VEL_NORM dot DIR_VEC_NORM
        //1 = facing forward (less drag)
        //-1 = facing backward (more drag)
        const RV_N_DOT_DV_N = Vec2.dot(REL_VEL_NORM, DIR_VEC_NORM);

        //The effect of the player direction on the drag
        const MOST_DRAG = 0.2;
        const DIRECTIONAL_DRAG = MOST_DRAG * (1 - (RV_N_DOT_DV_N + 1) / 2);

        const BASE_DRAG = 0.05;

        //Forward drag + drag based on direction
        const DRAG_COEFFICIENT = BASE_DRAG + DIRECTIONAL_DRAG;
        
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
    static applyAtmosphericEffects(dt) {
        //Drag
        const DRAG = Player.getDrag(Player.pos, Player.vel);
        Player.vel = Player.vel.add(DRAG.mul(dt)); //Drag is already negative, so we add it to velocity

        //Reentry
        const REENTRY_SEVERITY = Player.getReentrySeverity(Player.pos, Player.vel);
        Player.spawnReentryParticles(REENTRY_SEVERITY);
        if (Player.getHeat(Player.pos, Player.vel) >= 1) {
            State.setState(Game.DEATH_STATE_ID, "burnt up during reentry");
            Player.explode();
            return;
        }
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //spawnReentryParticles()
    //severity: the severity of the current reentry state
    //relVel: the relative velocity of the player to the closest planet
    static spawnReentryParticles(severity) {
        const INTERVAL = 1; //0 for not at all, 1 for all the time
        if (severity > Player.REENTRY_PARTICLE_THRESH && Time.seconds % 1 < INTERVAL) {
            //from 0 - 1, will 'usually' only reach ~0.3 - ~0.7
            const SEVERITY_NORM = severity / Difficulty.Player.REENTRY_TOLERANCE;
            
            const SEVERITY_BLEND = clamp(1 - 4 * SEVERITY_NORM, 0, 1); //0 when high severity, 1 when low severity
            //Reentry is severe enough to spawn particles
            const CLOSEST_IDX = Game.getClosestPlanet(Player.pos, true);
            const OTHER_VEL = Game.PLANETS[CLOSEST_IDX].data.vel;

            
            //The width gets larger the more severe the reentry is
            const STARTING_WIDTH = clamp(10 * SEVERITY_NORM, 0, 4);
            const VEL_RANDOMNESS = 0.15 * (1 - SEVERITY_BLEND);
            const VEL = OTHER_VEL.add(
                new Vec2(
                    (Math.random() * 2 - 1) * VEL_RANDOMNESS, 
                    (Math.random() * 2 - 1) * VEL_RANDOMNESS
                )
            );
            const OTHER_COLOUR = Colour.clone(Game.PLANETS[CLOSEST_IDX].atmosphere.atmoColourLow);
            OTHER_COLOUR.a *= SEVERITY_NORM;
            const BLACK = Colour.rgba(0, 0, 0, 0);
            const OTHER_COLOUR_DARKENED = Colour.lerp(OTHER_COLOUR, BLACK, 0.66);
            OTHER_COLOUR_DARKENED.a *= SEVERITY_NORM;
            
            
            Game.addParticle(
                new Particle(Player.pos, Player.dir, VEL, 0, STARTING_WIDTH, 
                    Colour.lerp(Colour.rgba(250, 150, 50, 0.8), OTHER_COLOUR, SEVERITY_BLEND), 
                    Colour.lerp(Colour.rgba(150,120,0, 0.5), OTHER_COLOUR_DARKENED, SEVERITY_BLEND), 
                    Colour.lerp(Colour.rgba(100, 20, 0, 0), BLACK, SEVERITY_BLEND), 
                    40, 
                    function(){
                        //Make the particle dwindle in size over time
                        this.width *= 0.95 / Time.scaleDeltaTime;
                        this.width = clamp(this.width, 0, STARTING_WIDTH);
                    }, 
                    function(){}
                )
            );
        }
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //Integrate()
    //Integrates the players position and rotation
    static Integrate(dt) {
        //Integrate position based on velocity and delta time
        Player.pos = Player.pos.add(Player.vel.mul(dt));

        //Integrate rotation based on angular velocity and delta time
        Player.dir += Player.ang_vel * Time.scaleDeltaTime / Game.smoothTimeWarp;

        //Integrate zoom based on input and delta time
        const ZOOM_SPEED = 0.05 / Game.smoothTimeWarp;
        Player.zoom *= ((Input.KeyDown("ArrowUp") * ZOOM_SPEED * dt + 1) / (Input.KeyDown("ArrowDown") * ZOOM_SPEED * dt + 1));
        Player.zoom = clamp(Player.zoom, 0.015, 50); //Restrict player zoom
        var rotate = (Input.KeyDown("KeyD") - Input.KeyDown("KeyA")) * 0.005;

        //Spawn rotation thruster particles 
        if (rotate != 0) Player.spawnRCSparticles(rotate > 0, 1);
        
        Player.ang_vel += rotate * Time.scaleDeltaTime;
        const ANGULAR_FRICTION = 0.1;
        const SLOWDOWN = Math.exp(-1 * ANGULAR_FRICTION / (Math.abs(rotate) * 100 + 1) * Time.scaleDeltaTime);
        const MIN_ANG_VEL = 0.01;
        if (rotate == 0 && Math.abs(this.ang_vel) > MIN_ANG_VEL) {
            Player.spawnRCSparticles(this.ang_vel < 0, 0.5);
        }
        Player.ang_vel *= SLOWDOWN;


    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //Draw()
    //Calls DrawPlayer() with default values
    static Draw() {
        Player.drawTrajectory();
        Player.drawPlayer(new Vec2(0, 0), 1, true, true, false);
        Player.drawOutline();
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //drawOutline()
    //draws an outline around the player if the camera is too zoomed out to see it
    static drawOutline() {
        const ZOOM_THRESH = 2; 
        //Don't draw the outline if the user can see the player icon
        if (Player.zoom > ZOOM_THRESH) return;

        //Fade in and out
        const ALPHA_MUL = ZOOM_THRESH / Player.zoom - 1;

        //----------------------------------------//
        //Outline
        const OUTLINE_COLOUR = Colour.rgba(50, 60, 150, ALPHA_MUL);
        const OUTLINE_WIDTH = 5;
        const OUTLINE_RADIUS = 30;
        Game.renderer.stroke(OUTLINE_COLOUR, OUTLINE_WIDTH, false, true);
        Game.renderer.beginPath();
        Game.renderer.arc(Player.pos, OUTLINE_RADIUS / Player.smoothZoom, 0, Math.PI * 2, true, true);
        Game.renderer.strokeShape();
        //----------------------------------------//


        //----------------------------------------//
        //Player velocity
        const CLOSEST_IDX = Game.getClosestPlanet(Player.pos, true);
        const REL_VEL = Player.vel.sub(Game.PLANETS[CLOSEST_IDX].data.vel);
        const VEL_MARKER_COLOUR = Colour.rgba(30, 255, 0, 0.8 * ALPHA_MUL);
        const VEL_MARKER_WIDTH = 0.5;
        Game.renderer.stroke(VEL_MARKER_COLOUR, OUTLINE_WIDTH, false, true);
        Game.renderer.beginPath();
        Game.renderer.arc(Player.pos, OUTLINE_RADIUS / Player.smoothZoom, REL_VEL.dir() + Math.PI / 2 - VEL_MARKER_WIDTH / 2, REL_VEL.dir() + Math.PI / 2 + VEL_MARKER_WIDTH / 2, true, true);
        Game.renderer.strokeShape();
        //----------------------------------------//


        //----------------------------------------//
        //Player drag
        const DRAG = Player.getDrag(Player.pos, Player.vel);
        const HEAT = Player.getHeat(Player.pos, Player.vel);
        const DRAG_MARKER_COLOUR = Colour.rgba(255, 166, 0, HEAT / Difficulty.Player.REENTRY_TOLERANCE * ALPHA_MUL);
        const DRAG_MARKER_WIDTH = 1;
        Game.renderer.stroke(DRAG_MARKER_COLOUR, OUTLINE_WIDTH, false, true);
        Game.renderer.beginPath();
        Game.renderer.arc(Player.pos, OUTLINE_RADIUS / Player.smoothZoom, DRAG.dir() + Math.PI / 2 - DRAG_MARKER_WIDTH / 2, DRAG.dir() + Math.PI / 2 + DRAG_MARKER_WIDTH / 2, true, true);
        Game.renderer.strokeShape();
        //----------------------------------------//


        //----------------------------------------//
        //Player direction
        const DIR_MARKER_COLOUR = Colour.rgba(255, 247, 231, 1 * ALPHA_MUL);
        const DIR_MARKER_WIDTH = 0.3;
        Game.renderer.stroke(DIR_MARKER_COLOUR, OUTLINE_WIDTH, false, true);
        Game.renderer.beginPath();
        Game.renderer.arc(Player.pos, OUTLINE_RADIUS / Player.smoothZoom, Player.dir - Math.PI / 2 - DIR_MARKER_WIDTH / 2, Player.dir - Math.PI / 2 + DIR_MARKER_WIDTH / 2, true, true);
        Game.renderer.strokeShape();
        //----------------------------------------//
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

        //Depth decreases as the player zooms in.
        const MAX_DEPTH = 5000;
        const DEPTH = MAX_DEPTH / clamp(Player.smoothZoom * 5, 1, 10);
        
        const DT = 1; //1 / <DT> times as accurate e.g a value of 1 is 'perfectly' accurate (aside from floating point error)
        
        const INTERCEPT_CIRCLE_RADIUS = 50;
        const INTERCEPT_CIRCLE_THICKNESS = 6;
        
        var startSunIdx = 0;
        for (var p = 0; p < Game.PLANETS.length; p++) {
            if (Game.PLANETS[p].data.name == "sun") {
                startSunIdx = p; 
                break;
            }
        }
        const START_PLANET_POSITIONS = Game.PLANETS.map(p => p.data.pos);
        var dynamicPlanetPositions = Game.PLANETS.map(p => p.data.pos);
        var dynamicPlanetVelocities = Game.PLANETS.map(p => p.data.vel);
        const PLANET_MASSES = Int32Array.from(Game.PLANETS.map(p => p.data.mass));
        const PLANET_RADII = Int32Array.from(Game.PLANETS.map(p => p.data.radius));

        const PLAYER_POS = Player.pos;
        const PLAYER_VEL = Player.vel;
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
        //A list for all planets, containing a boolean as to whether the last iteration was an 
        //intercept with that planet
        var prevInInterceptWithPlanet = []; 
        var currInInterceptWithPlanet = [];
        var currDrewIntercept = false;
        var prevDrewIntercept = false;
        
        //----------------------------------------//
        //Since changing stroke colour for each individual line segment is costly, we batch them
        //for later rendering to save performance
        //A list of all trajectories relative to planets
        var planetTrajectories = [];
        //----------------------------------------//


        //----------------------------------------//
        //helper function to draw an impact circle
        function drawImpactCircle(pos, fatal) {
            Game.renderer.stroke(Colour.rgba(255, 200, 20, 0.8), 10, true, true);
            Game.renderer.beginPath();
            Game.renderer.arc(pos, 300, 0, Math.PI * 2, true, true);
            Game.renderer.strokeShape();
            


            //Draw an impact circle
            const SAFE_IMPACT_COLOUR = Colour.rgba(100, 220, 50, 0.5); //Green if safe
            const FATAL_IMPACT_COLOUR = Colour.rgba(255, 55, 20, 0.9); //Red if fatal
            const STROKE_COLOUR = (fatal) ? FATAL_IMPACT_COLOUR : SAFE_IMPACT_COLOUR;
            Game.renderer.stroke(STROKE_COLOUR, 5, true, true);
            Game.renderer.beginPath();
            Game.renderer.arc(pos, 10, 0, Math.PI * 2, true, true);
            Game.renderer.strokeShape();
        }
        //----------------------------------------//

        //----------------------------------------//
        //Draw a circle with a pulsing interior marking the start / end of an intercept
        function drawInterceptMarker(pos) {
            const PULSE_PERIOD = 1;
            const PULSE = (Time.seconds % PULSE_PERIOD) / PULSE_PERIOD;
            const PULSE_RAD = clamp(INTERCEPT_CIRCLE_RADIUS - PULSE * 100, 0, INTERCEPT_CIRCLE_RADIUS);

            const OUTLINE_COLOUR = Colour.rgb(200, 220, 230);
            const PULSE_COLOUR = Colour.rgba(200, 220, 230, 0.5 - PULSE); //Slightly transparent, reduces in opacity over time


            Game.renderer.stroke(OUTLINE_COLOUR, INTERCEPT_CIRCLE_THICKNESS, true, true);
            Game.renderer.beginPath();
            Game.renderer.arc(pos, INTERCEPT_CIRCLE_RADIUS, 0, Math.PI * 2, true, true);
            Game.renderer.closePath();
            Game.renderer.strokeShape();


            //Draw a pulse moving inward
            Game.renderer.stroke(PULSE_COLOUR, INTERCEPT_CIRCLE_THICKNESS, true, true);
            Game.renderer.beginPath();
            Game.renderer.arc(pos, PULSE_RAD, 0, Math.PI * 2, true, true);
            Game.renderer.closePath();
            Game.renderer.strokeShape();
        }
        //----------------------------------------//

        

        
        for (var i = 0; i < Game.PLANETS.length; i++) {
            const REAL_PLANET = Game.PLANETS[i];
            var data = new PlanetData(REAL_PLANET.data.name, REAL_PLANET.data.pos, REAL_PLANET.data.vel, REAL_PLANET.data.radius, REAL_PLANET.data.mass, REAL_PLANET.data.referenceBodyNames);
            
            var land = null;
            if (REAL_PLANET.land != null) {
                land = new PlanetSurface(REAL_PLANET.land.colour, REAL_PLANET.land.OUTLINE_COLOUR, REAL_PLANET.land.innerColour, REAL_PLANET.land.mantleColour, REAL_PLANET.land.outerCoreColour, REAL_PLANET.land.innerCoreColour, REAL_PLANET.land.mountainColour, REAL_PLANET.land.snowColour, REAL_PLANET.land.mountainOutlineColour, REAL_PLANET.land.mountains);
            }

            var ocean = null;
            if (REAL_PLANET.ocean != null) {
                ocean = new PlanetOceans(REAL_PLANET.ocean.oceanColourShallow, REAL_PLANET.ocean.oceanColourDeep, REAL_PLANET.ocean.oceans);
            }

            var atmosphere = null;
            if (REAL_PLANET.atmosphere != null) {
                atmosphere = new PlanetAtmosphere(REAL_PLANET.atmosphere.seaLvlRadius, REAL_PLANET.atmosphere.radius, REAL_PLANET.atmosphere.seaLvlDensity, REAL_PLANET.atmosphere.atmoColourLow, REAL_PLANET.atmosphere.atmoColourMid);
            }

            fake_planets.push(new Planet(data, land, ocean, atmosphere));

            prevPlanetPositions[i] = fake_planets[i].data.pos;
            prevInInterceptWithPlanet[i] = false;
            currInInterceptWithPlanet[i] = false;
            
            if (land != null) {
                planetTrajectories[i] = new Trajectory(REAL_PLANET.land.colour, 2);
            } else {
                const DEFAULT_COLOUR = Colour.rgb(255, 27, 27);
                planetTrajectories[i] = new Trajectory(DEFAULT_COLOUR, 2);
            }
            
        }

        
        //----------------------------------------//



        var drawIterations = 0; //Counts up every time i % <FREQUENCY> == 0


        //Integrate through a fake simulation and cache the resulting trajectories to be drawn later
        for (var i = 0; i < DEPTH; i++) {
            //----------------------------------------//
            //verlet integration
            for (var p = 0; p < fake_planets.length; p++) {
                fake_planets[p].Update(DT, fake_planets);
            }
            for (var p = 0; p < fake_planets.length; p++) {
                fake_planets[p].Integrate(DT);
            }
            for (var p = 0; p < fake_planets.length; p++) {
                fake_planets[p].Update(DT, fake_planets);
            }
            //----------------------------------------//

            //----------------------------------------//
            //cache fake planet positions and velocities for performance (wow it makes a difference)
            for (var p = 0; p < fake_planets.length; p++) {
                dynamicPlanetPositions[p] = fake_planets[p].data.pos;
                dynamicPlanetVelocities[p] = fake_planets[p].data.vel;
            }
            //----------------------------------------//

            //----------------------------------------//
            //apply gravity to fake player
            for (var p = 0; p < fake_planets.length; p++) {
                const DELTA = dynamicPlanetPositions[p].sub(pos);
                const DELTA_NORM = DELTA.norm();
                const DIST_SQUARED = DELTA.sqrMag();
                const ACCEL = Game.G * PLANET_MASSES[p] / (DIST_SQUARED) * DT;
                vel = vel.add(DELTA_NORM.mul(ACCEL));
                if (fake_planets[p].land != null) { //There IS a surface to collide with
                    if (DIST_SQUARED < PLANET_RADII[p] ** 2) {
                    
                        //finish drawing the trajectories
                        for (var t = 0; t < planetTrajectories.length; t++) {
                            planetTrajectories[t].Draw();
                        } 

                        const MIN_DIST_FOR_IMPACT_MARKER = 50;
                        if (Vec2.dist(PLAYER_POS, pos) < MIN_DIST_FOR_IMPACT_MARKER) return; //Only draw an impact marker 'far' away from the player


                        //Draw a huge outline around the impact circle (for when the player is zoomed out
                        const PLANET_POS = dynamicPlanetPositions[p];
                        const REL_VEL = vel.sub(dynamicPlanetVelocities[p]);
                        
                        const POS = pos.sub(PLANET_POS).add(START_PLANET_POSITIONS[p]);
                        drawImpactCircle(POS, Player.isImpactFatal(REL_VEL, DELTA_NORM))

                            
                        return;
                    }
                }
                
            }
            //----------------------------------------//

            pos = pos.add(vel.mul(DT));
            vel = vel.add(Player.getDrag(pos, vel, fake_planets).mul(DT));
            
            //----------------------------------------//
            //Only draw lines every so many iterations
            const FREQUENCY = 1;
            if (i % FREQUENCY == 0) {
                drawIterations ++;
                const FAKE_CLOSEST_PLANET_POS = dynamicPlanetPositions[startSunIdx];
                posDraw = pos.sub(FAKE_CLOSEST_PLANET_POS);
                //----------------------------------------//
                //Draw intercept lines
                for (var p = 0; p < fake_planets.length; p++) {
                    const PLANET_POS = dynamicPlanetPositions[p];
                    const LAST_ITERATION_PLANET_POS = prevPlanetPositions[p];
                    const DELTA = PLANET_POS.sub(pos);
                    const DIST = DELTA.len();
                    const THRESH_MUL_RAD = Planet.LOCATOR_RADIUS_RAD_MUL;

                    
                    if (DIST < PLANET_RADII[p] * THRESH_MUL_RAD && p != startSunIdx) 
                    {
                        currDrewIntercept = true;
                        //Draw an intercept line
                        planetTrajectories[p].addSegment(
                            new LineSegment(
                                pos.sub(PLANET_POS).add(START_PLANET_POSITIONS[p]),

                                lastPos.sub(LAST_ITERATION_PLANET_POS).add(START_PLANET_POSITIONS[p])
                            )
                        );
                    
                        
                        currInInterceptWithPlanet[p] = true;
                        
                    } else {
                        currInInterceptWithPlanet[p] = false;
                    }
                }
                //----------------------------------------//

                //----------------------------------------//
                //loop through all planets
                //draw where any start / end of intercepts are
                for (var p = 0; p < fake_planets.length; p++) {
                    if (currInInterceptWithPlanet[p] != prevInInterceptWithPlanet[p] //Start or end of an intercept
                        && i > 0 //not first frame e.g don't say that the player pos is the start of an intercept
                    ) {
                        
                        

                        //loop through all planets and if the fake player is on an intercept with them, also draw an intercept circle relative to that planet
                        for (var p2 = 0; p2 < fake_planets.length; p2++) {
                            //Only draw intercept circle relative to planets that the fake player is on an intercept with
                            if (!currInInterceptWithPlanet[p2]) continue;
                            const POS = pos.sub(dynamicPlanetPositions[p2]).add(START_PLANET_POSITIONS[p2]);
                            drawInterceptMarker(POS);
                        }

                        const POS = pos.sub(dynamicPlanetPositions[p]).add(START_PLANET_POSITIONS[p]);

                        //also draw relative to the original body
                        drawInterceptMarker(POS);


                        
                        
                    }
                }
                //Draw relative to sun too
                if (currDrewIntercept != prevDrewIntercept && i > 0) {
                    drawInterceptMarker(posDraw.sub(dynamicPlanetPositions[startSunIdx]).add(START_PLANET_POSITIONS[startSunIdx]));
                }
                
                
                //----------------------------------------//



                //----------------------------------------//
                //draw a line from the previous position to this iteration's position relative to the sun
                //don't clog up the screen
                if (!currDrewIntercept) {
                    planetTrajectories[startSunIdx].addSegment(new LineSegment(
                            posDraw.sub(dynamicPlanetPositions[startSunIdx]).add(START_PLANET_POSITIONS[startSunIdx]),
                            lastPosDraw.sub(prevPlanetPositions[startSunIdx]).add(START_PLANET_POSITIONS[startSunIdx])
                        )
                    );
                    
                }
                //----------------------------------------//
                

                //----------------------------------------//
                //if the player is going to explode, in update() time will be slowed down to let the player understand what happened

                //The number of seconds before blowing up that time slows down
                const SECONDS_BEFORE_DEATH = 0.3;
                if (Player.getHeat(pos, vel, fake_planets) >= 1) {
                    if (i < SECONDS_BEFORE_DEATH * 60) {
                        Player.mightExplodeOnReentry = true;

                        
                    }
                    
                    for (var p = 0; p < currInInterceptWithPlanet.length; p++) {
                        if (currInInterceptWithPlanet[p]) {
                            drawImpactCircle(pos.sub(dynamicPlanetPositions[p]).add(START_PLANET_POSITIONS[p]), true);
                        }
                    }
                    
                    //Finish drawing
                    for (var t = 0; t < planetTrajectories.length; t++) {
                        planetTrajectories[t].Draw();
                    }
                    return;
                } else {
                    Player.mightExplodeOnReentry = false;
                }
                //----------------------------------------//

                //Update last pos
                lastPos = pos;
                lastPosDraw = posDraw;

                //Update planet last positions
                //Update previous intercept states
                for (var p = 0; p < fake_planets.length; p++) {
                    prevPlanetPositions[p] = dynamicPlanetPositions[p];
                    prevInInterceptWithPlanet[p] = currInInterceptWithPlanet[p];
                }
                prevDrewIntercept = currDrewIntercept;
                currDrewIntercept = false;
            }
            //----------------------------------------//
        }

        
        for (var t = 0; t < planetTrajectories.length; t++) {
            planetTrajectories[t].Draw();
        }
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //discoverPlanet(planetIdx)
    //Mark the planet at 'Game.PLANETS[planetIdx]' as discovered
    //Increment player score
    static discoverPlanet(planetIdx) {
        if (Game.PLANETS[planetIdx].data.discovered) return; //Can't discover a planet twice
        Game.PLANETS[planetIdx].data.discovered = true; //mark as discovered
        const VALUE = (1000 / Game.PLANETS[planetIdx].data.radius);
        Player.score += VALUE * 1000;
        Player.fuel = clamp(Player.fuel + VALUE * 20, 0, Difficulty.Player.MAX_FUEL);
    }
    //----------------------------------------------------------------------//



    //----------------------------------------------------------------------//
    //die()
    //kill the player!
    static die() {
        Player.deathCounter = 1;
        State.setState(Game.SCORE_STATE_ID, Player.score);
        Player.smoothScore = Player.score; //Don't confuse the player by showing the wrong score!
        Player.zoom = 5;
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
