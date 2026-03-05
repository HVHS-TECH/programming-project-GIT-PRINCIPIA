//----------------------------------------------------------------------//
//                         ---Astro Explorer---                         //
//----------------------------------------------------------------------//
//Written by Alex Curwen                                                //
//Main                                                                  //
//Sets off the game class                                               //
//----------------------------------------------------------------------//
import {Game} from './game.mjs';
import { Player } from './player.mjs';

Game.Start();
for (var i = -2 * Math.PI; i < 2 * Math.PI; i+= Math.PI / 4) {
    console.log("I: " + i + " == " + ((i + Math.PI) % (Math.PI * 2) - Math.PI));
}