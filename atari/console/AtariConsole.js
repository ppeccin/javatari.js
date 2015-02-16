/**
 * Created by ppeccin on 20/11/2014.
 */

function AtariConsole() {
    var self = this;

    function init() {
        mainComponentsCreate();
        socketsCreate();
        setVideoStandardAuto();
    }

    this.powerOn = function(paused) {
        if (this.powerIsOn) this.powerOff();
        bus.powerOn();
        this.powerIsOn = true;
        controlsSocket.controlsStatesRedefined();
        videoStandardAutoDetectionStart();
        if (!paused) go();
    };

    this.powerOff = function() {
        pause();
        bus.powerOff();
        this.powerIsOn = false;
        controlsSocket.controlsStatesRedefined();
    };

    this.clockPulse = function() {
        if (videoStandardAutoDetectionInProgress)
            videoStandardAutoDetectionTry();

        controlsSocket.clockPulse();
        tia.frame();
    };

    this.getCartridgeSocket = function() {
        return cartridgeSocket;
    };

    this.getControlsSocket = function() {
        return controlsSocket;
    };

    this.getVideoOutput = function() {
        return tia.getVideoOutput();
    };

    this.getAudioOutput = function() {
        return tia.getAudioOutput();
    };

    this.getSavestateSocket = function() {
        return saveStateSocket;
    };

    this.showOSD = function(message, overlap) {
        this.getVideoOutput().showOSD(message, overlap);
    };


    // Private functions  ------------------------------------

    var go = function() {
        mainClock.go();
    };

    var pause = function() {
        mainClock.pauseOnNextPulse();
    };

    var setCartridge = function(cartridge) {
        controlsSocket.removeForwardedInput(getCartridge());
        bus.setCartridge(cartridge);
        cartridgeSocket.cartridgeInserted(cartridge);
        if (cartridge) {
            controlsSocket.addForwardedInput(cartridge);
            saveStateSocket.connectCartridge(cartridge);
        }
    };

    var getCartridge = function() {
        return bus.getCartridge();
    };

    var setVideoStandard = function(pVideoStandard) {
        if (videoStandard !== pVideoStandard) {
            videoStandard = pVideoStandard;
            tia.setVideoStandard(videoStandard);
            mainClockAdjustToNormal();
        }
        self.showOSD((videoStandardIsAuto ? "AUTO: " : "") + videoStandard.name, false);
    };

    var setVideoStandardAuto = function() {
        videoStandardIsAuto = true;
        if (self.powerIsOn) videoStandardAutoDetectionStart();
        else setVideoStandard(VideoStandard.NTSC);
    };

    var videoStandardAutoDetectionStart = function() {
        if (!videoStandardIsAuto || videoStandardAutoDetectionInProgress) return;
        // If no Cartridge present, use NTSC
        if (!bus.getCartridge()) {
            setVideoStandard(VideoStandard.NTSC);
            return;
        }
        // Otherwise use the VideoStandard detected by the monitor
        if (!tia.getVideoOutput().monitor) return;
        videoStandardAutoDetectionInProgress = true;
        videoStandardAutoDetectionTries = 0;
        tia.getVideoOutput().monitor.videoStandardDetectionStart();
    };

    var videoStandardAutoDetectionTry = function() {
        videoStandardAutoDetectionTries++;
        var standard = tia.getVideoOutput().monitor.getVideoStandardDetected();
        if (!standard && videoStandardAutoDetectionTries < VIDEO_STANDARD_AUTO_DETECTION_FRAMES)
            return;

        if (standard) setVideoStandard(standard);
        else self.showOSD("AUTO: FAILED", false);
        videoStandardAutoDetectionInProgress = false;
    };

    var setVideoStandardForced = function(forcedVideoStandard) {
        videoStandardIsAuto = false;
        setVideoStandard(forcedVideoStandard);
    };

    var powerFry = function() {
        ram.powerFry();
    };

    var cycleCartridgeFormat = function() {
    };

    var saveState = function() {
        return {
            tia: tia.saveState(),
            pia: pia.saveState(),
            ram: ram.saveState(),
            cpu: cpu.saveState(),
            cartridge: getCartridge() && getCartridge().saveState(),
            videoStandard: videoStandard.name
        };
    };

    var loadState = function(state) {
        if (!self.powerIsOn) self.powerOn();
        tia.loadState(state.tia);
        pia.loadState(state.pia);
        ram.loadState(state.ram);
        cpu.loadState(state.cpu);
        setCartridge(CartridgeDatabase.createCartridgeFromSaveState(state.cartridge));
        setVideoStandard(VideoStandard[state.videoStandard]);
        controlsSocket.controlsStatesRedefined();
    };

    var mainClockAdjustToNormal = function() {
        var freq = videoStandard.fps;
        mainClock.setFrequency(freq);
        tia.getAudioOutput().setFps(freq);
    };

    var mainClockAdjustToFast    = function() {
        var freq = 600;     // About 10x faster
        mainClock.setFrequency(freq);
        tia.getAudioOutput().setFps(freq);
    };

    var mainComponentsCreate = function() {
        cpu = new M6502();
        pia = new Pia();
        tia = new Tia(cpu, pia);
        ram = new Ram();
        bus = new Bus(cpu, tia, pia, ram);
        mainClock = new Clock(self, VideoStandard.NTSC.fps);
    };

    var socketsCreate = function() {
        controlsSocket = new ConsoleControlsSocket();
        controlsSocket.addForwardedInput(self);
        controlsSocket.addForwardedInput(tia);
        controlsSocket.addForwardedInput(pia);
        cartridgeSocket = new CartridgeSocket();
        saveStateSocket = new SaveStateSocket();
    };


    this.powerIsOn = false;

    var cpu;
    var pia;
    var tia;
    var ram;
    var bus;
    var mainClock;

    var videoStandard;
    var controlsSocket;
    var cartridgeSocket;
    var saveStateSocket;

    var videoStandardIsAuto = false;
    var videoStandardAutoDetectionInProgress = false;
    var videoStandardAutoDetectionTries = 0;

    var VIDEO_STANDARD_AUTO_DETECTION_FRAMES = 90;


    // ControlsSocket interface  ------------------------------------------------

    var controls = ConsoleControls;

    this.controlStateChanged = function (control, state) {
        // Normal state controls
        if (control == controls.FAST_SPEED) {
            if (state) {
                self.showOSD("FAST FORWARD", true);
                mainClockAdjustToFast();
            } else {
                self.showOSD(null, true);
                mainClockAdjustToNormal();
            }
            return;
        }
        // Toggles
        if (!state) return;
        switch (control) {
            case controls.POWER:
                if (self.powerIsOn) self.powerOff();
                else self.powerOn();
                break;
            case controls.POWER_OFF:
                if (self.powerIsOn) self.powerOff();
                break;
            case controls.POWER_FRY:
                powerFry();
                break;
            case controls.SAVE_STATE_0:
            case controls.SAVE_STATE_1:
            case controls.SAVE_STATE_2:
            case controls.SAVE_STATE_3:
            case controls.SAVE_STATE_4:
            case controls.SAVE_STATE_5:
            case controls.SAVE_STATE_6:
            case controls.SAVE_STATE_7:
            case controls.SAVE_STATE_8:
            case controls.SAVE_STATE_9:
            case controls.SAVE_STATE_10:
            case controls.SAVE_STATE_11:
            case controls.SAVE_STATE_12:
                saveStateSocket.saveState(control.to);
                break;
            case controls.LOAD_STATE_0:
            case controls.LOAD_STATE_1:
            case controls.LOAD_STATE_2:
            case controls.LOAD_STATE_3:
            case controls.LOAD_STATE_4:
            case controls.LOAD_STATE_5:
            case controls.LOAD_STATE_6:
            case controls.LOAD_STATE_7:
            case controls.LOAD_STATE_8:
            case controls.LOAD_STATE_9:
            case controls.LOAD_STATE_10:
            case controls.LOAD_STATE_11:
            case controls.LOAD_STATE_12:
                saveStateSocket.loadState(control.from);
                break;
            case controls.VIDEO_STANDARD:
                self.showOSD(null, true);	// Prepares for the upcoming "AUTO" OSD to always show
                if (videoStandardIsAuto) setVideoStandardForced(VideoStandard.NTSC);
                else if (videoStandard == VideoStandard.NTSC) setVideoStandardForced(VideoStandard.PAL);
                else setVideoStandardAuto();
                break;
            case controls.CARTRIDGE_FORMAT:
                cycleCartridgeFormat();
        }
    };

    this.controlValueChanged = function (control, position) {
        // No positional controls here
    };

    this.controlsStateReport = function (report) {
        //  Only Power Control is visible from outside
        report[controls.POWER] = self.powerIsOn;
    };


    // CartridgeSocket interface  -----------------------------------------

    function CartridgeSocket() {

        this.insert = function (cartridge, autoPower) {
            // Special case for Savestates
            //if (cartridge != null && cartridge instanceof CartridgeSavestate) {
            //    insertSavestateCartridge((CartridgeSavestate) cartridge);
            //    return;
            //}
            // Normal case
            if (autoPower && self.powerIsOn) self.powerOff();
            setCartridge(cartridge);
            if (autoPower && !self.powerIsOn) self.powerOn();
        };

        this.inserted = function () {
            return getCartridge();
        };

        this.cartridgeInserted = function (cartridge) {
            for (var i = 0; i < insertionListeners.length; i++)
                insertionListeners[i].cartridgeInserted(cartridge);
        };

        this.addInsertionListener = function (listener) {
            if (insertionListeners.indexOf(listener) < 0) {
                insertionListeners.push(listener);
                listener.cartridgeInserted(this.inserted());		// Fire a insertion event
            }
        };

        this.removeInsertionListener = function (listener) {
            Util.arrayRemove(insertionListeners, listener);
        };

        this.insertSavestateCartridge = function (cartridge) {
            //state = cartridge.getConsoleState();
            //if (state != null) {
            //    loadState(state);
            //    self.showOSD("Savestate Cartridge loaded", true);
            //}
        };

        var insertionListeners = [];

    }


    // SavestateSocket interface  -----------------------------------------

    function SaveStateSocket() {

        this.connectMedia = function(pMedia) {
            media = pMedia;
        };

        this.getMedia = function() {
            return media;
        };

        this.externalStateChange = function() {
            // Nothing
        };

        this.connectCartridge = function(cartridge) {
            cartridge.connectSaveStateSocket(this);
        };

        this.saveStateFile = function() {
            if (!self.powerIsOn || !media) return;
            var state = saveState();
            if (media.saveStateFile(state))
                self.showOSD("State cartridge saved", true);
            else
                self.showOSD("State cartridge save failed", true);
        };

        this.saveState = function(slot) {
            if (!self.powerIsOn || !media) return;
            var state = saveState();
            state.javatariSaveStateVersion = version;
            if (media.saveState(slot, state))
                self.showOSD("State " + slot + " saved", true);
            else
                self.showOSD("State " + slot + " save failed", true);
        };

        this.loadState = function(slot) {
            if (!media) return;
            var state = media.loadState(slot);
            if (!state) {
                self.showOSD("State " + slot + " not found", true);
                return;
            }
            if (state.javatariSaveStateVersion !== version) {
                self.showOSD("State " + slot + " load failed, wrong version", true);
                return;
            }
            loadState(state);
            self.showOSD("State " + slot + " loaded", true);
        };

        var media;
        var version = 1;
    }


    // Debug methods  ------------------------------------------------------

    //noinspection JSUnusedGlobalSymbols
    this.runFrames = function(frames) {
        //noinspection JSUnresolvedVariable
        var start = performance.now();
        for (var i = 0; i < frames; i++)
            this.clockPulse();
        //noinspection JSUnresolvedVariable
        var end = performance.now();
        console.log("Done running " + frames + " frames in " + (end - start) + " ms.");
    };


    init();

}