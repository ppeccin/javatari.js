/**
 * Created by ppeccin on 20/11/2014.
 */

function Cartridge() {

    this.setROM = function(rom) {
        this.rom = rom;
    };

    this.powerOn = function() {
    };

    this.powerOff = function() {
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

    this.needsAudioClock = function() {
        return false;
    };

    this.connectAudioSignal = function(signal) {
    };

    this.audioClockPulse = function() {
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
