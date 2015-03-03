/**
 * Created by ppeccin on 20/11/2014.
 */

function Cartridge() {

    this.powerOn = function() {
    };

    this.powerOff = function() {
    };

    this.connectBus = function(aBus) {
    };

    this.connectSaveStateSocket = function(socket) {
    };

    this.read = function(address) {
    };

    this.write = function(address, val) {
        // Writing to ROMs is possible, but nothing is changed
    };

    this.needsBusMonitoring = function() {
        return false;
    };

    this.monitorBusBeforeRead = function(address, data)  {
    };

    this.monitorBusBeforeWrite = function(address, val)  {
    };

    this.needsClock = function() {
        return false;
    };

    this.setROM = function(rom) {
        this.rom = rom;
    };

     // Controls interface  ---------------------------------

    this.controlStateChanged = function(control, state) {
    };

    this.controlValueChanged = function(control, position) {
    };

    this.controlsStateReport = function(report) {
    };


    // Savestate  -------------------------------------------

    this.saveState = function() {
    };

    this.loadState = function(state) {
    };


    this.rom = null;

}

Cartridge.base = new Cartridge();
