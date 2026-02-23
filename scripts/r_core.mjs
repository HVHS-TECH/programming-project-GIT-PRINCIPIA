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

//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//                            ---Imports---                             //
//----------------------------------------------------------------------//



//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//Variables and constants//

//Canvas
var cnv; //The canvas object
var cnv_width; //The canvas width
var cnv_height; //The canvas height

//Framebuffer
var fbo; //The framebuffer object
var fbo_width; //The framebuffer width
var fbo_height; //The framebuffer height
const FBO_SCALE = 2000; //The scale of the framebuffer. Only the height of the fbo changes on window resize, not the width. This width is instead set to FBO_SCALE

//Renderer state
var initialized = false;
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//Functions
//----------------------------------------------------------------------//



//----------------------------------------------------------------------//
//r_core_initialize()                    //
//called in g_startup.mjs on p5 startup()//
//manages update logic                   //
function r_core_initialize() {
    //Initialize the canvas
    cnv_width = windowWidth;
    cnv_height = windowHeight - 100; //-100 as a small padding
    cnv = createCanvas(cnv_width, cnv_height, WEBGL);

    //Initialize the framebuffer
    fbo_width = FBO_SCALE;
    fbo_height = FBO_SCALE * cnv_height / cnv_width;
    fbo = createFramebuffer();
    fbo.resize(fbo_width, fbo_height);

    //Update the renderer state
    initialized = true; 
}
//----------------------------------------------------------------------//











//----------------------------------------------------------------------//
//Helper functions
//----------------------------------------------------------------------//








//----------------------------------------------------------------------//
//Callback functions
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//windowResize()
//resizes the canvas to match the screen size
//resizes the framebuffer to match the screen aspect ration
function windowResized() {
    if (!initialized) return; //Only resize the canvas and fbo if the fbo and canvas exist

    //Calculate the new canvas dimensions
    cnv_width = windowWidth;
    cnv_height = windowHeight;

    //Resize the canvas
    cnv.resize(cnv_width, cnv_height);

    //Calculate the new fbo dimensions
    fbo_height = FBO_SCALE * cnv_height / cnv_width;
    fbo.resize(fbo_width, fbo_height);
}
//----------------------------------------------------------------------//


