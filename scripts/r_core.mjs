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

//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//                            ---Imports---                             //
//----------------------------------------------------------------------//



//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//Variables and constants//

//Canvas
var cnv; //The canvas object
var canvas; //The canvas context
var cnvWidth; //The canvas width
var cnvHeight; //The canvas height

//Renderer state
var initialized = false;
var hasCnv = false;
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//Functions
//----------------------------------------------------------------------//



//----------------------------------------------------------------------//
//r_core_initialize()                    //
//called in g_startup.mjs on startup()   //
//initializes the renderer               //
function r_core_initialize() {
    if (hasCnv) {
        //Initialize the canvas
        cnvWidth = window.innerWidth;
        cnvHeight = window.innerHeight - 100; //-100 as a small padding
        canvas = document.getElementById("canvas");
        cnv = canvas.getContext("2d");
        cnv.width = cnvWidth;
        cnv.height = cnvHeight;

        //Set the callbacks
        window.addEventListener('resize', cb_windowResized);
    }
    //Update the renderer state
    initialized = true; 
}
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//r_core_render()                  //
//called in g_startup.mjs in draw()//
//renders the scene                //
function r_core_render() {
    //render the scene
    
}
//----------------------------------------------------------------------//








//----------------------------------------------------------------------//
//Helper functions
//----------------------------------------------------------------------//



//----------------------------------------------------------------------//
//r_core_setHasCanvas(_hasCnv)                       //
//called in g_core.mjs setState from g_startup.mjs  //
//sets whether or not to initialize the canvas      //
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
//resizes the framebuffer to match the screen aspect ration
function cb_windowResized() {
    if (!initialized) return; //Only resize the canvas and fbo if the fbo and canvas exist

    //Calculate the new canvas dimensions
    cnv_width = window.innerWidth;
    cnv_height = window.innerHeight - 100; //-100 as a small padding

    //Resize the canvas
    cnv.width = cnv_width;
    cnv.height = cnv_height;

}
//----------------------------------------------------------------------//


