// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.AtariConsole = function(mainVideoClock) {
"use strict";

    var self = this;

    function init() {
        mainComponentsCreate();
        socketsCreate();
    }

    this.socketsConnected = function() {
        setDefaults();
    };

    this.powerOn = function(fromState) {
        if (this.powerIsOn) this.powerOff();
        bus.powerOn();
        this.powerIsOn = true;
        consoleControlsSocket.controlsStatesRedefined();
        updateVideoSynchronization();
        videoStandardAutoDetectionStart();
        if (!fromState) consoleControlsSocket.firePowerAndUserPauseStateUpdate();   // loadState will fire it
    };

    this.powerOff = function() {
        bus.powerOff();
        this.powerIsOn = false;
        // consoleControlsSocket.releaseControllers();      TODO Really needed? Causing problems...
        consoleControlsSocket.controlsStatesRedefined();
        if (userPaused) this.userPause(false);
        else consoleControlsSocket.firePowerAndUserPauseStateUpdate();
    };

    this.userPowerOn = function() {
        if (isLoading) return;

        this.powerOn();
        if (!bus.getCartridge()) this.showOSD("NO CARTRIDGE INSERTED!", false, true);
    };

    this.setLoading = function(state) {
        isLoading = state;
    };

    this.userPause = function(pause, keepAudio) {
        var prev = userPaused;
        if (userPaused !== pause) {
            userPaused = !!pause; userPauseMoreFrames = -1;
            if (userPaused && !keepAudio) audioSocket.muteAudio();
            else audioSocket.unMuteAudio();
            consoleControlsSocket.firePowerAndUserPauseStateUpdate();
        }
        return prev;
    };

    this.systemPause = function(val) {
        var prev = systemPaused;
        if (systemPaused !== val) {
            systemPaused = !!val;
            if (systemPaused) audioSocket.pauseAudio();
            else audioSocket.unpauseAudio();
        }
        return prev;
    };

    this.isSystemPaused = function() {
        return systemPaused;
    };

    this.videoClockPulse = function() {
        // Video clock will be the Tia Frame video clock (60Hz/50Hz)
        // CPU and other clocks (Pia, Audio) will be sent by the Tia

        this.videoClockPulseApplyPulldowns(self.videoClockPulseGetNextPulldowns());
    };

    this.videoClockPulseApplyPulldowns = function(pulls) {
        if (!self.powerIsOn) return;

        while(pulls-- > 0) videoFrame();

        // Finish audio signal (generate any missing samples to adjust to sample rate)
        if (!userPaused) audioSocket.audioFinishFrame();
    };

    this.videoClockPulseGetNextPulldowns = function() {
        // Simple pulldown with 1:1 cadence
        if (videoPulldown.steps === 1) return 1;

        // Complex pulldown
        if (--videoPulldownStep < 0) videoPulldownStep = videoPulldown.steps - 1;
        return videoPulldown.cadence[videoPulldownStep];
    };

    function videoFrame() {
        if (userPaused && userPauseMoreFrames-- <= 0) return;
        if (videoStandardAutoDetectionInProgress) videoStandardAutoDetectionTry();
        tia.frame();
    }

    this.getCartridgeSocket = function() {
        return cartridgeSocket;
    };

    this.getConsoleControlsSocket = function() {
        return consoleControlsSocket;
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

    this.getVideoClockSocket = function() {
        return videoClockSocket;
    };

    this.getAudioSocket = function() {
        return audioSocket;
    };

    this.showOSD = function(message, overlap, error) {
        this.getVideoOutput().showOSD(message, overlap, error);
    };

    this.vSynchSetSupported = function(boo) {
        // To be called once and only by Room during Native Video Freq detection
        var user = Javatari.userPreferences.current.vSynch;
        vSynchMode = Javatari.SCREEN_VSYNCH_MODE !== -1 && boo
            ? Javatari.SCREEN_VSYNCH_MODE >= 0
                ? Javatari.SCREEN_VSYNCH_MODE
                : user !== null && user >= 0 ? user : 1
            : -1;
    };

    function vSynchToggleMode() {
        if (vSynchMode === -1) {
            self.showOSD("V-Synch is DISABLED / UNSUPPORTED", true, true);
            return;
        }
        vSynchMode = vSynchMode ? 0 : 1;
        updateVideoSynchronization();
        self.showOSD("V-Synch: " + (vSynchMode ? "ON" : "OFF"), true);

        // Persist
        Javatari.userPreferences.current.vSynch = vSynchMode;
        Javatari.userPreferences.setDirty();
        Javatari.userPreferences.save();
    }

    var setCartridge = function(cartridge) {
        Javatari.cartridge = cartridge;
        var removedCartridge = getCartridge();
        bus.setCartridge(cartridge);
        cartridgeSocket.cartridgeInserted(cartridge, removedCartridge);
    };

    var getCartridge = function() {
        return bus.getCartridge();
    };

    var setVideoStandard = function (pVideoStandard) {
        if (videoStandard !== pVideoStandard) {
            videoStandard = pVideoStandard;
            tia.setVideoStandard(videoStandard);
            updateVideoSynchronization();
        }
    };

    function showVideoStandardMessage() {
        self.showOSD((videoStandardIsAuto ? "AUTO: " : "") + videoStandard.name, true);
    }

    var setVideoStandardAuto = function(state) {
        videoStandardIsAuto = state;
        if (state) {
            if (self.powerIsOn) videoStandardAutoDetectionStart();
            else setVideoStandard(jt.VideoStandard.NTSC);
        }
    };

    var videoStandardAutoDetectionStart = function() {
        if (!videoStandardIsAuto || videoStandardAutoDetectionInProgress) return;
        // If no Cartridge present, use NTSC
        if (!bus.getCartridge()) {
            setVideoStandard(jt.VideoStandard.NTSC);
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

        if (standard) {
            if (standard !== videoStandard) {
                setVideoStandard(standard);
                showVideoStandardMessage();
            }
        } else
            self.showOSD("AUTO: FAILED", true, true);
        videoStandardAutoDetectionInProgress = false;
    };

    var setVideoStandardForced = function(forcedVideoStandard) {
        videoStandardIsAuto = false;
        setVideoStandard(forcedVideoStandard);
    };

    function updateVideoSynchronization() {
        // According to the native video frequency detected, target Video Standard and vSynchMode, use a specific pulldown configuration
        if (vSynchMode === 1) {    // ON
            // Will V-synch to host freq if detected and supported, or use optimal timer configuration)
            videoPulldown = videoStandard.pulldowns[videoClockSocket.getVSynchNativeFrequency()] || videoStandard.pulldowns.TIMER;
        } else {                  // OFF, DISABLED
            // No V-synch. Always use the optimal timer configuration)
            videoPulldown = videoStandard.pulldowns.TIMER;
        }

        videoPulldownStep = 0;
        videoClockUpdateSpeed();

        //console.error("Update Synchronization: " + videoPulldown.frequency);
    }

    var powerFry = function() {
        ram.powerFry();
        saveStateSocket.externalStateChange();
    };

    var cycleCartridgeFormat = function() {
    };

    var saveState = function(extended) {
        var s = {
            t: tia.saveState(extended),
            p: pia.saveState(),
            r: ram.saveState(),
            b: bus.saveState(),
            c: cpu.saveState(),
            ca: getCartridge() && getCartridge().saveState(),
            vsa: videoStandardIsAuto,
            vs: videoStandard.name
        };
        if (extended) {
            s.pw = self.powerIsOn;
            s.up = userPaused;
            s.upf = userPauseMoreFrames;
        }
        return s;
    };
    this.saveState = saveState;

    var loadState = function(s) {
        // Extended
        if (s.pw !== undefined) if (self.powerIsOn !== s.pw) s.pw ? self.powerOn() : self.powerOff();
        if (s.up !== undefined) self.userPause(s.up);
        if (s.upf !== undefined) userPauseMoreFrames = s.upf;

        // Normal
        videoClockUpdateSpeed();
        tia.loadState(s.t);
        pia.loadState(s.p);
        ram.loadState(s.r);
        if (s.b) bus.loadState(s.b);
        cpu.loadState(s.c);
        setCartridge(s.ca && jt.CartridgeCreator.recreateCartridgeFromSaveState(s.ca, getCartridge()));
        if (s.vsa !== undefined) setVideoStandardAuto(s.vsa);
        setVideoStandard(jt.VideoStandard[s.vs]);
        consoleControlsSocket.firePowerAndUserPauseStateUpdate();
        consoleControlsSocket.controlsStatesRedefined();
        saveStateSocket.externalStateChange();
    };
    this.loadState = loadState;

    function setDefaults() {
        setVideoStandardAuto(true);
        speedControl = 1;
        alternateSpeed = null;
        videoClockUpdateSpeed();
        tia.debug(0);
        tia.debugNoCollisions(false);
    }

    function videoClockUpdateSpeed() {
        videoClockSocket.setVSynch(vSynchMode === 1);
        var hostFreq = (videoPulldown.frequency * (alternateSpeed || speedControl)) | 0;
        videoClockSocket.setFrequency(hostFreq, videoPulldown.divider);
        audioSocket.setFps(hostFreq / videoPulldown.divider);
    }

    var mainComponentsCreate = function() {
        cpu = new jt.M6502();
        pia = new jt.Pia();
        tia = new jt.Tia(cpu, pia);
        self.tia = tia;
        ram = new jt.Ram();
        bus = new jt.Bus(cpu, tia, pia, ram);
    };

    var socketsCreate = function() {
        videoClockSocket = new VideoClockSocket();
        consoleControlsSocket = new ConsoleControlsSocket();
        cartridgeSocket = new CartridgeSocket();
        saveStateSocket = new SaveStateSocket();
        audioSocket = new AudioSocket();
        tia.getAudioOutput().connectAudioSocket(audioSocket);
    };


    this.powerIsOn = false;

    var isLoading = false;
    var userPaused = false;
    var userPauseMoreFrames = 0;
    var systemPaused = false;

    var speedControl = 1;
    var alternateSpeed = false;

    var cpu;
    var pia;
    var tia;
    var ram;
    var bus;

    var videoStandard;
    var videoPulldown, videoPulldownStep;

    var videoClockSocket;
    var consoleControlsSocket;
    var cartridgeSocket;
    var saveStateSocket;
    var audioSocket;

    var videoStandardIsAuto = false;
    var videoStandardAutoDetectionInProgress = false;
    var videoStandardAutoDetectionTries = 0;

    var vSynchMode = -1;

    var VIDEO_STANDARD_AUTO_DETECTION_FRAMES = 90;

    var SPEEDS = [ 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 2, 3, 5, 10 ];
    var SPEED_FAST = 10, SPEED_SLOW = 0.3;


    // Controls interface  --------------------------------------------

    var controls = jt.ConsoleControls;

    this.controlStateChanged = function (control, state) {
        // Normal state controls
        if (control === controls.FAST_SPEED) {
            if (state && alternateSpeed !== SPEED_FAST) {
                alternateSpeed = SPEED_FAST;
                videoClockUpdateSpeed();
                self.showOSD("FAST FORWARD", true);
            } else if (!state && alternateSpeed === SPEED_FAST) {
                alternateSpeed = null;
                videoClockUpdateSpeed();
                self.showOSD(null, true);
            }
            return;
        }
        if (control === controls.SLOW_SPEED) {
            if (state && alternateSpeed !== SPEED_SLOW) {
                alternateSpeed = SPEED_SLOW;
                videoClockUpdateSpeed();
                self.showOSD("SLOW MOTION", true);
            } else if (!state && alternateSpeed === SPEED_SLOW) {
                alternateSpeed = null;
                videoClockUpdateSpeed();
                self.showOSD(null, true);
            }
            return;
        }
        // Toggles
        if (!state) return;
        switch (control) {
            case controls.POWER:
                if (self.powerIsOn) self.powerOff();
                else self.userPowerOn();
                break;
            case controls.POWER_OFF:
                if (self.powerIsOn) self.powerOff();
                break;
            case controls.POWER_FRY:
                powerFry();
                break;
            case controls.PAUSE:
                self.userPause(!userPaused, false);
                self.getVideoOutput().showOSD(userPaused ? "PAUSE" : "RESUME", true);
                return;
            case controls.PAUSE_AUDIO_ON:
                self.userPause(!userPaused, true);
                self.getVideoOutput().showOSD(userPaused ? "PAUSE with AUDIO ON" : "RESUME", true);
                return;
            case controls.FRAME:
                if (userPaused) userPauseMoreFrames = 1;
                return;
            case controls.INC_SPEED: case controls.DEC_SPEED: case controls.NORMAL_SPEED: case controls.MIN_SPEED:
                var speedIndex = SPEEDS.indexOf(speedControl);
                if (control === controls.INC_SPEED && speedIndex < SPEEDS.length - 1) ++speedIndex;
                else if (control === controls.DEC_SPEED && speedIndex > 0) --speedIndex;
                else if (control === controls.MIN_SPEED) speedIndex = 0;
                else if (control === controls.NORMAL_SPEED) speedIndex = SPEEDS.indexOf(1);
                speedControl = SPEEDS[speedIndex];
                self.showOSD("Speed: " + ((speedControl * 100) | 0) + "%", true);
                videoClockUpdateSpeed();
                break;
            case controls.SAVE_STATE_0: case controls.SAVE_STATE_1: case controls.SAVE_STATE_2: case controls.SAVE_STATE_3: case controls.SAVE_STATE_4: case controls.SAVE_STATE_5:
            case controls.SAVE_STATE_6: case controls.SAVE_STATE_7: case controls.SAVE_STATE_8: case controls.SAVE_STATE_9: case controls.SAVE_STATE_10: case controls.SAVE_STATE_11: case controls.SAVE_STATE_12:
                var wasPaused = self.systemPause(true);
                saveStateSocket.saveState(control & 0xff);  // get binary encoded slot number
                if (!wasPaused) self.systemPause(false);
                break;
            case controls.SAVE_STATE_FILE:
                wasPaused = self.systemPause(true);
                saveStateSocket.saveStateFile();
                if (!wasPaused) self.systemPause(false);
                break;
            case controls.LOAD_STATE_0: case controls.LOAD_STATE_1: case controls.LOAD_STATE_2: case controls.LOAD_STATE_3: case controls.LOAD_STATE_4: case controls.LOAD_STATE_5:
            case controls.LOAD_STATE_6: case controls.LOAD_STATE_7: case controls.LOAD_STATE_8: case controls.LOAD_STATE_9: case controls.LOAD_STATE_10: case controls.LOAD_STATE_11: case controls.LOAD_STATE_12:
                wasPaused = self.systemPause(true);
                saveStateSocket.loadState(control & 0xff);  // get binary encoded slot number
                if (!wasPaused) self.systemPause(false);
                break;
            case controls.VIDEO_STANDARD:
                if (videoStandardIsAuto) setVideoStandardForced(jt.VideoStandard.NTSC);
                else if (videoStandard == jt.VideoStandard.NTSC) setVideoStandardForced(jt.VideoStandard.PAL);
                else setVideoStandardAuto(true);
                showVideoStandardMessage();
                break;
            case controls.VSYNCH:
                vSynchToggleMode();
                break;
            case controls.CARTRIDGE_FORMAT:
                cycleCartridgeFormat();
                break;
            case controls.DEFAULTS:
                setDefaults();
                self.showOSD("Default Settings", true);
                break;
        }
    };

    this.controlsStateReport = function (report) {
        //  Only Power Control is visible from outside
        report[controls.POWER] = self.powerIsOn;
    };


    // Video Clock Socket  -----------------------------------------

    function VideoClockSocket() {
        this.connectClock = function(clock) {
            videoClock = clock;
        };
        this.getVSynchNativeFrequency = function() {
            return videoClock.getVSynchNativeFrequency();
        };
        this.setVSynch = function(state) {
            videoClock.setVSynch(state);
        };
        this.setFrequency = function(freq, div) {
            videoClock.setFrequency(freq, div);
        };
        var videoClock;
    }


    // CartridgeSocket  -----------------------------------------

    function CartridgeSocket() {

        this.insert = function (cartridge, autoPower) {
            if (autoPower && self.powerIsOn) self.powerOff();
            setCartridge(cartridge);
            if (autoPower && !self.powerIsOn) self.powerOn();
            saveStateSocket.externalStateChange();
        };

        this.inserted = function () {
            return getCartridge();
        };

        this.cartridgeInserted = function (cartridge, removedCartridge) {
            tia.getAudioOutput().cartridgeInserted(cartridge, removedCartridge);
            consoleControlsSocket.cartridgeInserted(cartridge, removedCartridge);
            saveStateSocket.cartridgeInserted(cartridge, removedCartridge);
            tia.getVideoOutput().monitor.cartridgeInserted(cartridge, removedCartridge);
        };

        // Data operations unavailable
        this.loadCartridgeData = function (port, name, arrContent) {
            // would need: saveStateSocket.externalStateChange();
        };
        this.saveCartridgeDataFile = function (port) {
        };

    }


    // ConsoleControlsSocket  -----------------------------------------

    function ConsoleControlsSocket() {

        this.connectControls = function(pControls) {
            controls = pControls;
        };

        this.cartridgeInserted = function(cartridge, removedCartridge) {
            if (controls) controls.cartridgeInserted(cartridge, removedCartridge);
        };

        this.controlStateChanged = function(control, state) {
            self.controlStateChanged(control, state);
            pia.controlStateChanged(control, state);
            tia.controlStateChanged(control, state);
            tia.getVideoOutput().monitor.controlStateChanged(control, state);
        };

        this.controlValueChanged = function(control, position) {
            tia.controlValueChanged(control, position);
        };

        this.controlsStateReport = function(report) {
            self.controlsStateReport(report);
            pia.controlsStateReport(report);
        };

        this.controlsStatesRedefined = function() {
            tia.getVideoOutput().monitor.controlsStatesRedefined();
        };

        this.firePowerAndUserPauseStateUpdate = function() {
            controls.consolePowerAndUserPauseStateUpdate(self.powerIsOn, userPaused);
            tia.getVideoOutput().monitor.consolePowerAndUserPauseStateUpdate(self.powerIsOn, userPaused);
        };

        this.releaseControllers = function() {
            controls.releaseControllers();
        };

        this.controlsClockPulse = function() {
            controls.controlsClockPulse();
        };

        this.getControlReport = function(control) {
            switch(control) {
                case jt.ConsoleControls.VIDEO_STANDARD:
                    return { label: videoStandardIsAuto ? "Auto" : videoStandard.name, active: !videoStandardIsAuto };
                case jt.ConsoleControls.VSYNCH:
                    return { label: vSynchMode === -1 ? "DISABL" : vSynchMode ? "ON" : "OFF", active: vSynchMode === 1 };
                case jt.ConsoleControls.NO_COLLISIONS:
                    return { label: tia.getDebugNoCollisions() ? "ON" : "OFF", active: tia.getDebugNoCollisions() };
                default:
                    return { label: "Unknown", active: false };
            }
        };

        var controls;
    }


    // SavestateSocket  -----------------------------------------

    function SaveStateSocket() {

        this.connectMedia = function(pMedia) {
            media = pMedia;
        };

        this.getMedia = function() {
            return media;
        };

        this.cartridgeInserted = function(cartridge) {
            if (cartridge) cartridge.connectSaveStateSocket(this);
        };

        this.externalStateChange = function() {
            media.externalStateChange();
        };

        this.saveState = function(slot) {
            if (!self.powerIsOn) return;
            var state = saveState();
            state.v = VERSION;
            if (media.saveState(slot, state))
                self.showOSD("State " + slot + " saved", true);
            else
                self.showOSD("State " + slot + " save failed", true);
        };

        this.loadState = function(slot) {
            var state = media.loadState(slot);
            if (!state) {
                self.showOSD("State " + slot + " not found", true);
                return;
            }
            if (state.v !== VERSION) {
                self.showOSD("State " + slot + " load failed, wrong version", true);
                return;
            }
            if (!self.powerIsOn) self.powerOn(true);    // true = from state loading
            loadState(state);
            self.showOSD("State " + slot + " loaded", true);
        };

        this.saveStateFile = function() {
            if (!self.powerIsOn) return;
            // Use Cartrige label as file name
            var fileName = cartridgeSocket.inserted() && cartridgeSocket.inserted().rom.info.l;
            var state = saveState();
            state.v = VERSION;
            if (media.saveStateFile(fileName, state))
                self.showOSD("State Cartridge saved", true);
            else
                self.showOSD("State file save failed", true);
        };

        this.loadStateFile = function(data) {       // Return true if data was indeed a SaveState
            var state = media.loadStateFile(data);
            if (!state) return;
            if (state.v !== VERSION) {
                self.showOSD("State file load failed, wrong version", true);
                return true;
            }
            if (!self.powerIsOn) self.powerOn();
            loadState(state);
            self.showOSD("State file loaded", true);
            return true;
        };

        var media;
        var VERSION = 2;
    }


    // Audio Socket  ---------------------------------------------

    function AudioSocket() {

        this.connectMonitor = function (pMonitor) {
            monitor = pMonitor;
            for (var i = signals.length - 1; i >= 0; i--) monitor.connectAudioSignal(signals[i]);
        };

        this.connectAudioSignal = function(signal) {
            if (signals.indexOf(signal) >= 0) return;
            jt.Util.arrayAdd(signals, signal);
            this.flushAllSignals();                            // To always keep signals in synch
            signal.setFps(fps);
            if (monitor) monitor.connectAudioSignal(signal);
        };

        this.disconnectAudioSignal = function(signal) {
            jt.Util.arrayRemoveAllElement(signals, signal);
            if (monitor) monitor.disconnectAudioSignal(signal);
        };

        this.audioClockPulse = function() {
            for (var i = signals.length - 1; i >= 0; --i) signals[i].audioClockPulse();
        };

        this.audioFinishFrame = function() {
            for (var i = signals.length - 1; i >= 0; --i) signals[i].audioFinishFrame();
        };

        this.muteAudio = function() {
            if (monitor) monitor.mute();
        };

        this.unMuteAudio = function() {
            if (monitor) monitor.unMute();
        };

        this.setFps = function(pFps) {
            fps = pFps;
            for (var i = signals.length - 1; i >= 0; --i) signals[i].setFps(fps);
        };

        this.pauseAudio = function() {
            if (monitor) monitor.pause();
        };

        this.unpauseAudio = function() {
            if (monitor) monitor.unpause();
        };

        this.flushAllSignals = function() {
            for (var i = signals.length - 1; i >= 0; --i) signals[i].flush();
        };

        var signals = [];
        var monitor;
        var fps;
    }


    // Debug methods  ------------------------------------------------------

    this.eval = function(str) {
        return eval(str);
    };


    init();

};