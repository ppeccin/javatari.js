/**
 * Created by ppeccin on 14/01/2015.
 */

function Clock(clockDriven, pCyclesPerSecond) {
    var self = this;

    function init() {
        internalSetFrequency(pCyclesPerSecond || 60);
    }

    this.go = function() {
        running = true;
        if(pausePending)
            pausePending = false;
        else
            pulse();
    };

    this.pauseOnNextPulse = function(continuation) {
        continuationAfterPause = continuation || null;
        pausePending = true;
    };

    this.setFrequency = function(freq) {
        if (running)
            this.pauseOnNextPulse(function setFrequencyContinuation() {
                internalSetFrequency(freq);
                self.go();
            });
        else
            internalSetFrequency(freq);
    };

    var internalSetFrequency = function(freq) {
        cyclesPerSecond = freq;
        cycleTimeMs = 1000 / freq;
        useRequestAnimationFrame = freq === 60;
    };

    var pulse = function() {
        if (pausePending) {
            pause();
            if (continuationAfterPause) continuationAfterPause();
            continuationAfterPause = null;
            return;
        }

        clockDriven.clockPulse();
        if (useRequestAnimationFrame)
            animationFrame = window.requestAnimationFrame(pulse);
        else
            if (!interval) interval = window.setInterval(pulse, cycleTimeMs);
    };

    var pause = function () {
        if (animationFrame) {
            window.cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
        if (interval) {
            window.clearTimeout(interval);
            interval = null;
        }
        pausePending = false;
        running = false;
    };


    var running = false;

    var cyclesPerSecond = null;
    var cycleTimeMs = null;
    var useRequestAnimationFrame = null;

    var animationFrame = null;
    var interval = null;
    var pausePending = false;
    var continuationAfterPause = null;


    init();

}