//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Game core script:                                                     //
//Manages the game loop and core game functions                         //
//----------------------------------------------------------------------//



//----------------------------------------------------------------------//
//                            ---Exports---                             //
//----------------------------------------------------------------------//

export {g_core_update}
export {g_core_initialize}
export {g_core_initializeState}

//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//                            ---Imports---                             //
//----------------------------------------------------------------------//

import {r_core_setHasCnv} from "./r_core.mjs";

//----------------------------------------------------------------------//



//----------------------------------------------------------------------//
//Classes
//----------------------------------------------------------------------//

//Page class
class Page {
    constructor(title, hasCnv, onLoad) {
        this.title = title; //Identifying title
        this.hasCnv = hasCnv; //For r_core_setHasCnv
        this.OnLoad = onLoad; //Called on page load
    }
    //Called when the page loads
    OnLoad() {

    }
}

//----------------------------------------------------------------------//
//Variables
//----------------------------------------------------------------------//

//Pages
var pageNum = 0; //Index into the pages array

const PAGES = [
    new Page("Astro Explorer - Index", false, 
        function(){
            g_core_setPage(HOME_TITLE);
        }
    ),


    new Page("Astro Explorer - Title Screen", false, 
        function(){

        }
    ),


    new Page("Astro Explorer", true, 
        function(){

        }
    ),


    new Page("Astro Explorer - End Screen", false, 
        function(){

        }
    )

];

const INDEX_TITLE = "Astro Explorer - Index";
const HOME_TITLE = "Astro Explorer - Title Screen";
const GAME_TITLE = "Astro Explorer";
const END_TITLE = "Astro Explorer - End Screen";

//----------------------------------------------------------------------//
//Functions
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//g_core_initialize()                   //
//called in g_startup.mjs during setup()//
//initializes the game state            //
function g_core_initialize() {

}
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//g_core_update()                    //
//called in g_startup.mjs every frame//
//manages update logic               //
function g_core_update() {

}
//----------------------------------------------------------------------//

//----------------------------------------------------------------------//
//g_core_setPage(loc)  //
//sets the current page//
function g_core_setPage(loc) {
    window.location.href = loc;
}
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//g_core_initializeState(title)     //
//title: the title of the page      //
//called in g_startup.mjs in setup()//
//sets the state based on title     //
function g_core_initializeState(title) {
    var p;
    for (p = 0; p < PAGES.length; p++) {
        if (PAGES[p].title == title) {
            break;
        }
    }
    PAGES[p].OnLoad();
    r_core_setHasCnv(PAGES[p].hasCnv);
}
//----------------------------------------------------------------------//

//----------------------------------------------------------------------//
//Helper functions
//----------------------------------------------------------------------//








//----------------------------------------------------------------------//
//Callback functions
//----------------------------------------------------------------------//










