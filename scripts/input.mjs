//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Input class                                                           //
//Manages input callbacks                                               //
//----------------------------------------------------------------------//

export class Input {
    static mouseX;
    static mouseY;
    static keysDown = [];

    static Initialize() {
        document.addEventListener('keydown', function(event) {
            Input.keysDown[event.code] = true;
        });

        document.addEventListener('keyup', function(event) {
            Input.keysDown[event.code] = false;
        });

        
    }
    static KeyDown(keyName) {
        // keyName should match event.code, e.g. "KeyA", "ArrowUp", "Space"
        return !!Input.keysDown[keyName];
    }
}
