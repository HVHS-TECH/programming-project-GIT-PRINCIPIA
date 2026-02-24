//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Renderer core script:                                                 //
//Manages drawing and other core renderer functions                     //
//----------------------------------------------------------------------//



//----------------------------------------------------------------------//
//                            ---Exports---                             //
//----------------------------------------------------------------------//

export {r_core_initialize}
export {r_core_setHasCnv}
export {r_core_render}
export {r_core_radGradient}
export {r_core_fill}
export {r_core_beginPath}
export {r_core_fillShape}
export {r_core_arc}

//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//                            ---Imports---                             //
//----------------------------------------------------------------------//

import {Vec2} from './g_core.mjs';
import {Planet} from './g_core.mjs';
import {g_planets} from './g_core.mjs';

//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//Variables and constants//

//Canvas
var cnv; //The canvas object
var canvas; //The canvas context
var cnvWidth; //The canvas width
var cnvHeight; //The canvas height
var cnvHalfDimen; //half the canvas dimensions, vector2
const CNV_PADDING = 20;
//Renderer state
var initialized = false;
var hasCnv = false;
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//Functions
//----------------------------------------------------------------------//



//----------------------------------------------------------------------//
//r_core_initialize()                    
//called in g_startup.mjs on startup()   
//initializes the renderer               
function r_core_initialize() {
    if (hasCnv) {
        //Initialize the canvas
        
        cnvWidth = window.innerWidth - CNV_PADDING;
        cnvHeight = window.innerHeight - CNV_PADDING;
        canvas = document.getElementById("canvas");
        cnv = canvas.getContext("2d");
        canvas.width = cnvWidth;
        canvas.height = cnvHeight;
        cnvHalfDimen = new Vec2(cnvWidth / 2, cnvHeight / 2);

        //Set the callbacks
        window.addEventListener('resize', cb_windowResized);
    }
    //Update the renderer state
    initialized = true; 
}
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//r_core_render()                  
//called in g_startup.mjs in draw()
//renders the scene                
function r_core_render() {
    //render the scene


    r_core_fill('black'); //Set the background to space


    cnv.fillRect(0, 0, canvas.width, canvas.height); //Fill the background

    //Render the planets
    for (var p = 0; p < g_planets.length; p++) {
        g_planets[p].Draw();
    }
}
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//r_core_radGradient(start, end, inner, outer)                  
//returns a radial gradient based on the start and end positions and radii    
//start: start pos
//end: end pos
//inner: start radius
//outer: end radius        
function r_core_radGradient(start, end, inner, outer) {
    start = start.add(cnvHalfDimen);
    end = end.add(cnvHalfDimen);
    var gradient = cnv.createRadialGradient(start.x, start.y, inner, end.x, end.y, outer);
    return gradient;
}
//----------------------------------------------------------------------//



//----------------------------------------------------------------------//
//r_core_fill(style)
//sets the fillStyle of the canvas
function r_core_fill(style) {
    cnv.fillStyle = style;
}
//----------------------------------------------------------------------//

//----------------------------------------------------------------------//
//r_core_beginPath()
//runs cnv.beginPath()
function r_core_beginPath() {
    cnv.beginPath();
}
//----------------------------------------------------------------------//

//----------------------------------------------------------------------//
//r_core_arc(pos, rad, ang)
//runs cnv.arc
function r_core_arc(pos, rad, ang) {
    pos = pos.add(cnvHalfDimen);
    cnv.arc(pos.x, pos.y, rad, 0, ang);
}
//----------------------------------------------------------------------//

//----------------------------------------------------------------------//
//r_core_fillShape()
//fills the draw shape / path
function r_core_fillShape() {
    cnv.fill();
}
//----------------------------------------------------------------------//

//----------------------------------------------------------------------//
//Helper functions
//----------------------------------------------------------------------//



//----------------------------------------------------------------------//
//r_core_setHasCanvas(_hasCnv)                       
//called in g_core.mjs setState from g_startup.mjs  
//sets whether or not to initialize the canvas      
function r_core_setHasCnv(_hasCnv) {
    hasCnv = _hasCnv;
}
//----------------------------------------------------------------------//





//----------------------------------------------------------------------//
//Callback functions
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//windowResize()
//resizes the canvas to match the screen size
function cb_windowResized() {
    if (!initialized) return; //Only resize the canvas if the canvas exists

    //Calculate the new canvas dimensions
    cnvWidth = window.innerWidth - CNV_PADDING;
    cnvHeight = window.innerHeight - CNV_PADDING; 
    cnvHalfDimen = new Vec2(cnvWidth / 2, cnvHeight / 2);
    //Resize the canvas
    cnv.width = cnvWidth;
    cnv.height = cnvHeight;

}
//----------------------------------------------------------------------//


