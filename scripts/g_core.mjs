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
export {Vec2}
export {Planet}
export {Player}
export {g_planets}


//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//                            ---Imports---                             //
//----------------------------------------------------------------------//

import {r_core_setHasCnv} from "./r_core.mjs";
import {r_core_radGradient} from "./r_core.mjs";
import {r_core_fill} from "./r_core.mjs";
import {r_core_fillShape} from "./r_core.mjs";
import {r_core_beginPath} from "./r_core.mjs";
import {r_core_arc} from "./r_core.mjs";

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
    OnLoad(){}
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
        return new Vec2(this.x + other.x, this.y + other.y);
    }
    sub(other) {
        return new Vec2(this.x - other.x, this.y - other.y);
    }
    mul(other) {
        return new Vec2(this.x * other.x, this.y * other.y);
    }
    div(other) {
        return new Vec2(this.x / other.x, this.y / other.y);
    }
}

//Dot product of two Vec2-s
function dot(a, b) {
    return a.x * b.x + a.y * b.y;
}
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//Planet class
class Planet {
    
    constructor(name, pos, vel, radius, atmoRadius, colour, innerColour, atmoColourLow, atmoColourMid, atmoColourHigh) {
        this.name = name;
        this.pos = pos;
        this.vel = vel;
        this.radius = radius;
        this.atmoRadius = atmoRadius;
        this.colour = colour;
        this.innerColour = innerColour;
        this.atmoColourLow = atmoColourLow;
        this.atmoColourMid = atmoColourMid;
        this.atmoColourHigh = atmoColourHigh;
    }
    Update() {
        //Do orbital physics
    }
    Draw() {
        //Draw planet
        var relPos = this.pos.add(player_pos);
        
        var atmoGrad = r_core_radGradient(relPos, relPos, this.radius, this.atmoRadius);

        
        atmoGrad.addColorStop(0, this.atmoColourLow);
        atmoGrad.addColorStop(0.33, this.atmoColourMid);
        atmoGrad.addColorStop(0.66, this.atmoColourHigh);
        atmoGrad.addColorStop(1, 'black');

        r_core_fill(atmoGrad);
        r_core_beginPath();
        r_core_arc(relPos, this.atmoRadius, Math.PI * 2);
        r_core_fillShape();


        var groundGrad = r_core_radGradient(relPos, relPos, 0, this.radius);

        groundGrad.addColorStop(0.75, 'black');
        groundGrad.addColorStop(0.98, this.innerColour);
        groundGrad.addColorStop(0.99, this.colour);
        groundGrad.addColorStop(1, this.colour);

        r_core_fill(groundGrad);
        r_core_beginPath();
        r_core_arc(relPos, this.radius, Math.PI * 2);
        r_core_fillShape();

        
    }
}
//----------------------------------------------------------------------//

//----------------------------------------------------------------------//
//Player class
class Player {
    static pos = new Vec2(0, 1000);
    static vel = new Vec2(0, 0);
    static dir = 0;
    static ang_vel = 0;
    static Update() {

    }
    static Draw() {
        
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
var g_planets = [
    new Planet("Earth", new Vec2(0, 0), new Vec2(0, 0), 1000, 1100, 'rgb(150, 200, 50)', 'rgb(150, 75, 10)', 'rgb(200, 253, 255)', 'rgb(115, 151, 206)', 'rgb(17, 23, 40)')
];





//----------------------------------------------------------------------//
//Functions
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//g_core_initialize()                   
//called in g_startup.mjs during setup()
//initializes the game state            
function g_core_initialize() {
    Player.pos = new Vec2(0, 1000);
    Player.vel = new Vec2(0, 0);
    Player.dir = 0;
    Player.ang_vel = 0;
}
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//g_core_update()                    
//called in g_startup.mjs every frame
//manages update logic               
function g_core_update() {

    //Update planets
    for (var p = 0; p < g_planets.length; p++) {
        g_planets[p].Update();
    }
}
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//g_core_setPage(title)                                      
//sets the current page to the href of the page in PAGES with
//the title title                                            
function g_core_setPage(title) {
    var p = getPage(title);
    window.location.href = PAGES[p].href;
}
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//g_core_initializeState(title)     
//title: the title of the page      
//called in g_startup.mjs in setup()
//sets the state based on title     
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
//getPage(title)                               
//Gets the index into PAGES pointer to the page
//with the title title                         
//defualts to current page title               
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










