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
        var v = other;
        if (typeof other == Number) {
            v = new Vec2(other, other);
        }
        return new Vec2(this.x + v.x, this.y + v.y);
    }
    
    sub(other) {
        var v = other;
        if (typeof other == Number) {
            v = new Vec2(other, other);
        }
        return new Vec2(this.x - v.x, this.y - v.y);
    }
    mul(other) {
        var v = other;
        if (typeof other == Number) {
            v = new Vec2(other, other);
        }
        return new Vec2(this.x * v.x, this.y * v.y);
    }
    div(other) {
        var v = other;
        if (typeof other == Number) {
            v = new Vec2(other, other);
        }
        return new Vec2(this.x / v.x, this.y / v.y);
    }
    //Length of Vec2
    len() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    norm() {
        var length = this.len();
        return this.div(new Vec2(length, length));
    }
    //Dot product of two Vec2-s
    static dot(a, b) {
        return a.x * b.x + a.y * b.y;
    }
    
    //Distance between two Vec2-s
    static dist(a, b) {
        var delta = a.sub(b);
        return delta.len();
    }
}


//----------------------------------------------------------------------//



//----------------------------------------------------------------------//
//Reference variable - used to pass a value as a reference
export class RefVar {
    constructor(name, get) {
        this.name = name;
        this.get = get;
    }
    get() {}
}
//----------------------------------------------------------------------//