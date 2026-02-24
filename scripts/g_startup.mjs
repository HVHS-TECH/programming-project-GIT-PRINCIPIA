//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Game startup script:                                                  //
//Starts the game based on which page is active                         //
//----------------------------------------------------------------------//



//----------------------------------------------------------------------//
//                            ---Exports---                             //
//----------------------------------------------------------------------//



//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//                            ---Imports---                             //
//----------------------------------------------------------------------//

import {g_core_update} from './g_core.mjs';
import {g_core_initialize} from './g_core.mjs';
import {g_core_initializeState} from './g_core.mjs';

import {r_core_initialize} from './r_core.mjs';
import {r_core_render} from './r_core.mjs';


//----------------------------------------------------------------------//

//Start the game loop
setup();
requestAnimationFrame(draw);

//----------------------------------------------------------------------//
//Functions
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//setup()              //
//called on script load//
//---------------------//
function setup() {
    let loc = document.title;
    console.log("Title: " + loc);
    
    g_core_initializeState(loc); //Reads the loc variable and sets the state accordingly (canvas, no canvas, start, end, game, etc)
    
    //If loc is the index page, this will not run as the page will be changed to the start page in g_core.mjs setState
    g_core_initialize(); //Initialize the game state
    r_core_initialize(); //Initialize the renderer state
    
}
//----------------------------------------------------------------------//



//----------------------------------------------------------------------//
//draw()            //
//called every frame//
//------------------//
function draw() {
    g_core_update(); //Perform update logic
    r_core_render(); //Render the scene
    requestAnimationFrame(draw);
}
//----------------------------------------------------------------------//



//----------------------------------------------------------------------//
//Helper functions
//----------------------------------------------------------------------//








//----------------------------------------------------------------------//
//Callback functions
//----------------------------------------------------------------------//