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
import { Player } from "./player.mjs";

export class UIelement {
    constructor(pos, align, width, height) {
        this.pos = pos;
        this.width = width;
        this.height = height;


        this.alignLeft = align.includes('left');
        this.alignRight = align.includes('right');
        this.alignTop = align.includes('top');
        this.alignBottom = align.includes('bottom');

        //this.alignment is multiplied by Game.renderer.scaleCnvSize / 2 before being added to this.pos
        //Game.renderer.scaleCnvSize is the size of the virtual canvas. Positions are divided by it, then multiplied by the canvas height.
        this.alignment = new Vec2(0,0);
        if (this.alignLeft) this.alignment.x = -1;
        if (this.alignRight) this.alignment.x = 1;
        if (this.alignTop) this.alignment.y = 1;
        if (this.alignBottom) this.alignment.y = -1;
    }
    Update() {

    }
    Draw() {

    }
    GetInput() {
        return 0;
    }
}

//Vertical meter / guage
export class VertMeter extends UIelement {
    constructor(pos, align, width, height, background, fillColour, outlineColour, outlineWidth, valueRefVarName) {
        super(pos, align, width, height);
        


        this.background = background; //BG colour
        this.fillColour = fillColour;
        this.outlineColour = outlineColour;
        this.outlineWidth = outlineWidth;
        this.valueRefVarName = valueRefVarName;
        this.value = 0;//Since this constructor is called in game, we cannot access game in this constructor
    }
    Update() {
        this.value = Game.getRefVar(this.valueRefVarName);
    }
    Draw() {
        //----------------------------------------------------------------------//
        //Draw the background
        //-cnvWidth / 2 --------------------- -scaleCnvSize / 2 ------------------ center ------------------- scaleCnvSize / 2 ---------------------- cnvWidth / 2//
        
        var scaleCnvSize_half_vec2 = GetScaleCnvSizeHalf();
        var tl = this.alignment.mul(scaleCnvSize_half_vec2).add(
                this.pos.add(new Vec2(-this.width / 2, this.height / 2)));
        var br = this.alignment.mul(scaleCnvSize_half_vec2).add(
                this.pos.add(new Vec2(this.width / 2, -this.height / 2)));

        
        Game.renderer.stroke(this.outlineColour, this.outlineWidth);
        Game.renderer.fill(this.background);
        Game.renderer.rect(tl, br, true);
        Game.renderer.fillShape();
        Game.renderer.strokeShape();
        //----------------------------------------------------------------------//


        //----------------------------------------------------------------------//
        //Draw the fill (slider)
        //This.value is from 0 - 1, so we must scale it by this.height
        //Give space for outline
        var fill_tl = this.alignment.mul(scaleCnvSize_half_vec2).add(
            this.pos.add(new Vec2(-this.width / 2 + this.outlineWidth / 2, -this.height / 2 + this.outlineWidth / 2 + this.value * (this.height - this.outlineWidth))));
        var fill_br = this.alignment.mul(scaleCnvSize_half_vec2).add(
            this.pos.add(new Vec2(this.width / 2 - this.outlineWidth / 2, -this.height / 2 + this.outlineWidth / 2)));

        Game.renderer.fill(this.fillColour);
        Game.renderer.rect(fill_tl, fill_br, true);
        Game.renderer.fillShape();

        var divider_tl = this.alignment.mul(scaleCnvSize_half_vec2).add(
            this.pos.add(new Vec2(-this.width / 2 + this.outlineWidth / 2, -this.height / 2 + this.outlineWidth / 2 + this.value * (this.height - this.outlineWidth) + 5)));
        var divider_br = this.alignment.mul(scaleCnvSize_half_vec2).add(
            this.pos.add(new Vec2(this.width / 2 - this.outlineWidth / 2, -this.height / 2 + this.outlineWidth / 2 + this.value * (this.height - this.outlineWidth) - 5)));

        Game.renderer.fill("black");
        Game.renderer.rect(divider_tl, divider_br, true);
        Game.renderer.fillShape();
        //----------------------------------------------------------------------//
    }
    GetInput() {
        return this.value;
    }
}

//Navball, displays a copy of the 
export class Navball extends UIelement {
    constructor(pos, align, diameter, playerColour, backgroundColour, outlineColour, outlineWidth) {
        super(pos, align, diameter, diameter);
        this.diameter = diameter;
        this.playerColour = playerColour;
        this.backgroundColour = backgroundColour;
        this.outlineColour = outlineColour;
        this.outlineWidth = outlineWidth;
    }
    Update() {

    }
    Draw() {

    }
}



//----------------------------------------------------------------------//
//Helper functions                                                      //
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//GetScaleCnvSizeHalf()
//When multiplied by an alignment vector (e.g [-1, 0] for left center), this produces coordinates that 
//will - after being transformed by Renderer.worldToCanvas()) - correspond to that side of the screen.
function GetScaleCnvSizeHalf() {
    return new Vec2((Game.renderer.cnvWidth / Game.renderer.cnvHeight) * Game.renderer.scaleCnvSize / 2, Game.renderer.scaleCnvSize / 2);
}
//----------------------------------------------------------------------//