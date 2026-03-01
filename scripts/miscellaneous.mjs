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

    //----------------------------------------------------------------------//
    //add(other)
    //returns the vec2 representing this + other
    add(other) {
        var v = other;
        if (typeof other == Number) {
            v = new Vec2(other, other);
        }
        return new Vec2(this.x + v.x, this.y + v.y);
    }
    //----------------------------------------------------------------------//
    
    //----------------------------------------------------------------------//
    //sub(other)
    //returns the vec2 representing this - other
    sub(other) {
        var v = other;
        if (typeof other == Number) {
            v = new Vec2(other, other);
        }
        return new Vec2(this.x - v.x, this.y - v.y);
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //mul(other)
    //returns the vec2 representing this * other
    mul(other) {
        var v = other;
        if (typeof other == Number) {
            v = new Vec2(other, other);
        }
        return new Vec2(this.x * v.x, this.y * v.y);
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //div(other)
    //returns the vec2 representing this / other
    div(other) {
        var v = other;
        if (typeof other == Number) {
            v = new Vec2(other, other);
        }
        if (v.x == 0 || v.y == 0) {
            console.error("Vec2.div: divided by zero! Returning new vec2(0,0) - this might break things");
            return new Vec2(0,0);
        }
        return new Vec2(this.x / v.x, this.y / v.y);
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //len()
    //returns the length of this
    len() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    //----------------------------------------------------------------------//


    //----------------------------------------------------------------------//
    //norm()
    //returns this divided by this.len()
    norm() {
        var length = this.len();
        return this.div(new Vec2(length, length));
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //dir()
    //returns the direction of this
    dir() {
        return Math.atan2(-this.y, this.x) - Math.PI / 2;
    }
    //----------------------------------------------------------------------//

    //----------------------------------------------------------------------//
    //dot(a, b)
    //Dot product of two Vec2-s 'a' and 'b'
    static dot(a, b) {
        return a.x * b.x + a.y * b.y;
    }
    //----------------------------------------------------------------------//
    
    //----------------------------------------------------------------------//
    //dist(a, b)
    //Distance between two Vec2-s 'a' and 'b'
    static dist(a, b) {
        var delta = a.sub(b);
        return delta.len();
    }
    //----------------------------------------------------------------------//
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