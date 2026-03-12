//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//UI element class                                                      //
//A base class providing generic UI element functionaliy such as:       //
// - Alignment                                                          //
// - parenting                                                          //
// - base functions                                                     //
//----------------------------------------------------------------------//

import { UIelement } from "./ui_element.mjs";
import { Renderer } from "../../core/renderer.mjs";
import { Game } from "../../core/game.mjs";
import { Vec2, clamp, lerp} from "../../utility/miscellaneous.mjs";
import { Player } from "../../core/player.mjs";
import { Time } from "../../utility/time.mjs";
import { Input } from "../../interface/input.mjs";

export class UIelement {
    constructor(pos, align, width, height) {
        this.pos = pos;
        this.width = width;
        this.height = height;
        this.parent = null;

        this.alignLeft = align.includes('left');
        this.alignRight = align.includes('right');
        this.alignTop = align.includes('top');
        this.alignBottom = align.includes('bottom');
        this.alignCenter = align.includes('center');

        //this.alignment is multiplied by Game.renderer.scaleCnvSize / 2 before being added to this.pos
        //Game.renderer.scaleCnvSize is the size of the virtual canvas. Positions are divided by it, then multiplied by the canvas height.
        this.alignment = new Vec2(0,0);
        if (this.alignLeft) this.alignment.x = -1;
        if (this.alignRight) this.alignment.x = 1;
        if (this.alignTop) this.alignment.y = 1;
        if (this.alignBottom) this.alignment.y = -1;
        if (this.alignCenter) this.alignment = new Vec2(0,0);
    }
    Update() {

    }
    Draw() {

    }

    //Used for when the ui element returns an input value
    GetInput() {
        return 0;
    }

    //----------------------------------------------------------------------//
    //GetCenter(pos, alignment)
    //gets the center of the ui element based on the screen alignment and the position relative to that alignment
    //static version
    static GetCenter(pos, alignment) {
        var width = Game.renderer.cnvWidth;
        var height = Game.renderer.cnvHeight;
        
        var scaleCnvSize_half_vec2 = GetScaleSizeHalf(width, height);
        var alignment_mul_scaleCnvSize_half_vec2 = alignment.mul(scaleCnvSize_half_vec2);
        var center = alignment_mul_scaleCnvSize_half_vec2.add(pos); 
        return center;
    }
    
    //local version, relative to parent
    GetCenter() {
        var width = Game.renderer.cnvWidth;
        var height = Game.renderer.cnvHeight;
        var offset = new Vec2(0,0);
        if (this.parent != null) {
            width = this.parent.width;
            height = this.parent.height;
            offset = this.parent.GetCenter();
        }
        var scaleCnvSize_half_vec2 = GetScaleSizeHalf(width, height);
        var alignment_mul_scaleCnvSize_half_vec2 = this.alignment.mul(scaleCnvSize_half_vec2);
        var center = alignment_mul_scaleCnvSize_half_vec2.add(this.pos).add(offset); 
        return center;
    }
    //----------------------------------------------------------------------//
}


//----------------------------------------------------------------------//
//Helper functions                                                      //
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//GetScaleSizeHalf()
//When multiplied by an alignment vector (e.g [-1, 0] for left center), this produces coordinates that 
//will - after being transformed by Renderer.worldToCanvas()) - correspond to that side of the screen.
function GetScaleSizeHalf(width, height) {
    return new Vec2(
        //Multiply scaleCnvSize by the aspect ratio
        width / height * Game.renderer.scaleCnvSize / Game.renderer.cnvWidth * width, 

        //Y is just scaleCnvSize
        Game.renderer.scaleCnvSize / Game.renderer.cnvHeight * height)

        //Divide by two to get the half size
        .div(new Vec2(2,2));
}
//----------------------------------------------------------------------//


