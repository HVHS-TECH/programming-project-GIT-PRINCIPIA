//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Game class                                                            //
//Handles game logic, controls other classes                            //
//----------------------------------------------------------------------//




import { Renderer } from "./renderer.mjs";
import { Planet } from "./planet.mjs";
import { Page, Vec2 } from "./miscellaneous.mjs";

import { Player } from "./player.mjs";
import { Input } from "./input.mjs";
export class Game {
    
    //Planets
    static PLANETS = [
        new Planet(
            "Earth", //Name
            new Vec2(0, 0), //pos
            new Vec2(0, 0), //vel
            100000, //mass
            500, //radius
            750, //atmo radius
            'rgb(150, 200, 50)', 'rgb(150, 75, 10)', //ground colours
            'rgb(200, 253, 255)', 'rgb(101, 128, 168)' //atmo colours
        ),
        new Planet(
            "Moon", //Name
            new Vec2(0, 2000), //pos
            new Vec2(-0.5, 0), //vel
            1000, //mass
            100, //radius
            130, //atmo radius
            'rgb(102, 107, 107)', 'rgb(32, 32, 32)', //ground colours
            'rgb(49, 49, 49)', 'rgb(7, 7, 7)' //atmo colours
        )
    ];
    static renderer = new Renderer(); 

    static INDEX_TITLE = "Astro Explorer - Index";
    static HOME_TITLE = "Astro Explorer - Title Screen";
    static GAME_TITLE = "Astro Explorer";
    static END_TITLE = "Astro Explorer - End Screen";

    static PAGES = [
        new Page(Game.INDEX_TITLE, "../index.html", false,
            function () {
                //Immediately redirect to the home page
                Game.setPage(Game.HOME_TITLE);
            }
        ),


        new Page(Game.HOME_TITLE, "../html/start.html", false,
            function () {

            }
        ),


        new Page(Game.GAME_TITLE, "../html/game.html", true,
            function () {

            }
        ),


        new Page(Game.END_TITLE, "../html/end.html", false,
            function () {

            }
        )

    ];
    static G = 0.01; //Gravitational constant

    static Start() {
        Player.pos = new Vec2(0, 750);
        Player.vel = new Vec2(-1.15, 0);
        Player.zoom = 1;
        Player.dir = 0;
        Player.ang_vel = 0;

        Game.initializeState();
        Input.Initialize();
        requestAnimationFrame(Game.Update);
    }
    static Update() {
        for (var p = 0; p < Game.PLANETS.length; p++) {
            Game.PLANETS[p].Update();
        }
        Player.Update();
        Game.renderer.Render();
        requestAnimationFrame(Game.Update);
    }
    
    //----------------------------------------------------------------------//
    //setPage(title)                                      
    //sets the current page to the href of the page in PAGES with
    //the title title                                            
    static setPage(title) {
        var p = Game.getPage(title);
        window.location.href = Game.PAGES[p].href;
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //initializeState(title)     
    //title: the title of the page      
    //sets the state based on title     
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
    //with the title title                         
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


    

    
}





