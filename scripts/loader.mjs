//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Loader class                                                          //
//Manages loading planets, images and assets, etc                       //
//----------------------------------------------------------------------//
import { Planet } from "./planet.mjs"
import { Vec2 } from "./miscellaneous.mjs";
var getJSONobject_result; //Used for the callback in GetJSONobject()
export class Loader {

    //----------------------------------------------------------------------//
    //LoadPlanets()
    //Returns a list of planet objects
    static LoadPlanets() {
        const jsonObject = Loader.GetJSONobject('../gamedata/planets/earth.json');
        var ret = [Loader.JSONobjectToPlanet(jsonObject)];
        console.dir(ret); //Debug
        return ret;
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //JSONobjectToPlanet(jsonObject)
    static JSONobjectToPlanet(jsonObject) {
        return new Planet(
            jsonObject.name, 
            new Vec2(jsonObject.x, jsonObject.y), 
            new Vec2(jsonObject.xVel, jsonObject.yVel),
            jsonObject.mass,
            jsonObject.radius,
            jsonObject.atmoRadius,
            jsonObject.colour,
            jsonObject.innerColour,
            jsonObject.atmoColourLow,
            jsonObject.atmoColourMid
        );
    }

    //----------------------------------------------------------------------//
    //GetJSONobject(path)
    //Returns the JSON object in the file at path
    static GetJSONobject(path) {

        return null;//Needs implementation - asynchronous or synchronous???
    }
    //----------------------------------------------------------------------//
}

