//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Loader class                                                          //
//Manages loading planets, images and assets, etc                       //
//----------------------------------------------------------------------//
import { Planet, Mountain, Ocean } from "./planet.mjs"
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
        //Mountains array
        const MOUNTAINS = [];

        //Loop through all JSON mountains, convert to mountain class, add to MOUNTAINS array
        for (var i = 0; i < jsonObject.features.mountains.length; i++) {
            const MOUNTAIN = new Mountain(jsonObject.features.mountains[i].rad, jsonObject.features.mountains[i].width, jsonObject.features.mountains[i].height);
            MOUNTAINS.push(MOUNTAIN);
        }

        //Oceans array
        const OCEANS = [];

        //Loop through all JSON oceans, convert to ocean class, add to OCEANS array
        for (var i = 0; i < jsonObject.features.oceans.length; i++) {
            const OCEAN = new Ocean(jsonObject.features.oceans[i].chunk, jsonObject.features.oceans[i].depth);
            OCEANS.push(OCEAN);
        }
        return new Planet(
            jsonObject.data.name,  //Name
            new Vec2(jsonObject.data.x, jsonObject.data.y),  //Position
            new Vec2(jsonObject.data.xVel, jsonObject.data.yVel), //Velocity
            jsonObject.data.mass, //Mass
            jsonObject.data.radius, //Radius
            jsonObject.data.atmoRadius, //Atmosphere radius from planet center
            Colour.rgb(jsonObject.colour.colour.r, jsonObject.colour.colour.g, jsonObject.colour.colour.b), //Ground colour
            Colour.rgb(jsonObject.colour.innerColour.r, jsonObject.colour.innerColour.g, jsonObject.colour.innerColour.b), //Dirt colour
            Colour.rgb(jsonObject.colour.mantleColour.r, jsonObject.colour.mantleColour.g, jsonObject.colour.mantleColour.b), //Mantle colour
            Colour.rgb(jsonObject.colour.outerCoreColour.r, jsonObject.colour.outerCoreColour.g, jsonObject.colour.outerCoreColour.b), //Outer core colour
            Colour.rgb(jsonObject.colour.innerCoreColour.r, jsonObject.colour.innerCoreColour.g, jsonObject.colour.innerCoreColour.b), //Inner core colour
            Colour.rgb(jsonObject.colour.atmoColourLow.r, jsonObject.colour.atmoColourLow.g, jsonObject.colour.atmoColourLow.b), //Atmosphere colour low
            Colour.rgb(jsonObject.colour.atmoColourMid.r, jsonObject.colour.atmoColourMid.g, jsonObject.colour.atmoColourMid.b), //Atmosphere colour mid
            Colour.rgb(jsonObject.colour.mountainColour.r, jsonObject.colour.mountainColour.g, jsonObject.colour.mountainColour.b), //Mountain colour
            Colour.rgb(jsonObject.colour.snowColour.r, jsonObject.colour.snowColour.g, jsonObject.colour.snowColour.b), //Snow colour
            MOUNTAINS,
            Colour.rgb(jsonObject.colour.oceanColourShallow.r, jsonObject.colour.oceanColourShallow.g, jsonObject.colour.oceanColourShallow.b),
            Colour.rgb(jsonObject.colour.oceanColourDeep.r, jsonObject.colour.oceanColourDeep.g, jsonObject.colour.oceanColourDeep.b),
            OCEANS
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

