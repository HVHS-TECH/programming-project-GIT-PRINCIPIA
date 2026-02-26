//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//UI element classes                                                    //
//Acts as a way to add visuals, buttons, sliders, etc                   //
//----------------------------------------------------------------------//

import { Renderer } from "./renderer.mjs";
import { Game } from "./game.mjs";
import { Vec2 } from "./miscellaneous.mjs";

export class UIelement {
    constructor(pos, width, height) {
        this.pos = pos;
        this.width = width;
        this.height = height;
    }
    Draw() {

    }
    GetInput() {
        return 0;
    }
}


export class VertSlider extends UIelement {
    constructor(pos, width, height, background, fillColour, outlineColour, outlineWidth) {
        super(pos, width, height);
        this.background = background;
        this.fillColour = fillColour;
        this.outlineColour = outlineColour;
        this.outlineWidth = outlineWidth;
        this.value = 0;
    }
    Draw() {
        //----------------------------------------------------------------------//
        //Draw the background
        var tr = this.pos.add(new Vec2(this.width / 2, this.height / 2));
        var tl = this.pos.add(new Vec2(-this.width / 2, this.height / 2));
        var br = this.pos.add(new Vec2(this.width / 2, -this.height / 2));
        var bl = this.pos.add(new Vec2(-this.width / 2, -this.height / 2));

        

        var vertices = [tr, tl, bl, br];
        Game.renderer.fill(this.background);
        Game.renderer.rect(tl, br, true);
        Game.renderer.fillShape();
        //----------------------------------------------------------------------//


        //----------------------------------------------------------------------//
        //Draw the fill (slider)
        //Prefix f for fill
        //This.value is from 0 - 1, so we must scale it by this.height
        var ftr = this.pos.add(new Vec2(this.width / 2, -this.height / 2 + this.value * this.height));
        var ftl = this.pos.add(new Vec2(-this.width / 2, -this.height / 2 + this.value * this.height));
        var fbr = this.pos.add(new Vec2(this.width / 2, -this.height / 2));
        var fbl = this.pos.add(new Vec2(-this.width / 2, -this.height / 2));

        var fvertices = [ftr, ftl, fbr, fbl];
        Game.renderer.fill(this.fillColour);
        Game.renderer.rect(tl, br, true);
        Game.renderer.fillShape();
        //----------------------------------------------------------------------//
    }
    GetInput() {
        return this.value;
    }
}
