//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Player class                                                          //
//Manages player movement and logic, as well as player rendering        //
//----------------------------------------------------------------------//
import { Game } from "./game.mjs";
import { Input } from "./input.mjs";
import { Vec2, Colour } from "./miscellaneous.mjs";
import { Renderer } from "./renderer.mjs";
import { Time } from "./time.mjs";
import { Particle } from "./particle.mjs";
import { lerp } from "./miscellaneous.mjs";
export class Player {
    static pos = new Vec2(0, 0);
    static vel = new Vec2(0, 0);
    static dir = 0;
    static smoothDir = 0; //Smoothly rotating dir
    static ang_vel = 0;
    static zoom = 1;
    static MAX_FUEL = 100;
    static fuel = 100;
    static FUEL_USED_PER_FRAME = 0.05;
    static THRUSTER_FORCE = 0.006;
    static HEIGHT = 10;
    static WIDTH = 6;
    static deathCounter = 0; //A counter that starts counting up when the player dies. When it reaches deathCounterThreshold, the user is redirected to 'end.html'
    static exploded = false;
    static DEATH_COUNTER_THRESH = 120; //120 'frames' at 60 'fps'
    static IMPACT_TOLERANCE = 2;
    
    //----------------------------------------------------------------------//
    //Update()
    //called every frame
    static Update() {
        if (Player.deathCounter > 0) {
            if (Player.deathCounter > Player.DEATH_COUNTER_THRESH) {
                Game.setPage(Game.END_TITLE); //Go to 'end.html'
                return;
            }
            Player.deathCounter += Time.scaleDeltaTime;
            Player.ApplyGravity();
            Player.pos = Player.pos.add(Player.vel.mul(Time.scaleDeltaTime));
            return;
        }

        var closestPlanet = Game.getClosestPlanet(Player.pos, true);
        var otherPos = Game.PLANETS[closestPlanet].pos;
        var delta = otherPos.sub(Player.pos);
        const DELTA_NORM = delta.norm(); //Normalized vector from player to planet


        const INTERPOLATION_VALUE = 0.05; //What fraction of the rotation to do each frame? (smaller = smoother)

        const SMOOTH_DIR_VEC = new Vec2(Math.sin(Player.smoothDir - Math.PI), Math.cos(Player.smoothDir - Math.PI));
        
        
        Player.smoothDir = Vec2.slerp(SMOOTH_DIR_VEC, DELTA_NORM, INTERPOLATION_VALUE).dir() + Math.PI; 
        


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

                //Thruster particles
                const DIR_RANDOMNESS = 0.2;
                const VEL_RANDOMNESS = 0.1;
                const SIZE_RANDOMNESS = 0.5;

                const BASE_DIR = Player.dir + Math.PI;
                const BASE_WIDTH = 1;
                const BASE_SPEED = 1;
                const FRAME_INTERVAL = 2; //Spawn particles every <FRAME_INTERVAL> frames
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
                                this.width += 0.5 * Time.scaleDeltaTime - this.frame / this.lifetime * 1 * Time.scaleDeltaTime;
                                
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
                //Should the player explode (were they moving too fast?)
                const REL_VEL = Player.vel.sub(other.vel);
                const VEL_NORM = REL_VEL.norm();
                const VEL_NORM_DOT_DELTA_NORM = Vec2.dot(VEL_NORM, DELTA_NORM);
                const DIR_DOT_DELTA_NORM = Vec2.dot(new Vec2(Math.sin(Player.dir), Math.cos(Player.dir)), DELTA_NORM);
                const IMPACT_SEVERITY = 
                Math.max(2 - VEL_NORM_DOT_DELTA_NORM, 0) * 0.7 //Punish the player for landing while moving sideways
                 + Math.max(DIR_DOT_DELTA_NORM, 0) * 1.5; //Punish the player for not landing upright
                if (REL_VEL.len() > Player.IMPACT_TOLERANCE - IMPACT_SEVERITY) {
                    Player.explode();
                }
                //----------------------------------------//

                Player.vel = other.vel;
                while (dist < other.radius) {
                    delta = other.pos.sub(Player.pos);
                    dist = delta.len() - Player.HEIGHT / 2;
                    Player.pos = Player.pos.sub(DELTA_NORM.mul(new Vec2(0.01, 0.01)));
                }
                
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

    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //Integrate()
    //Integrates the players position and rotation
    static Integrate() {
        //Integrate position based on velocity and delta time
        Player.pos = Player.pos.add(Player.vel.mul(new Vec2(Time.scaleDeltaTime, Time.scaleDeltaTime)));

        //Integrate rotation based on angular velocity and delta time
        Player.dir += Player.ang_vel * Time.scaleDeltaTime;

        //Integrate zoom based on input and delta time
        Player.zoom *= ((Input.KeyDown("ArrowUp") * 0.01 * Time.scaleDeltaTime + 1) / (Input.KeyDown("ArrowDown") * 0.01 * Time.scaleDeltaTime + 1));

        var rotate = (Input.KeyDown("KeyD") - Input.KeyDown("KeyA")) * 0.005;

        Player.ang_vel += rotate / (Player.ang_vel + 1) * Time.scaleDeltaTime;
        Player.ang_vel *= 0.95;
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //Draw()
    //Calls DrawPlayer() with default values
    static Draw() {
        
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
        const SPEED = 3;
        const RANDOMNESS = 0.5;
        //----------------------------------------//
        //Outer, fast moving ring (shockwave?)
        for (var r = 0; r < Math.PI * 2; r += Math.PI * 2 / NUM_PARTICLES) {
            Game.addParticle(new Particle(
                Player.pos, Player.dir + r, Player.vel.add(
                    new Vec2(
                        Math.sin(r) * SPEED + (Math.random() * 2 - 1) * RANDOMNESS, 
                        Math.cos(r) * SPEED + (Math.random() * 2 - 1) * RANDOMNESS
                    )
                ), 
                1, 10, 
                Colour.rgba(250,150,100,1), 
                Colour.rgba(255, 72, 0, 0.5), 
                Colour.rgba(151, 151, 151, 0), 
                10 + (Math.random() * 2 - 1) * RANDOMNESS * 10,
                function(){},
                function(){}
            ));
        }
        //----------------------------------------//

        //----------------------------------------//
        //Inner cloud
        for (var r = 0; r < Math.PI * 2; r += Math.PI * 2 / NUM_PARTICLES) {
            Game.addParticle(new Particle(
                Player.pos, Player.dir + r, Player.vel.add(
                    new Vec2(
                        Math.sin(r) * SPEED / 3 + (Math.random() * 2 - 1) * RANDOMNESS, 
                        Math.cos(r) * SPEED / 3 + (Math.random() * 2 - 1) * RANDOMNESS
                    )
                ), 
                1, 10, 
                Colour.rgba(250,150,100,1), 
                Colour.rgba(255, 72, 0, 0.5), 
                Colour.rgba(151, 151, 151, 0), 
                20 + (Math.random() * 2 - 1) * RANDOMNESS * 10,
                function(){},
                function(){}
            ));
        }
        //----------------------------------------//
        Player.die();//Die!!!
    }
}
