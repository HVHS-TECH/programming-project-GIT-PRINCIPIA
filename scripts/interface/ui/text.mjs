//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Text class                                                            //
//Provides a text object (class) with the ability to handle multiple    //
//lines and rendering, as well as content updating                      //
//----------------------------------------------------------------------//

import { UIelement } from "@scripts/interface/ui/ui_element.mjs";
import { Renderer } from "@scripts/core/renderer.mjs";
import { Game } from "@scripts/core/game.mjs";
import { Vec2, clamp, lerp} from "@scripts/utility/miscellaneous.mjs";
import { Player } from "@scripts/core/player.mjs";
import { Time } from "@scripts/utility/time.mjs";
import { Input } from "@scripts/interface/input.mjs";


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