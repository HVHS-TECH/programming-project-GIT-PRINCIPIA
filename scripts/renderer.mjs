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
import { VertSlider } from './ui_element.mjs';
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
        if (!this.hasCnv) {
            console.warn("Renderer.radGradient called on a page with no canvas. This might break things.");
            return null;
        }
        start = this.worldToCanvas(start);
        end = this.worldToCanvas(end);
        
        var gradient = this.cnv.createRadialGradient(start.x, start.y, inner * Player.zoom, end.x, end.y, outer * Player.zoom);
        return gradient;
    }
    //----------------------------------------------------------------------//



    //----------------------------------------------------------------------//
    //fill(style)
    //sets the fillStyle of the canvas
    fill(style) {
        if (!this.hasCnv) {
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
        if (!this.hasCnv) {
            console.warn("Renderer.beginPath called on a page with no canvas. This might break things.");
            return;
        }
        this.cnv.beginPath();
    }
    //closePath()
    //runs cnv.closePath()
    closePath() {
        if (!this.hasCnv) {
            console.warn("Renderer.beginPath called on a page with no canvas. This might break things.");
            return;
        }
        this.cnv.closePath();
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //arc(pos, rad, ang)
    //runs cnv.arc
    arc(pos, rad, ang) {
        if (!this.hasCnv) {
            console.warn("Renderer.arc called on a page with no canvas. This might break things.");
            return;
        }
        pos = this.worldToCanvas(pos);
        this.cnv.arc(pos.x, pos.y, rad * Player.zoom, 0, ang);
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //fillShape()
    //fills the drawn shape / path
    fillShape() {
        if (!this.hasCnv) {
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
        if (!this.hasCnv) {
            console.warn("Renderer.cb_windowResized called on a page with no canvas. This might break things.");
            return;
        }
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

    //----------------------------------------------------------------------//
    //drawPolygon(vertices)
    //draws a polygon using the array vertices
    drawPolygon(vertices) {
        if (!this.hasCnv) {
            console.warn("Renderer.drawPolygon called on a page with no canvas. This might break things.");
            return;
        }
        this.beginPath();
        var v0 = this.worldToCanvas(vertices[0]);
        this.cnv.moveTo(v0.x, v0.y);

        //Starts at i = 1 because vertices[0] has just been handled
        for (var i = 1; i < vertices.length; i++) {
            var v = this.worldToCanvas(vertices[i]);
            this.cnv.lineTo(v.x, v.y);
        }
        this.closePath();

    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //Helper functions                                                      //
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //worldToCanvas(pos)
    //converts a world position to a canvas (screen) position
    worldToCanvas(pos) {
        pos = pos.sub(Player.pos);
        pos = pos.mul(new Vec2(Player.zoom, Player.zoom));
        pos = pos.add(this.cnvHalfDimen);
        return pos;
    }
    //----------------------------------------------------------------------//
    
}
