//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Time class                                                            //
//Manages timers, deltaTime, fps and other time related things          //
//----------------------------------------------------------------------//

export class Time {
    static deltaTime = 1; //Time since last frame in seconds
    static scaleDeltaTime = 1; //DeltaTime x 60 - e.g 1 when fps == 60, 0.5 when fps == 120, 2 when fps == 30
    static last = Date.now(); //Date.now() of last frame
    static fps = 0;
    static frame = 0;
    static seconds = 0;

    //----------------------------------------------------------------------//
    //Update()
    //Called every frame in Game.Update()
    static Update() {

        //----------------------------------------//
        //Delta time
        const NOW = Date.now();
        Time.deltaTime = (NOW - Time.last) / 1000; //in seconds
        Time.seconds += Time.deltaTime;
        
        Time.scaleDeltaTime = (Time.deltaTime * 60); //deltaTime x target fps
        
        Time.last = NOW;
        Time.fps = 1 / Time.deltaTime;
        console.log(Time.fps);
        //----------------------------------------//

        Time.frame++;
    }
    //----------------------------------------------------------------------//
}
