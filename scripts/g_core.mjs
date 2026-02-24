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



//----------------------------------------------------------------------//
//Vector 2
class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(other) {
        this.x += other.x;
        this.y += other.y;
    }
    sub(other) {
        this.x -= other.x;
        this.y -= other.y;
    }
    mul(other) {
        this.x *= other.x;
        this.y *= other.y;
    }
    div(other) {
        this.x /= other.x;
        this.y /= other.y;
    }
}
function dot(a, b) {
    return a.x * b.x + a.y * b.y;
}
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//Planet class
class Planet {
    constructor(name, pos, vel, radius, atmo_radius, colour, atmo_colour_low, atmo_colour_mid, atmo_colour_high) {
        this.name = name;
        this.pos = pos;
        this.vel = vel;
        this.radius = radius;
        this.atmo_radius = atmo_radius;
        this.colour = colour;
        this.atmo_colour_low = atmo_colour_low;
        this.atmo_colour_mid = atmo_colour_mid;
        this.atmo_colour_high = atmo_colour_high;
    }
    Update() {
        //Do orbital physics
    }
    Draw() {
        //Draw planet
    }
}
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//Variables
//----------------------------------------------------------------------//

//Pages

const INDEX_TITLE = "Astro Explorer - Index";
const HOME_TITLE = "Astro Explorer - Title Screen";
const GAME_TITLE = "Astro Explorer";
const END_TITLE = "Astro Explorer - End Screen";

const PAGES = [
    new Page(INDEX_TITLE, "../index.html", false, 
        function(){
            //Immediately redirect to the home page
            g_core_setPage(HOME_TITLE);
        }
    ),


    new Page(HOME_TITLE, "../html/start.html", false, 
        function(){

        }
    ),


    new Page(GAME_TITLE, "../html/game.html", true, 
        function(){

        }
    ),


    new Page(END_TITLE, "../html/end.html", false, 
        function(){

        }
    )

];

//Planets
var planets = [
    new Planet("Earth", 0, 0, )
];


//Player
var player_x; 
var player_y;
var player_vel_x;
var player_vel_y;
var player_dir; //Direction
var player_ang_vel; //Angular velocity, used for smooth rotation



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
//defualts to current page title               //
function getPage(title = document.title) {
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










