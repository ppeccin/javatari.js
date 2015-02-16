/**
 * Created by ppeccin on 08/11/2014.
 */

(function() {

    var canvas = document.getElementById('canvas');
    //canvas.addEventListener('dragover', handleDragOver, false);
    canvas.addEventListener('drop', handleFileSelect, false);

    function handleFileSelect(event) {
        event.stopPropagation();
        event.preventDefault();

        var files = event.dataTransfer && event.dataTransfer.files; // FileList object.
        if (!files || files.length === 0) {
            return
        }
        var file = files[0];

        console.log(">>> Reading ROM cartridge: " + file.name);
        readFile(file);
    }

    function handleDragOver(event) {
        event.stopPropagation();
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    }

    function readFile(file) {
        var reader = new FileReader();
        reader.onload = function (event) {
            var contents = event.target.result;
            loadRomFile(file, new Uint8Array(contents));
        };
        reader.onerror = function (event) {
            alert("Could not read cartridge! Error: " + event.target.error.code);
        };

        reader.readAsArrayBuffer(file);
    }

    function debugConsole() {
        //R.console.cpu.DEBUG = true;
        //R.console.runFrames(10);
        //R.console.tia.debug(4);

        //if (refreshInterval) clearInterval(refreshInterval);
        //R.powerOn(false);
        //I = setInterval(function() { R.console.runFrames(60); }, 1000);
    }

    function loadRomFile(file, fileContent) {
        var arrContent = new Array(fileContent.length);
        Util.arrayCopy(fileContent, 0, arrContent, 0, arrContent.length);

        var rom = new ROM(file.name, arrContent);
        var cart = CartridgeDatabase.createCartridgeFromRom(rom);

        R.console.getCartridgeSocket().insert(cart, true);
    }

    function start() {
        R = new Room(canvas, undefined);
        R.powerOn();
    }

    start();

})();


