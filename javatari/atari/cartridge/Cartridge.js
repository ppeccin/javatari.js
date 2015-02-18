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
