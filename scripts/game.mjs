//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Game class                                                            //
//Handles game logic, controls other classes                            //
//----------------------------------------------------------------------//




import { Renderer } from "./renderer.mjs";
import { Planet } from "./g_core.mjs";
import { Page } from "./miscellaneous.mjs";
import { Player } from "./player.mjs";
export class Game {
    static renderer = new Renderer(); 

    static INDEX_TITLE = "Astro Explorer - Index";
    static HOME_TITLE = "Astro Explorer - Title Screen";
    static GAME_TITLE = "Astro Explorer";
    static END_TITLE = "Astro Explorer - End Screen";

    static PAGES = [
        new Page(INDEX_TITLE, "../index.html", false,
            function () {
                //Immediately redirect to the home page
                g_core_setPage(HOME_TITLE);
            }
        ),


        new Page(HOME_TITLE, "../html/start.html", false,
            function () {

            }
        ),


        new Page(GAME_TITLE, "../html/game.html", true,
            function () {

            }
        ),


        new Page(END_TITLE, "../html/end.html", false,
            function () {

            }
        )

    ];

    //Planets
    static PLANETS = [
        new Planet("Earth", new Vec2(0, 0), new Vec2(0, 0), 1000, 1250, 'rgb(150, 200, 50)', 'rgb(150, 75, 10)', 'rgb(200, 253, 255)', 'rgb(101, 128, 168)')
    ];


    static Start() {
        Player.pos = new Vec2(0, 1000);
        Player.vel = new Vec2(0, 0);
        Player.dir = 0;
        Player.ang_vel = 0;

        
        requestAnimationFrame(this.Update);
    }
    static Update() {
        for (var p = 0; p < PLANETS.length; p++) {
            PLANETS[p].Update();
        }
        Player.Update();
        this.renderer.Render();
        requestAnimationFrame(this.Update);
    }
    
    //----------------------------------------------------------------------//
    //setPage(title)                                      
    //sets the current page to the href of the page in PAGES with
    //the title title                                            
    setPage(title) {
        var p = this.getPage(title);
        window.location.href = this.PAGES[p].href;
    }
    //----------------------------------------------------------------------//
}





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
