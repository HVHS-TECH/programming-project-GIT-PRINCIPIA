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
        var alignment_mul_scaleCnvSize_half_vec2 = this.alignment.mul(scaleCnvSize_half_vec2);
        var center = alignment_mul_scaleCnvSize_half_vec2.add(this.pos); 


        var tl = center.add(new Vec2(-this.width / 2, this.height / 2));
        var br = center.add(new Vec2(this.width / 2, -this.height / 2));

        
        Game.renderer.stroke(this.outlineColour, this.outlineWidth);
        Game.renderer.fill(this.background);
        Game.renderer.rect(tl, br, false, true);
        Game.renderer.fillShape();
        Game.renderer.strokeShape();
        //----------------------------------------------------------------------//


        //----------------------------------------------------------------------//
        //Draw the fill (slider)
        //This.value is from 0 - 1, so we must scale it by this.height
        //Give space for outline
        var fill_tl = center.add(new Vec2(-this.width / 2 + this.outlineWidth / 2, -this.height / 2 + this.outlineWidth / 2 + this.value * (this.height - this.outlineWidth)));
        var fill_br = center.add(new Vec2(this.width / 2 - this.outlineWidth / 2, -this.height / 2 + this.outlineWidth / 2));

        Game.renderer.fill(this.fillColour);
        Game.renderer.rect(fill_tl, fill_br, false, true);
        Game.renderer.fillShape();

        var divider_tl = center.add(new Vec2(-this.width / 2 + this.outlineWidth / 2, -this.height / 2 + this.outlineWidth / 2 + this.value * (this.height - this.outlineWidth) + 5));
        var divider_br = center.add(new Vec2(this.width / 2 - this.outlineWidth / 2, -this.height / 2 + this.outlineWidth / 2 + this.value * (this.height - this.outlineWidth) - 5));

        Game.renderer.fill("black");
        Game.renderer.rect(divider_tl, divider_br, false, true);
        Game.renderer.fillShape();
        //----------------------------------------------------------------------//
    }
    GetInput() {
        return this.value;
    }
}

//Navball, displays a copy of the 
export class Navball extends UIelement {
    constructor(pos, align, radius, playerColour, backgroundColour, textColour, outlineColour, outlineWidth, velRefName, velDirRefName) {
        super(pos, align, radius * 2, radius * 2);
        this.radius = radius;
        this.playerColour = playerColour;
        this.backgroundColour = backgroundColour;
        this.textColour = textColour;
        this.outlineColour = outlineColour;
        this.outlineWidth = outlineWidth;
        this.vel = 0;
        this.velDir = 0;
        this.playerScale = 10;
        this.playerVelScale = this.radius;
        this.velDirRefName = velDirRefName;
        this.velRefName = velRefName;
    }
    Update() {
        this.vel = Game.getRefVar(this.velRefName);
        this.velDir = Game.getRefVar(this.velDirRefName);
    }
    
    Draw() {
        var scaleCnvSize_half_vec2 = GetScaleCnvSizeHalf();
        var alignment_mul_scaleCnvSize_half_vec2 = this.alignment.mul(scaleCnvSize_half_vec2);
        var center = alignment_mul_scaleCnvSize_half_vec2.add(this.pos); 



        //----------------------------------------------------------------------//
        //Draw the background
        Game.renderer.fill(this.backgroundColour);
        Game.renderer.beginPath();
        Game.renderer.arc(center, this.radius, Math.PI * 2, false, true);
        Game.renderer.closePath();
        Game.renderer.fillShape();
        //----------------------------------------------------------------------//

        //----------------------------------------------------------------------//
        //Draw the velocity lines (like wind)
        
        const NUM_LINES = 20;
        
        function rotatePoint(p, angle) {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            var px = p.x * cos - p.y * sin;
            var py = p.x * sin + p.y * cos;
            p.x = px;
            p.y = py;
            return p;
        }
        const SPACING = 50; //Spacing between wind streaks
        const SIZE = 50; //Length of wind streaks
        const LENGTH = Math.ceil(this.radius / (SPACING + SIZE) * 10); //Length of array
        var lineDashArray = [];
        for (var i = 0; i < LENGTH; i++) {
            lineDashArray.push(SIZE);
            lineDashArray.push(SPACING);
        }
        for (var l = -this.radius; l <= this.radius; l += this.radius * 2 / NUM_LINES) {


            const widthHalf = Math.sqrt(this.radius * this.radius - l * l);
            var p1 = new Vec2(-widthHalf, l);
            var p2 = new Vec2(widthHalf, l);

            //Rotate p1 and p2 by slope around center
            p1 = rotatePoint(p1, -this.velDir + Math.PI / 2);
            p2 = rotatePoint(p2, -this.velDir + Math.PI / 2);

            p1 = p1.add(center);
            p2 = p2.add(center);
            const SPEED = 1000;
            //(SIZE + SPACING) * LENGTH + (new Date().getTime() % (5000)) * 10
            const TIME = new Date().getTime();
            var lineDashArrayStart = [ Math.min(Math.max(

                    ((TIME * SIZE / SPACING + SPEED) % (SPEED + SPEED * SIZE / SPACING)) / (SPEED) * (SPACING)

                , 0), SIZE),  Math.min(Math.max(
                    
                    ((TIME) % (SPEED + SPEED * SPACING / SIZE)) / (SPEED) * (SIZE)

                , 0), SPACING)];
            lineDashArrayStart.push(...lineDashArray);
            Game.renderer.stroke('rgb(200, 200, 200)', 5);
            Game.renderer.lineDash(lineDashArrayStart);
            Game.renderer.beginPath();
            Game.renderer.line(p1, p2, false, true); 
            Game.renderer.strokeShape();
            Game.renderer.lineDash([]);
        }


        //----------------------------------------------------------------------//



        



        //----------------------------------------------------------------------//
        //Draw the player at 10 times size
        Player.DrawPlayer(center, this.playerScale, false, true);
        //----------------------------------------------------------------------//


        //----------------------------------------------------------------------//
        //Draw the background outline last
        Game.renderer.stroke(this.outlineColour, this.outlineWidth);
        Game.renderer.beginPath();
        Game.renderer.arc(center, this.radius, Math.PI * 2, false, true);
        Game.renderer.closePath();
        Game.renderer.strokeShape();
        //----------------------------------------------------------------------//
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
    return new Vec2(Game.renderer.cnvWidth / Game.renderer.cnvHeight * Game.renderer.scaleCnvSize, Game.renderer.scaleCnvSize).div(new Vec2(2,2));
}
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//Thanks to https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
function cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;
    return [h1>>>0, h2>>>0, h3>>>0, h4>>>0];
}
//----------------------------------------------------------------------//