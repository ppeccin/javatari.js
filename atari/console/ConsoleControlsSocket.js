/**
 * Created by ppeccin on 04/01/2015.
 */

function ConsoleControlsSocket(){

    this.connectControls = function(pControls) {
        controls = pControls;
    };

    this.clockPulse = function() {
        controls.clockPulse();
    };

    this.controlStateChanged = function(control, state) {
        for (var i = 0; i < forwardedInputs.length; i++)
            forwardedInputs[i].controlStateChanged(control, state);
    };

    this.controlValueChanged = function(control, position) {
        for (var i = 0; i < forwardedInputs.length; i++)
            forwardedInputs[i].controlValueChanged(control, position);
    };

    this.controlsStateReport = function(report) {
        for (var i = 0; i < forwardedInputs.length; i++)
            forwardedInputs[i].controlsStateReport(report);
    };

    this.addForwardedInput = function(input) {
        forwardedInputs.push(input);
    };

    this.removeForwardedInput = function(input) {
        Util.arrayRemove(forwardedInputs, input);
    };

    this.addRedefinitionListener = function(listener) {
        if (redefinitionListeners.indexOf(listener) < 0) {
            redefinitionListeners.push(listener);
            listener.controlsStatesRedefined();		// Fire a redefinition event
        }
    };

    this.controlsStatesRedefined = function() {
        for (var i = 0; i < redefinitionListeners.length; i++)
            redefinitionListeners[i].controlsStatesRedefined();
    };

    var controls;
    var forwardedInputs = [];
    var redefinitionListeners = [];

}
