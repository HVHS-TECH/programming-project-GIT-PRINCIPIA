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

    //Used for when the ui element returns an input value
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
    //----------------------------------------------------------------------//
    //Update()
    //Update the value of the meter from the reference variable
    Update() {
        this.value = Game.getRefVar(this.valueRefVarName);
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //Draw()
    //Draw the meter
    Draw() {
        var scaleCnvSize_half_vec2 = GetScaleCnvSizeHalf();
        var alignment_mul_scaleCnvSize_half_vec2 = this.alignment.mul(scaleCnvSize_half_vec2);
        var center = alignment_mul_scaleCnvSize_half_vec2.add(this.pos); 

        this.DrawBackground(center);

        this.DrawSlider(center);


        
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawBackground(center)
    //Draws the background
    DrawBackground(center) {
        //----------------------------------------//
        //Draw the background
        //-cnvWidth / 2 --------------------- -scaleCnvSize / 2 ------------------ center ------------------- scaleCnvSize / 2 ---------------------- cnvWidth / 2//
        
        


        var tl = center.add(new Vec2(-this.width / 2, this.height / 2));
        var br = center.add(new Vec2(this.width / 2, -this.height / 2));

        
        Game.renderer.stroke(this.outlineColour, this.outlineWidth, false, true);
        Game.renderer.fill(this.background);
        Game.renderer.rect(tl, br, false, true);
        Game.renderer.fillShape();
        Game.renderer.strokeShape();
        //----------------------------------------//
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawSlider(center)
    //Draws the slider
    DrawSlider(center) {
        //----------------------------------------//
        //Draw the fill (slider)
        //This.value is from 0 - 1, so we must scale it by this.height
        //Give space for outline
        var fill_tl = center.add(new Vec2(-this.width / 2 + this.outlineWidth / 2, -this.height / 2 + this.outlineWidth / 2 + this.value * (this.height - this.outlineWidth)));
        var fill_br = center.add(new Vec2(this.width / 2 - this.outlineWidth / 2, -this.height / 2 + this.outlineWidth / 2));

        Game.renderer.fill(this.fillColour);
        Game.renderer.rect(fill_tl, fill_br, false, true);
        Game.renderer.fillShape();


        //Divider bar
        var divider_tl = center.add(new Vec2(-this.width / 2 + this.outlineWidth / 2, -this.height / 2 + this.outlineWidth / 2 + this.value * (this.height - this.outlineWidth) + 5));
        var divider_br = center.add(new Vec2(this.width / 2 - this.outlineWidth / 2, -this.height / 2 + this.outlineWidth / 2 + this.value * (this.height - this.outlineWidth) - 5));

        Game.renderer.fill("black");
        Game.renderer.rect(divider_tl, divider_br, false, true);
        Game.renderer.fillShape();
        //----------------------------------------//
    }
    //----------------------------------------------------------------------//
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

    //----------------------------------------------------------------------//
    //Update()
    //Called every frame
    //Updates the velocity magnitude and velocity direction references
    Update() {
        this.vel = Game.getRefVar(this.velRefName);
        this.velDir = Game.getRefVar(this.velDirRefName);
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //Draw()
    //Draws the Navball
    Draw() {
        var scaleCnvSize_half_vec2 = GetScaleCnvSizeHalf();
        var alignment_mul_scaleCnvSize_half_vec2 = this.alignment.mul(scaleCnvSize_half_vec2);
        var center = alignment_mul_scaleCnvSize_half_vec2.add(this.pos); 

        this.DrawBackground(center);

        this.DrawWindStreaks(center);

        this.DrawPlayer(center);

        this.DrawOutline(center);
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawBackground(center)
    //Draws the background circle of the navball
    DrawBackground(center) {
        //----------------------------------------//
        //Draw the background
        Game.renderer.fill(this.backgroundColour);
        Game.renderer.beginPath();
        Game.renderer.arc(center, this.radius, Math.PI * 2, false, true);
        Game.renderer.closePath();
        Game.renderer.fillShape();
        //----------------------------------------//
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //DrawWindStreaks()
    //Draws the 'wind streaks' indicating the player velocity direction
    DrawWindStreaks(center) {
        //Draw the velocity lines (like wind)
        
        const NUM_LINES = 20;
        
        //----------------------------------------//
        //rotatePoint(p, angle)
        //p: point
        //rotates point 'p' through angle 'angle'
        function rotatePoint(p, angle) {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            var px = p.x * cos - p.y * sin;
            var py = p.x * sin + p.y * cos;
            p.x = px;
            p.y = py;
            return p;
        }
        //----------------------------------------//


        //----------------------------------------//
        //clamp(v, min, max)
        //v: value
        //clamps 'v' between 'min' and 'max'
        function clamp(v, min, max) {
            return Math.min(Math.max(v, min), max);
        }
        //----------------------------------------//


        //----------------------------------------//
        //Settings, could be moved to constructor
        const SPACING = 250; //Spacing between wind streaks
        const SIZE = 100; //Length of wind streaks
        const SPEED = 1000;// - this.vel;
        //----------------------------------------//

        //----------------------------------------//
        //Populate lineDashArray
        const LENGTH = Math.ceil(this.radius / (SPACING + SIZE)); //Length of array
        var lineDashArray = [];
        for (var i = 0; i < LENGTH; i++) {
            lineDashArray.push(SIZE);
            lineDashArray.push(SPACING);
        }
        //----------------------------------------//

        //----------------------------------------//
        //Draw the lines
        for (var l = -this.radius; l <= this.radius; l += this.radius * 2 / (NUM_LINES * 0.4)) {


            const widthHalf = Math.sqrt(this.radius * this.radius - l * l);
            var p1 = new Vec2(-widthHalf, l);
            var p2 = new Vec2(widthHalf, l);

            //Rotate p1 and p2 by slope around center
            p1 = rotatePoint(p1, -this.velDir + Math.PI / 2);
            p2 = rotatePoint(p2, -this.velDir + Math.PI / 2);

            p1 = p1.add(center);
            p2 = p2.add(center);



            //----------------------------------------//
            //Spread out the equation into smaller chunks
            const TIME = (new Date().getTime()) + Math.sin(l / 10 + new Date().getTime() / 200000) * 34000 - Math.cos(l / 20 + new Date().getTime() / 200000) * 3000;
            const A = (SPACING + SIZE) / SPACING
            const MODULUS = TIME % (A * SPEED * SPACING / SIZE);
            //----------------------------------------//

            //----------------------------------------//
            //Populate start of array with segments that grow in length to imitate movement
            var lineDashArrayStart = [ 
                clamp((MODULUS) / (SPEED) * SIZE - SPACING, 0, SIZE), //SIZE 1
                clamp((MODULUS) / (SPEED * SPACING / SIZE) * SPACING, 0, SPACING) //SPACING 1

                    ];
            //----------------------------------------//

            //Add the rest of the array on the end
            lineDashArrayStart.push(...lineDashArray);

            //----------------------------------------//
            //Render the line
            Game.renderer.stroke('rgb(200, 200, 200)', 5, false, true);
            Game.renderer.lineDash(lineDashArrayStart, false, true);
            Game.renderer.beginPath();
            Game.renderer.line(p1, p2, false, true); 
            Game.renderer.strokeShape();

            //Reset line dash
            Game.renderer.lineDash([]);
            //----------------------------------------//
        }
        //----------------------------------------//


    }
    //----------------------------------------------------------------------//

    DrawPlayer(center) {
        //----------------------------------------//
        //Draw the player at an enlarged size
        Player.DrawPlayer(center, this.playerScale, false, true);
        //----------------------------------------//
    }

    DrawOutline(center) {
        //----------------------------------------//
        //Draw the background outline last
        Game.renderer.stroke(this.outlineColour, this.outlineWidth, false, true);
        Game.renderer.beginPath();
        Game.renderer.arc(center, this.radius, Math.PI * 2, false, true);
        Game.renderer.closePath();
        Game.renderer.strokeShape();
        //----------------------------------------//
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