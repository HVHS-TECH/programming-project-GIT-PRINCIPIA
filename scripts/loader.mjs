//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Loader class                                                          //
//Manages loading planets, images and assets, etc                       //
//----------------------------------------------------------------------//
import { Planet } from "./planet.mjs"
import { Player } from "./player.mjs";
import { Vec2, Colour } from "./miscellaneous.mjs";
//Loader class, 
export class Loader {

    //----------------------------------------------------------------------//
    //LoadPlanets()
    //Returns a list of planet objects
    static LoadPlanets() {
        //Since js cannot list the files in a directory, we must store the paths in one file
        const PLANET_REFERENCES_JSON = Loader.GetJSONobject('../gamedata/planets/references.json'); 
        const PLANET_REFERENCES_JSON_LIST = PLANET_REFERENCES_JSON.planets;
        const STARTING_PLANET_NAME = PLANET_REFERENCES_JSON.starting_body;

        
        
        var ret = [];
        //Load all the planets from the planets list 'PLANET_REFERENCES_JSON_LIST'
        for (var i = 0; i < PLANET_REFERENCES_JSON_LIST.length; i++) {
            const JSON_OBJECT = Loader.GetJSONobject("../gamedata/planets/" + PLANET_REFERENCES_JSON_LIST[i]);
            const PLANET = Loader.JSONobjectToPlanet(JSON_OBJECT);
            ret.push(PLANET);
        }
        for (var i = 0; i < ret.length; i++) {
            if (ret[i].name == STARTING_PLANET_NAME) {
                Player.pos = ret[i].pos.add(new Vec2(0, ret[i].radius));
                Player.vel = ret[i].vel;
                console.log("Player starting position set to be on '" + STARTING_PLANET_NAME + "'");
            }
        }
        console.log("Loader.LoadPlanets: loaded planet array: ");
        console.dir(ret); //Debug
        return ret;
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //JSONobjectToPlanet(jsonObject)
    //Returns a planet generated from jsonObject
    static JSONobjectToPlanet(jsonObject) {
        return new Planet(
            jsonObject.name, 
            new Vec2(jsonObject.x, jsonObject.y), 
            new Vec2(jsonObject.xVel, jsonObject.yVel),
            jsonObject.mass,
            jsonObject.radius,
            jsonObject.atmoRadius,
            Colour.rgb(jsonObject.colour.r, jsonObject.colour.g, jsonObject.colour.b),
            Colour.rgb(jsonObject.innerColour.r, jsonObject.innerColour.g, jsonObject.innerColour.b),
            Colour.rgb(jsonObject.mantleColour.r, jsonObject.mantleColour.g, jsonObject.mantleColour.b),
            Colour.rgb(jsonObject.outerCoreColour.r, jsonObject.outerCoreColour.g, jsonObject.outerCoreColour.b),
            Colour.rgb(jsonObject.innerCoreColour.r, jsonObject.innerCoreColour.g, jsonObject.innerCoreColour.b),
            Colour.rgb(jsonObject.atmoColourLow.r, jsonObject.atmoColourLow.g, jsonObject.atmoColourLow.b),
            Colour.rgb(jsonObject.atmoColourMid.r, jsonObject.atmoColourMid.g, jsonObject.atmoColourMid.b)
        );
    }

    //----------------------------------------------------------------------//
    //GetJSONobject(path)
    //Returns the JSON object in the file at path
    static GetJSONobject(path) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', path, false); // false = synchronous
        xhr.send(null);
        const fileContents = xhr.responseText;

        return JSON.parse(fileContents);
    }
    //----------------------------------------------------------------------//
}

