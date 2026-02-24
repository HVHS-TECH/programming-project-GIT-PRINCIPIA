//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Miscellaneous classes                                                 //
//----------------------------------------------------------------------//


//----------------------------------------------------------------------//
//Page class
export class Page {
    constructor(title, href, hasCnv, onLoad) {
        this.title = title; //Identifying title
        this.href = href;
        this.hasCnv = hasCnv; //For r_core_setHasCnv
        this.OnLoad = onLoad; //Called on page load
    }
    OnLoad(){}
}
//----------------------------------------------------------------------//



//----------------------------------------------------------------------//
//Vector 2
export class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(other) {
        return new Vec2(this.x + other.x, this.y + other.y);
    }
    sub(other) {
        return new Vec2(this.x - other.x, this.y - other.y);
    }
    mul(other) {
        return new Vec2(this.x * other.x, this.y * other.y);
    }
    div(other) {
        return new Vec2(this.x / other.x, this.y / other.y);
    }
}

//Dot product of two Vec2-s
export function dot(a, b) {
    return a.x * b.x + a.y * b.y;
}
//----------------------------------------------------------------------//