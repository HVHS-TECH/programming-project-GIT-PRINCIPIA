//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Player class                                                          //
//Manages player movement and logic, as well as player rendering        //
//----------------------------------------------------------------------//
import { Game } from "./game.mjs";
import { Input } from "./input.mjs";
import { Vec2 } from "./miscellaneous.mjs";
import { Renderer } from "./renderer.mjs";
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
        Player.UpdateThruster();
        Player.ApplyGravity();
        Player.ApplyAtmosphericEffects();
        Player.Integrate();
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //UpdateThruster()
    //Manages thruster and fuel
    static UpdateThruster() {
        if (Player.fuel != 0) {
            var inputForward = (Input.KeyDown("KeyW")) * Player.thrusterForce;
            Player.vel.x += Math.sin(Player.dir) * inputForward;
            Player.vel.y += Math.cos(Player.dir) * inputForward;
            Player.fuel -= (inputForward != 0) ? Player.fuelUsedPerFrame : 0;
            if (Player.fuel < 0) Player.fuel = 0;
        }
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //ApplyGravity()
    //Applies gravitational attraction from planets to the player
    static ApplyGravity() {
        //Apply gravity
        for (var p = 0 ; p < Game.PLANETS.length; p++) {
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
        //Integrate position
        Player.pos = Player.pos.add(Player.vel);

        //Integrate rotation
        Player.dir += Player.ang_vel;

        Player.zoom *= ((Input.KeyDown("ArrowUp") * 0.01 + 1) / (Input.KeyDown("ArrowDown") * 0.01 + 1));

        var rotate = (Input.KeyDown("KeyD") - Input.KeyDown("KeyA")) * 0.005;
        
        Player.ang_vel += rotate / (Player.ang_vel * 1 + 1);
        Player.ang_vel *= 0.92;
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //Draw()
    //Calls DrawPlayer() with default values
    static Draw() {
        this.DrawPlayer(new Vec2(0,0), 1, true, true);
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