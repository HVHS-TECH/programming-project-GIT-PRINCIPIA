//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Game class                                                            //
//Handles game logic, controls other classes                            //
//----------------------------------------------------------------------//




import { Renderer } from "./renderer.mjs";
import { Planet } from "./planet.mjs";
import { Page, Vec2, RefVar } from "./miscellaneous.mjs";

import { Player } from "./player.mjs";
import { Input } from "./input.mjs";
import { Navball, VertMeter } from "./ui_element.mjs";
import { Loader } from "./loader.mjs";

import { Particle } from "./particle.mjs";
export class Game {

    static INDEX_TITLE = "Astro Explorer - Index";
    static HOME_TITLE = "Astro Explorer - Title Screen";
    static GAME_TITLE = "Astro Explorer";
    static END_TITLE = "Astro Explorer - End Screen";
    //Planets
    static PLANETS = [];

    //The game renderer
    static renderer = new Renderer(); 

    
    //A list of the pages that make up the game. Each one has a title, a href, a 'hasCnv' boolean, and an onLoad() function
    static PAGES = [
        new Page(Game.INDEX_TITLE, "./index.html", false,
            function () {
                //Immediately redirect to the home page
                Game.setPage(Game.HOME_TITLE);
            }
        ),


        new Page(Game.HOME_TITLE, "./html/start.html", false,
            function () {

            }
        ),


        new Page(Game.GAME_TITLE, "./html/game.html", true,
            function () {

            }
        ),


        new Page(Game.END_TITLE, "./html/end.html", false,
            function () {

            }
        )

    ];


    //The UI elements that make up the screen
    static UI_ELEMENTS = [
        new VertMeter(new Vec2(80,0), 'left', 80, 700, 'rgb(0, 0, 0)', 'rgb(85, 255, 0)', 'rgb(0, 140, 255)', 5, "PlayerFuel"), //Fuel
        new VertMeter(new Vec2(-80,0), 'right', 80, 700, 'rgb(20, 68, 20)', 'rgb(255, 128, 0)', 'rgb(0, 140, 255)', 5, "PlayerHeat"),  //Heat
        new Navball(new Vec2(0, 140), 'bottom', 120, 'rgb(200, 200, 200)', 'rgb(50, 75, 100)', 'rgb(50, 150, 50)', 'rgb(100, 100, 100)', 5, "PlayerVel", "PlayerVelDir") //Navball

    ];

    //The particles that exist in the world
    static PARTICLES = [];

    //References to other variables for flexibility
    static REF_VARIABLES = [
        new RefVar(
            "PlayerFuel",
            function() { //Get
                return Player.fuel / Player.maxFuel;
            }
        ),
        new RefVar(
            "PlayerHeat",
            function() { //Get
                return 0.5; //Not implemented yet
            }
        ),
        new RefVar(
            "PlayerVel",
            function() { //Get
                var vel = Player.vel;
                var closest_planet = 0;
                var closest_planet_dist = 1000000000000;
                for (var p = 0; p < Game.PLANETS.length; p++) {
                    
                    var dist = Vec2.dist(Game.PLANETS[p].pos, Player.pos) - Game.PLANETS[p].radius;
                    if (dist < closest_planet_dist) {
                        closest_planet = p;
                        closest_planet_dist = dist;
                    }

                }
                vel = vel.sub(Game.PLANETS[closest_planet].vel);
                return vel.len(); 
            }
        ),
        new RefVar(
            "PlayerVelDir",
            function() { //Get
                var vel = Player.vel;
                var closest_planet = 0;
                var closest_planet_dist = 1000000000000;
                for (var p = 0; p < Game.PLANETS.length; p++) {
                    
                    var dist = Vec2.dist(Game.PLANETS[p].pos, Player.pos);
                    if (dist < closest_planet_dist) {
                        closest_planet = p;
                        closest_planet_dist = dist;
                    }

                }
                vel = vel.sub(Game.PLANETS[closest_planet].vel);
                return vel.dir();
            }
        )
    ];

     

    static G = 0.01; //Universal gravitational constant

    //----------------------------------------------------------------------//
    //Start()
    //called on page load
    static Start() {
        console.log("Game.Start");
        Player.pos = new Vec2(0, 750);
        Player.vel = new Vec2(-6.15, 0);
        Player.zoom = 1;
        Player.dir = 0;
        Player.ang_vel = 0;
        console.log("Game.Start(): initializing");

        Game.initializeState();
        Game.PLANETS = Loader.LoadPlanets();
        //Game.PLANETS = Loader.LoadPlanets();
        Input.Initialize();
        console.log("Game.Start(): initialized");
        requestAnimationFrame(Game.Update);
        
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //Update()
    //called every frame
    //manages game logic, then renders scene using renderer
    static Update() {
        console.log("Game.Update()");

        for (var p = 0; p < Game.PLANETS.length; p++) {
            Game.PLANETS[p].Update();
        }
        console.log("Game.Update() - planets done");

        for (var e = 0; e < Game.UI_ELEMENTS.length; e++) {
            Game.UI_ELEMENTS[e].Update();
        }
        console.log("Game.Update() - ui done");

        for (var i = 0; i < Game.PARTICLES.length; i++) {
            Game.PARTICLES[i].Update();
        }
        console.log("Game.Update() - particles done");

        Player.Update();
        console.log("Game.Update() - player done");

        Game.renderer.Render();
        console.log("Game.Update() - rendering done");

        requestAnimationFrame(Game.Update);
    }
    //----------------------------------------------------------------------//
    

    //----------------------------------------------------------------------//
    //setPage(title)                                      
    //sets the current page to the href of the page in PAGES with
    //the title 'title'                                            
    static setPage(title) {
        var p = Game.getPage(title);
        window.location.href = Game.PAGES[p].href;
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //initializeState(title)     
    //title: the title of the page      
    //sets the state based on 'title'   
    //defualts to current page title  
    static initializeState(title = document.title) {
        var p = Game.getPage(title);
        Game.PAGES[p].OnLoad();
        Game.renderer.hasCnv = Game.PAGES[p].hasCnv;
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //Helper functions
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //getPage(title)                               
    //Gets the index into PAGES pointer to the page
    //with the title 'title'                         
    //defualts to current page title               
    static getPage(title = document.title) {
        var p;
        for (p = 0; p < Game.PAGES.length; p++) {
            if (Game.PAGES[p].title == title) {
                break;
            }
        }
        return p;
    }
    //----------------------------------------------------------------------//


    
    //----------------------------------------------------------------------//
    //getRefVar(name)
    //returns the return value of the get method of the reference variable with the same name as 'name'
    static getRefVar(name) {
        var r;
        var res = -1;
        console.log("Game.getRefVar");
        for (r = 0; r < Game.REF_VARIABLES.length; r++) {
            if (Game.REF_VARIABLES[r].name == name) {
                res = r;
                break;
            } else {
                res = -1;//Track if there is no reference with that name
            } 
        }
        console.log("Game.getRefVar - done searching");
        if (res > -1) {
            return Game.REF_VARIABLES[r].get();
        } else {
            console.warn("Game.getRefVar: there is no variable with name '" + name + "'");
            return 0;
        }
        
    }
    //----------------------------------------------------------------------//

    
    
}





