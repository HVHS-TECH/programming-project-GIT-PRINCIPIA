//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Player class                                                          //
//Manages player movement and logic, as well as player rendering        //
//----------------------------------------------------------------------//
import { Planet } from "@scripts/core/planet.mjs";
import { Game } from "@scripts/core/game.mjs";
import { Input } from "@scripts/interface/input.mjs";
import { Vec2, Colour } from "@scripts/utility/miscellaneous.mjs";
import { Renderer } from "@scripts/core/renderer.mjs";
import { Time } from "@scripts/utility/time.mjs";
import { Particle, spawnExplosion } from "@scripts/utility/particle.mjs";
import { lerp, clamp } from "@scripts/utility/miscellaneous.mjs";
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
    static IMPACT_TOLERANCE = 2;

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
            Player.ApplyGravity();
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
        Player.UpdateThruster();
        Player.ApplyGravity();
        Player.ApplyAtmosphericEffects();
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //UpdateThruster()
    //Manages thruster and fuel
    static UpdateThruster() {
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
            Player.die();
        }
        //----------------------------------------//
        
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //ApplyGravity()
    //Applies gravitational attraction from planets to the player
    static ApplyGravity() {
        //Apply gravity
        for (var p = 0; p < Game.PLANETS.length; p++) {
            var other = Game.PLANETS[p];
            var delta = other.pos.sub(Player.pos);
            var dist = delta.len() - Player.HEIGHT / 2;
            const DELTA_NORM = delta.norm();

            //If you are colliding with the planet, match its velocity and shift to above the surface to resolve the collision.
            if (dist < other.radius) {
                //----------------------------------------//
                //resolve collision
                while (dist < other.radius) {
                    delta = other.pos.sub(Player.pos);
                    dist = delta.len() - Player.HEIGHT / 2;
                    Player.pos = Player.pos.sub(DELTA_NORM.mul(new Vec2(0.01, 0.01)));
                }
                //----------------------------------------//

                //----------------------------------------//
                //Should the player explode (were they moving too fast?)
                const REL_VEL = Player.vel.sub(other.vel);
                const VEL_NORM = REL_VEL.norm();
                const VEL_NORM_DOT_DELTA_NORM = Vec2.dot(VEL_NORM, DELTA_NORM);
                const DIR_DOT_DELTA_NORM = Vec2.dot(new Vec2(Math.sin(Player.dir), Math.cos(Player.dir)), DELTA_NORM);
                const IMPACT_SEVERITY = 
                Math.max(2 - VEL_NORM_DOT_DELTA_NORM, 0) * 0.7 //Punish the player for landing while moving sideways
                 + Math.max(DIR_DOT_DELTA_NORM, 0) * 1.5; //Punish the player for not landing upright
                
                //Adjust velocity (skid / slide)
                const FRICTION = 0.9; //Closer to one = slicker
                const SKID_VEL = REL_VEL.mul(FRICTION);
                Player.vel = other.vel.add(SKID_VEL);

                //only explode if the player hasn't already exploded
                if (REL_VEL.len() > Player.IMPACT_TOLERANCE - IMPACT_SEVERITY && !Player.exploded) {
                    Player.explode();
                    return;
                }
                //----------------------------------------//
                Player.discoverPlanet(p);//Must be called after checking for crash, because otherwise you could crash into a planet and still discover it.

                
                
                
                Player.dir = delta.dir(); //Lock the player outward
                Player.ang_vel = 0;
                break;
            }
            var force = Game.G * other.mass / (dist * dist) * Time.scaleDeltaTime;
            Player.vel = Player.vel.add(DELTA_NORM.mul(new Vec2(force, force)));
        }
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //ApplyAtmosphericEffects()
    //Applys aerodynamic forces and reentry heating to the player
    static ApplyAtmosphericEffects() {
        //----------------------------------------//
        //is the player in an atmosphere?
        var other = Game.PLANETS[Game.getClosestPlanet(Player.pos)];
        var delta = other.pos.sub(Player.pos);
        var dist = delta.len();
        var atmoRad = other.atmoRad;
        if (dist > atmoRad) {
            //We are not in an atmosphere - exiting function!
            return;
        }
        //----------------------------------------//

        //----------------------------------------//
        //We ARE in an atmosphere
        const REL_VEL = Player.vel.sub(other.vel);
        const DRAG = new Vec2(1, 1);
        const SLOWED_VEL = DRAG.mul(REL_VEL);
        Player.vel = other.vel.add(SLOWED_VEL);


        //----------------------------------------//
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //Integrate()
    //Integrates the players position and rotation
    static Integrate() {
        //Integrate position based on velocity and delta time
        Player.pos = Player.pos.add(Player.vel.mul(new Vec2(Time.scaleDeltaTime, Time.scaleDeltaTime)));

        //Integrate rotation based on angular velocity and delta time
        Player.dir += Player.ang_vel * Time.scaleDeltaTime / Game.smoothTimeWarp;

        //Integrate zoom based on input and delta time
        const ZOOM_SPEED = 0.05 / Game.smoothTimeWarp;
        Player.zoom *= ((Input.KeyDown("ArrowUp") * ZOOM_SPEED * Time.scaleDeltaTime + 1) / (Input.KeyDown("ArrowDown") * ZOOM_SPEED * Time.scaleDeltaTime + 1));
        Player.zoom = clamp(Player.zoom, 0.00001, 10000000);
        var rotate = (Input.KeyDown("KeyD") - Input.KeyDown("KeyA")) * 0.005;

        Player.ang_vel += rotate / (Player.ang_vel + 1) * Time.scaleDeltaTime;
        Player.ang_vel *= 0.95;
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //Draw()
    //Calls DrawPlayer() with default values
    static Draw() {
        //this.drawTrajectory();
        this.DrawPlayer(new Vec2(0, 0), 1, true, true, false);
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawPlayer(offset, scale, playerRelative, doScreenScale, useSmoothDirDiff)
    //Draws the player based on an offset, scale, and whether it is relative to the player position and or scales with screen size
    //useSmoothDirDiff: if true, replace Player.dir with Player.dir - Player.smoothDir
    static DrawPlayer(offset, scale, playerRelative, doScreenScale, useSmoothDirDiff) {
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
        const DEPTH = 1000;
        var closestPlanetIdx = Game.getClosestPlanet(Player.pos, true);
        //----------------------------------------//
        //Simulation state variables
        var pos = Player.pos;
        var vel = Player.vel;

        var lastPos = Player.pos;

        //Make sure to not just assign a reference to Game.PLANETS - make an actual copy
        var fake_planets = [];
        for (var i = 0; i < Game.PLANETS.length; i++) {
            const REAL_PLANET = Game.PLANETS[i];
            fake_planets.push(new Planet(REAL_PLANET.name, REAL_PLANET.pos, REAL_PLANET.vel, REAL_PLANET.mass, REAL_PLANET.radius, REAL_PLANET.atmoRad, REAL_PLANET.colour, REAL_PLANET.outlineColour, REAL_PLANET.innerColour, REAL_PLANET.mantleColour, REAL_PLANET.outerCoreColour, REAL_PLANET.innerColourColour, REAL_PLANET.atmoColourLow, REAL_PLANET.atmoColourMid, REAL_PLANET.mountainColour, REAL_PLANET.snowColour, REAL_PLANET.mountainOutlineColour, REAL_PLANET.mountains, REAL_PLANET.oceanColourShallow, REAL_PLANET.oceanColourDeep, REAL_PLANET.oceans));
        }
        //----------------------------------------//
        for (var i = 0; i < DEPTH; i++) {

            
            
        }
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
        
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //explode()
    //spawns two rings of explosion particles, deletes the player image
    static explode() {
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
