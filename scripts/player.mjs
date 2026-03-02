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
    static ang_vel = 0;
    static zoom = 1;
    static maxFuel = 100;
    static fuel = 100;
    static fuelUsedPerFrame = 0.05;
    static thrusterForce = 0.006;
    static height = 10;
    static width = 6;

    //----------------------------------------------------------------------//
    //Update()
    //called every frame
    static Update() {
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
            var inputForward = (Input.KeyDown("KeyW")) * Player.thrusterForce;




            if (inputForward > 0) {
                //Integrate velocity based on input and delta time
                Player.vel.x += Math.sin(Player.dir) * inputForward * Time.scaleDeltaTime;
                Player.vel.y += Math.cos(Player.dir) * inputForward * Time.scaleDeltaTime;

                //Reduce fuel based on fuel consumption and delta time
                Player.fuel -= Player.fuelUsedPerFrame * Time.scaleDeltaTime;

                //Thruster particles
                const FRAME_INTERVAL = 1000; 
                if (Time.frame % 20 == 0) {
                    const PARTICLE_WIDTH = 1;
                    const PARTICLE_POS = new Vec2(Math.sin(Player.dir + Math.PI) * (Player.height / 2 + PARTICLE_WIDTH / 2), Math.cos(Player.dir + Math.PI) * (Player.height / 2 + PARTICLE_WIDTH / 2))

                    const PARTICLE_DIR = Player.dir + Math.PI; //Opposite to player direction
                    const SPEED = 2;
                    var particleVel = Player.vel.add(
                        new Vec2(
                            Math.sin(PARTICLE_DIR) * SPEED, 
                            Math.cos(PARTICLE_DIR) * SPEED
                        )
                    );
                    new Particle(Player.pos.add(PARTICLE_POS), Player.dir, 
                    particleVel, 0, 
                    PARTICLE_WIDTH, 
                    Colour.rgb(255, 178, 115), 
                    Colour.rgba(255, 102, 0, 0.49), 
                    Colour.rgba(0, 0, 0, 0), 
                    1000,

                        function(){ //Update
                            this.width += 1 - (this.frame / this.lifetime * 2) * Time.scaleDeltaTime;
                        }, 


                        function(){ //OnDeath
                            const PARTICLE_POS = this.pos;
                            const PARTICLE_VEL = this.vel;
                            new Particle(Player.pos.add(PARTICLE_POS), Player.dir, 
                            particleVel, 0, 
                            PARTICLE_WIDTH, 
                            Colour.rgb(255, 178, 115), 
                            Colour.rgba(255, 102, 0, 0.49), 
                            Colour.rgba(0, 0, 0, 0), 10, 
                            function(){}, function(){});
                        }
                    );
                }
            }

            if (Player.fuel < 0) Player.fuel = 0;
        }
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
            var dist = delta.len() - Player.height / 2;
            var deltaNorm = delta.norm();

            //If you are colliding with the planet, match its velocity and shift to above the surface to resolve the collision.
            if (dist < other.radius) {
                Player.vel = other.vel;
                while (dist < other.radius) {
                    delta = other.pos.sub(Player.pos);
                    dist = delta.len() - Player.height / 2;
                    Player.pos = Player.pos.sub(deltaNorm.mul(new Vec2(0.01, 0.01)));
                }
                Player.dir = delta.dir(); //Lock the player outward
                Player.ang_vel = 0;
                break;
            }
            var force = Game.G * other.mass / (dist * dist);
            Player.vel = Player.vel.add(deltaNorm.mul(new Vec2(force, force)));
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
        Player.pos = Player.pos.add(Player.vel.mul(Time.scaleDeltaTime));

        //Integrate rotation based on angular velocity and delta time
        Player.dir += Player.ang_vel * Time.scaleDeltaTime;

        //Integrate zoom based on input and delta time
        Player.zoom *= ((Input.KeyDown("ArrowUp") * 0.01 + 1) / (Input.KeyDown("ArrowDown") * 0.01 + 1)) * Time.scaleDeltaTime;

        var rotate = (Input.KeyDown("KeyD") - Input.KeyDown("KeyA")) * 0.005;

        Player.ang_vel += rotate / (Player.ang_vel * 1 + 1);
        Player.ang_vel *= 0.92;
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //Draw()
    //Calls DrawPlayer() with default values
    static Draw() {
        this.DrawPlayer(new Vec2(0, 0), 1, true, true);
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawPlayer()
    //Draws the player based on an offset, scale, and whether it is relative to the player position and or scales with screen size
    static DrawPlayer(offset, scale, playerRelative, doScreenScale) {
        if (playerRelative) offset = offset.add(Player.pos);


        const heightOffset = new Vec2(Math.sin(Player.dir) * Player.height * scale, Math.cos(Player.dir) * Player.height * scale);
        const widthOffset = new Vec2(Math.sin(Player.dir + Math.PI / 2) * Player.width * scale, Math.cos(Player.dir + Math.PI / 2) * Player.width * scale);

        //Draw the player, centered
        var deltaFront = heightOffset.mul(new Vec2(0.5, 0.5));
        var deltaRight = heightOffset.mul(new Vec2(-0.5, -0.5)).add(widthOffset.mul(new Vec2(0.5, 0.5)));
        var deltaLeft = heightOffset.mul(new Vec2(-0.5, -0.5)).add(widthOffset.mul(new Vec2(-0.5, -0.5)));
        var vertices = [offset.add(deltaFront), offset.add(deltaRight), offset.add(deltaLeft)];

        Game.renderer.fill('white');
        Game.renderer.drawPolygon(vertices, playerRelative, doScreenScale);
        Game.renderer.fillShape();
    }
    //----------------------------------------------------------------------//
}