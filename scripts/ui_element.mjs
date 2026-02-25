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
        var tr = this.pos.add(new Vec2(width / 2, height / 2));
        var tl = this.pos.add(new Vec2(-width / 2, height / 2));
        var br = this.pos.add(new Vec2(width / 2, -height / 2));
        var bl = this.pos.add(new Vec2(-width / 2, -height / 2));

        var vertices = [tr, tl, br, bl];
        Game.renderer.fill(background);
        Game.renderer.drawPolygon(vertices);
    }
    GetInput() {
        return this.value;
    }
}
