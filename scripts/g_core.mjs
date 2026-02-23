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
    constructor(title, href, hasCnv, onLoad) {
        this.title = title; //Identifying title
        this.href = href;
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
    new Page("Astro Explorer - Index", "../index.html", false, 
        function(){
            g_core_setPage(HOME_TITLE);
        }
    ),


    new Page("Astro Explorer - Title Screen", "../html/start.html", false, 
        function(){

        }
    ),


    new Page("Astro Explorer", "../html/game.html", true, 
        function(){

        }
    ),


    new Page("Astro Explorer - End Screen", "../html/end.html", false, 
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
//g_core_setPage(title)                                      //
//sets the current page to the href of the page in PAGES with//
//the title title                                            //
function g_core_setPage(title) {
    var p = getPage(title);
    window.location.href = PAGES[p].href;
}
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//g_core_initializeState(title)     //
//title: the title of the page      //
//called in g_startup.mjs in setup()//
//sets the state based on title     //
function g_core_initializeState(title) {
    var p = getPage(title);
    PAGES[p].OnLoad();
    r_core_setHasCnv(PAGES[p].hasCnv);
}
//----------------------------------------------------------------------//

//----------------------------------------------------------------------//
//Helper functions
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//getPage(title)                               //
//Gets the index into PAGES pointer to the page//
//with the title title                         //
function getPage(title) {
    var p;
    for (p = 0; p < PAGES.length; p++) {
        if (PAGES[p].title == title) {
            break;
        }
    }
    return p;
}
//----------------------------------------------------------------------//





//----------------------------------------------------------------------//
//Callback functions
//----------------------------------------------------------------------//










