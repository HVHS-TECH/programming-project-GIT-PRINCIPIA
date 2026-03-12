//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Text class                                                            //
//Provides a text object (class) with the ability to handle multiple    //
//lines and rendering, as well as content updating                      //
//----------------------------------------------------------------------//

import { UIelement } from "./ui_element.mjs";
import { Renderer } from "../../core/renderer.mjs";
import { Game } from "../../core/game.mjs";
import { Vec2, clamp, lerp} from "../../utility/miscellaneous.mjs";
import { Player } from "../../core/player.mjs";
import { Time } from "../../utility/time.mjs";
import { Input } from "../../interface/input.mjs";


//----------------------------------------------------------------------//
//text object
export class Text extends UIelement {
    constructor(pos, align, width, height, fontColour, fontSize, font, textAlignX, textAlignY, contentsRef) {
        super(pos, align, width, height);
        this.fontColour = fontColour;
        this.fontSize = fontSize;
        this.font = font;
        this.textAlignX = textAlignX;
        this.textAlignY = textAlignY;
        this.contentsRef = contentsRef;
        this.contents = "";
        this.textArray = [];
    }
    Update() {
        this.contents = Game.getRefVar(this.contentsRef);
        this.textArray = this.contents.split('\n'); //Split the text into individual lines

    }
    Draw() {
        var center = this.GetCenter();
        //Game.renderer.cnv.font = this.fontSize + "px " + this.font;
        Game.renderer.fill(this.fontColour);
        Game.renderer.text(this.contents, this.textAlignX, this.textAlignY, this.fontSize, this.font, center, false, true);
        
    }
}
//----------------------------------------------------------------------//