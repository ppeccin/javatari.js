// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

function Test() {

    this.canvas = document.getElementById("canvas");
    this.context = this.canvas.getContext("2d");

    this.offCanvas = document.createElement('canvas');
    this.offCanvas.width = 160;
    this.offCanvas.height = 213;
    this.offContext = this.offCanvas.getContext("2d");
    this.offImageData = this.context.createImageData(this.canvas.width, this.canvas.height);
    this.offData32 = new Uint32Array(this.offImageData.data.buffer);


    this.paintInitial = function() {
        for (var i = 0; i < this.offData32.length; i++) {
            this.offData32[i] = 0x01ff3366;
        }
        this.offContext.putImageData(this.offImageData, 0, 0);
    };

    this.paint = function() {
        this.paintInitial();
        this.context.drawImage(this.offCanvas, 0, 0, 160, 213);  // , 0, 0, 640, 426);
    };

    this.clear = function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    };

    //noinspection JSUnusedGlobalSymbols
    this.runFrames = function(frames) {
        this.paintInitial();
        //noinspection JSUnresolvedVariable
        var start = performance.now();
        for (var i = 0; i < frames; i++)
            this.paint();
        //noinspection JSUnresolvedVariable
        var end = performance.now();
        console.log("Done running " + frames + " frames in " + (end - start) + " ms.");
    };

    //document.addEventListener("keydown", function(event) {
    //    console.log("keyCode: " + event.keyCode + "  keyIdentifier: " + event.keyIdentifier + "  which: " + event.which);
    //    event.preventDefault();
    //});
    //
    //document.addEventListener("keyup", function(event) {
    //    console.log("UP>>>>>  keyCode: " + event.keyCode + "  keyIdentifier: " + event.keyIdentifier + "  which: " + event.which);
    //    event.preventDefault();
    //});

}

document.addEventListener("DOMContentLoaded", function(event) {
    T = new Test();
});

