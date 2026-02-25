//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Renderer class                                                        //
//Manages render functions and canvas setup                             //
//----------------------------------------------------------------------//
import {Planet} from './planet.mjs';
import { Player } from './player.mjs';
import { Vec2 } from './miscellaneous.mjs';
import { Game } from './game.mjs';
export class Renderer {
    constructor() {
        //Initialize the canvas
        
        this.cnvWidth = window.innerWidth;
        this.cnvHeight = window.innerHeight;
        this.canvas = document.getElementById("canvas");
        this.hasCnv = true;
        if (this.canvas == null) {
            this.hasCnv = false;
        }
        else {

        
            this.cnv = this.canvas.getContext("2d");
            this.canvas.width = this.cnvWidth;
            this.canvas.height = this.cnvHeight;
            this.cnvHalfDimen = new Vec2(this.cnvWidth / 2, this.cnvHeight / 2);

            //Set the callbacks
            window.addEventListener('resize', this.cb_windowResized);
        }
    }

    Render() {
        //render the scene


        this.fill('black'); //Set the background to space


        this.cnv.fillRect(0, 0, this.canvas.width, this.canvas.height); //Fill the background

        //Render the planets
        for (var p = 0; p < Game.PLANETS.length; p++) {
            Game.PLANETS[p].Draw();
        }

        //Render the player
        Player.Draw();
    }



    //----------------------------------------------------------------------//
    //radGradient(start, end, inner, outer)                  
    //returns a radial gradient based on the start and end positions and radii    
    //start: start pos
    //end: end pos
    //inner: start radius
    //outer: end radius        
    radGradient(start, end, inner, outer) {
        if (this.canvas == null) {
            console.warn("Renderer.radGradient called on a page with no canvas. This might break things.");
            return null;
        }
        start = start.add(this.cnvHalfDimen);
        end = end.add(this.cnvHalfDimen);

        
        var gradient = this.cnv.createRadialGradient(start.x, start.y, inner, end.x, end.y, outer);
        return gradient;
    }
    //----------------------------------------------------------------------//



    //----------------------------------------------------------------------//
    //fill(style)
    //sets the fillStyle of the canvas
    fill(style) {
        if (this.canvas == null) {
            console.warn("Renderer.fill called on a page with no canvas. This might break things.");
            return;
        }
        this.cnv.fillStyle = style;
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //beginPath()
    //runs cnv.beginPath()
    beginPath() {
        if (this.canvas == null) {
            console.warn("Renderer.beginPath called on a page with no canvas. This might break things.");
            return;
        }
        this.cnv.beginPath();
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //arc(pos, rad, ang)
    //runs cnv.arc
    arc(pos, rad, ang) {
        if (this.canvas == null) {
            console.warn("Renderer.arc called on a page with no canvas. This might break things.");
            return;
        }
        pos = pos.add(this.cnvHalfDimen);
        this.cnv.arc(pos.x, pos.y, rad, 0, ang);
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //fillShape()
    //fills the drawn shape / path
    fillShape() {
        if (this.canvas == null) {
            console.warn("Renderer.fillShape called on a page with no canvas. This might break things.");
            return;
        }
        this.cnv.fill();
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //cb_windowResized()
    //resizes the canvas to match the screen size
    cb_windowResized() {
        //Calculate the new canvas dimensions
        this.cnvWidth = window.innerWidth;
        this.cnvHeight = window.innerHeight; 
        this.cnvHalfDimen = new Vec2(this.cnvWidth / 2, this.cnvHeight / 2);
        //Resize the canvas
        this.cnv.width = this.cnvWidth;
        this.cnv.height = this.cnvHeight;
        console.log("Window resized");

    }
    //----------------------------------------------------------------------//
}
