// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

function handleFileSelect(event) {
    if (event.stopPropagation) event.stopPropagation();
    if (event.preventDefault) event.preventDefault();

    var files = event.dataTransfer.files; // FileList object.
    if (!files || files.length === 0) {
        return
    }

    var file = files[0];

    console.log(">>> Reading ROM cartridge:" + file.name);
    readFile(file);
}

function handleDragOver(event) {
    if (event.stopPropagation) event.stopPropagation();
    if (event.preventDefault) event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
}

function readFile(file) {
    var reader = new FileReader();
    reader.onload = function (event) {
        var contents = event.target.result;
        startEmulator(new Uint8Array(contents));
    };
    reader.onerror = function (event) {
        alert("Could not read cartridge! Error: " + event.target.error.code);
    };

    reader.readAsArrayBuffer(file);
}

function startEmulator(rom) {

    if (rom.length < 65535) {
        var cart = new jt.Cartridge4K(rom);
        R = new jt.Room(cart);
        R.console.cpu.DEBUG = true;
        return R;
    }

    var ram = Array.prototype.slice.call(rom);
    var cpu = new jt.M6502();
    cpu.connectBus(new jt.Ram64K(ram));
    cpu.reset();

    CPU = cpu;
}


// Listeners
var dropZone = document.getElementById('drop_zone');
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);


// Tests

function outer() {

    var a = 1;

    this.inner = function() {
        var c = a + 1;
        a--;
        c = a - 5;
        c = a * 4;
        a++;
        c = a - 20;
        c = a + 45;
    }

}

//noinspection JSUnresolvedVariable
P = performance;

function TEST(times) {

    var obj = new outer();

    var start = P.now();
    for (var i = 0; i < times; i++) {
        obj.inner();
    }
    var end = P.now();
    console.log("Done running " + times + " times in " + (end - start) + " ms.");
}


