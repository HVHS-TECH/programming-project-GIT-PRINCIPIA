//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Navball class                                                         //
//A circle at the bottom of the screen displaying information such as:  //
//                                                                      //
// - The player's rotation, rendered as an enlarged version of the      //
//   player                                                             //
//                                                                      //
// - The player's velocity, rendered as a circular meter around the rim //
//                                                                      //
// - The player's direction of movement, rendered as 'wind streaks'     //
//                                                                      //
// - The closest planet, rendered as text denoting its name and distance//
//                                                                      //
//----------------------------------------------------------------------//

import { UIelement } from "./ui_element.mjs";
import { Renderer } from "../../core/renderer.mjs";
import { Game } from "../../core/game.mjs";
import { Vec2, clamp, lerp} from "../../utility/miscellaneous.mjs";
import { Player } from "../../core/player.mjs";
import { Time } from "../../utility/time.mjs";
import { Input } from "../../interface/input.mjs";
import { Colour } from "../../utility/miscellaneous.mjs";


//----------------------------------------------------------------------//
//Navball, displays a copy of the player, and information such as their velocity, velocity direction, closest planet, etc
export class Navball extends UIelement {
    constructor(pos, align, radius, playerColour, backgroundColour, backgroundColourOuter, windStreakColour, textColour, outlineColour, outlineWidth, velRefName, velDirRefName) {
        super(pos, align, radius * 2, radius * 2);
        this.radius = radius;
        this.playerColour = playerColour;
        this.backgroundColour = backgroundColour;
        this.backgroundColourOuter = backgroundColourOuter;
        this.windStreakColour = windStreakColour;
        this.textColour = textColour;
        this.outlineColour = outlineColour;
        this.outlineWidth = outlineWidth;
        this.vel = 0;
        this.velDir = 0;
        this.playerScale = 20;
        this.playerVelScale = this.radius;
        this.velDirRefName = velDirRefName;
        this.velRefName = velRefName;
        this.frame = 100000;
    }

    //----------------------------------------------------------------------//
    //Update()
    //Called every frame
    //Updates the velocity magnitude and velocity direction references
    Update() {
        this.vel = Game.getRefVar(this.velRefName);
        this.velDir = Game.getRefVar(this.velDirRefName);
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //Draw()
    //Draws the Navball
    Draw() {
        var center = this.GetCenter();

        this.DrawBackground(center);

        this.DrawWindStreaks(center);

        this.DrawPlayer(center);

        this.DrawOutline(center);
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawBackground(center)
    //Draws the background circle of the navball
    DrawBackground(center) {
        //----------------------------------------//
        //Draw the background
        var gradient = Game.renderer.radGradient(center, center, 0, this.radius, false, true);
        gradient.addColorStop(0.4, this.backgroundColour.txt()); //Starts at 0.4 because the player takes up (some) space in the middle
        gradient.addColorStop(1, this.backgroundColourOuter.txt());
        Game.renderer.fill(gradient);
        Game.renderer.beginPath();
        Game.renderer.arc(center, this.radius, 0, Math.PI * 2, false, true);
        Game.renderer.fillShape();
        //----------------------------------------//
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawWindStreaks()
    //Draws the 'wind streaks' indicating the player velocity direction
    DrawWindStreaks(center) {
        //----------------------------------------//
        //Settings, could be moved to constructor
        const SPACING = 250; //Spacing between wind streaks
        const SIZE = 100; //Length of wind streaks
        const NUM_LINES = 20; //Number of lines across the navball - some are skipped
        //----------------------------------------//

        //----------------------------------------//
        //Populate lineDashArray
        const LENGTH = Math.ceil(this.radius / (SPACING + SIZE)); //Length of array
        var lineDashArray = [];
        for (var i = 0; i < LENGTH; i++) {
            lineDashArray.push(SIZE);
            lineDashArray.push(SPACING);
        }
        //----------------------------------------//

        //----------------------------------------//
        //Draw the lines
        for (var l = -this.radius; l <= this.radius; l += this.radius * 2 / (NUM_LINES * 0.4)) {
            const widthHalf = Math.sqrt(this.radius * this.radius - l * l);
            var p1 = new Vec2(-widthHalf, l);
            var p2 = new Vec2(widthHalf, l);

            //Rotate p1 and p2 by slope around center
            p1 = p1.rotate(this.velDir - Player.smoothDir);
            p2 = p2.rotate(this.velDir - Player.smoothDir);

            p1 = p1.add(center);
            p2 = p2.add(center);

            //----------------------------------------//
            //Spread out the equation into smaller chunks
            const A = (SPACING + SIZE) / SPACING
            const TIME = (this.frame) + Math.sin(l / 10 + this.frame / 200000) * 34000 - Math.cos(l / 20 + this.frame / 200000) * 3000;
            const MODULUS = TIME % (A * SPACING / SIZE);
            //----------------------------------------//

            //----------------------------------------//
            //Populate start of array with segments that grow in length to imitate movement
            var lineDashArrayStart = [ 
                clamp((MODULUS) * SIZE - SPACING, 0, SIZE), //SIZE
                clamp((MODULUS) / (SPACING / SIZE) * SPACING, 0, SPACING) //SPACING
                    ];
            //----------------------------------------//

            //Add the rest of the array on the end
            lineDashArrayStart.push(...lineDashArray);

            //----------------------------------------//
            //Render the line

            //Don't let the width get too small or large
            const WIDTH = clamp(this.radius * 2 / (NUM_LINES * 2), 
                3, //Min size
                10 //Max size
            );
            
            Game.renderer.lineDash(lineDashArrayStart, false, true);

            //Draw the 'shadow'
            const SHADOW_DEPTH = 5;
            const SHADOW_P1 = p1.sub(new Vec2(0, SHADOW_DEPTH));
            const SHADOW_P2 = p2.sub(new Vec2(0, SHADOW_DEPTH));
            Game.renderer.stroke(Colour.lerp(this.windStreakColour, Colour.rgb(0,0,0), 0.7), WIDTH, false, true);
            Game.renderer.beginPath();
            Game.renderer.line(SHADOW_P1, SHADOW_P2, false, true); 
            Game.renderer.strokeShape();


            //Draw the line
            Game.renderer.stroke(this.windStreakColour, WIDTH, false, true);
            Game.renderer.beginPath();
            Game.renderer.line(p1, p2, false, true); 
            Game.renderer.strokeShape();

            

            //Reset line dash
            Game.renderer.lineDash([]);
            //----------------------------------------//
        }
        //----------------------------------------//

        const SPEED_MUL = 0.15;
        this.frame += this.vel * SPEED_MUL;
    }
    //----------------------------------------------------------------------//

    DrawPlayer(center) {
        //----------------------------------------//
        //Draw the player at an enlarged size
        Player.drawPlayer(center, this.playerScale, false, true, true);
        //----------------------------------------//
    }

    DrawOutline(center) {
        //----------------------------------------//
        //Draw the background outline last
        Game.renderer.stroke(this.outlineColour, this.outlineWidth, false, true);
        Game.renderer.beginPath();
        Game.renderer.arc(center, this.radius, 0, Math.PI * 2, false, true);
        Game.renderer.closePath();
        Game.renderer.strokeShape();
        //----------------------------------------//
    }
}
//----------------------------------------------------------------------//
