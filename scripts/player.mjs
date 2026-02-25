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
    static fuelUsedPerFrame = 0.01;
    static thrusterForce = 0.005;
    static Update() {
        if (Player.fuel != 0) {
            var inputForward = (Input.KeyDown("KeyW") - Input.KeyDown("KeyS")) * Player.thrusterForce;
            Player.vel.x += Math.sin(Player.dir) * inputForward;
            Player.vel.y -= Math.cos(Player.dir) * inputForward;
            Player.fuel -= (inputForward != 0) ? Player.fuelUsedPerFrame : 0;
            if (Player.fuel < 0) Player.fuel = 0;
        }
        var rotate = (Input.KeyDown("KeyD") - Input.KeyDown("KeyA")) * 0.01;
        
        Player.ang_vel += rotate / (Player.ang_vel * 1 + 1);
        Player.ang_vel *= 0.7;
        


        //Apply gravity
        for (var p = 0 ; p < Game.PLANETS.length; p++) {
            var other = Game.PLANETS[p];
            var delta = other.pos.sub(Player.pos);
            var dist = delta.len();
            var deltaNorm = delta.norm();

            //If you are colliding with the planet, match its velocity and shift to above the surface to resolve the collision.
            if (dist < other.radius) {
                Player.vel = other.vel;
                while (dist < other.radius) {
                    delta = other.pos.sub(Player.pos);
                    dist = delta.len();
                    Player.pos = Player.pos.sub(deltaNorm.mul(new Vec2(0.01, 0.01)));
                }
                
                break;
            }
            var force = Game.G * other.mass / (dist * dist);
            Player.vel = Player.vel.add(deltaNorm.mul(new Vec2(force, force)));
        }
        //Integrate position
        Player.pos = Player.pos.add(Player.vel);

        //Integrate rotation
        Player.dir += Player.ang_vel;

        Player.zoom *= ((Input.KeyDown("ArrowUp") * 0.01 + 1) / (Input.KeyDown("ArrowDown") * 0.01 + 1));
        
    }
    static Draw() {
        var deltaFront = new Vec2(Math.sin(Player.dir) * 10, -Math.cos(Player.dir) * 10);
        var deltaRight = new Vec2(Math.sin(Player.dir + Math.PI / 2) * 3, -Math.cos(Player.dir + Math.PI / 2) * 3);
        var deltaLeft = new Vec2(Math.sin(Player.dir + Math.PI / 2) * -3, -Math.cos(Player.dir + Math.PI / 2) * -3);
        var vertices = [Player.pos.add(deltaFront), Player.pos.add(deltaRight), Player.pos.add(deltaLeft)];

        Game.renderer.fill('white');
        Game.renderer.drawPolygon(vertices);
        Game.renderer.fillShape();
    }
}