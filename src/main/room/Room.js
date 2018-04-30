// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.Room = function(screenElement, consoleStartPowerOn) {
"use strict";

    var self = this;

    function init() {
        buildMainClock();
        buildPeripherals();
        buildAndPlugConsole();
        Javatari.userROMFormats.init();
    }

    this.powerOn = function() {
        self.screen.powerOn();
        self.speaker.powerOn();
        self.consoleControls.powerOn();
        self.setLoading(true);
        self.enterStandaloneMode();
        roomPowerOnTime = Date.now();
    };

    this.powerOff = function() {
        self.console.powerOff();
        self.consoleControls.powerOff();
        self.speaker.powerOff();
        self.screen.powerOff();
    };

    this.getNetServer = function() {
        if (!this.netServer) this.netServer = new jt.NetServer(this);
        return this.netServer;
    };

    this.getNetClient = function() {
        if (!this.netClient) this.netClient = new jt.NetClient(this);
        return this.netClient;
    };

    this.setLoading = function(boo) {
        if (this.isLoading === boo) return;
        this.isLoading = boo;
        this.console.setLoading(this.isLoading);
        this.screen.setLoading(this.isLoading);
    };

    this.start = function(startAction) {
        this.mainVideoClock.detectHostNativeFPSAndCallback(function(nativeFPS) {
            self.console.vSynchSetSupported(nativeFPS > 0);
            afterPowerONDelay(function () {
                self.setLoading(false);
                self.screen.start(startAction || consolePowerOnStartAction);
            });
        });
    };

    this.showOSD = function(message, overlap, error) {
        this.console.showOSD(message, overlap, error);
    };

    this.mainVideoClockPulse = function() {
        if (self.console.isSystemPaused()) return;

        if (self.netController)
            self.netController.netVideoClockPulse();
        else {
            self.console.getConsoleControlsSocket().controlsClockPulse();
            self.console.videoClockPulse();
        }
    };

    this.enterStandaloneMode = function() {
        var oldMode = this.netPlayMode;
        this.netPlayMode = 0;
        this.netController = undefined;
        self.mainVideoClock.go();       // Local Clock

        // Restore state from before NetPlay if any
        if (this.netPlayStateBeforeClientMode) {
            this.console.loadState(this.netPlayStateBeforeClientMode);      // extended
            this.consoleControls.setP1ControlsAndPaddleMode(this.netPlayControlsModeBeforeClientMode.p1, this.netPlayControlsModeBeforeClientMode.pd);
            this.netPlayStateBeforeClientMode = undefined;
        }

        if (oldMode !== this.netPlayMode) this.screen.roomNetPlayStatusChangeUpdate(oldMode);
    };

    this.enterNetServerMode = function(netServer) {
        var oldMode = this.netPlayMode;
        this.netPlayMode = 1;
        this.netController = netServer;
        self.mainVideoClock.go();       // Local Clock, also sent to Client

        if (oldMode !== this.netPlayMode) this.screen.roomNetPlayStatusChangeUpdate(oldMode);
    };

    this.enterNetClientMode = function(netClient) {
        var oldMode = this.netPlayMode;
        this.netPlayMode = 2;
        this.netController = netClient;
        self.mainVideoClock.pause();    // Clock comes from Server

        // Save state from before NetPlay, to be restored when session is over
        this.netPlayStateBeforeClientMode = this.console.saveState(true);     // extended
        this.netPlayControlsModeBeforeClientMode = { p1: this.consoleControls.isP1ControlsMode(), pd: this.consoleControls.isPaddleMode() };

        if (oldMode !== this.netPlayMode) this.screen.roomNetPlayStatusChangeUpdate(oldMode);
    };

    this.enterNetPendingMode = function(netController) {
        var oldMode = this.netPlayMode;
        this.netPlayMode = netController === this.netServer ? -1 : -2;
        this.netController = undefined;
        self.mainVideoClock.go();       // Local Clock continued

        if (oldMode !== this.netPlayMode) this.screen.roomNetPlayStatusChangeUpdate(oldMode);
    };

    function afterPowerONDelay(func) {
        var wait = Javatari.AUTO_POWER_ON_DELAY;
        if (wait >= 0 && JavatariFullScreenSetup.shouldStartInFullScreen()) wait += 1400;   // Wait a bit more
        wait -= (Date.now() - roomPowerOnTime);
        if (wait < 1) wait = 1;
        setTimeout(func, wait);
    }

    function consolePowerOnStartAction() {
        if (!consoleStartPowerOn) return;
        if (self.console.getCartridgeSocket().inserted()) self.console.userPowerOn();
        else if (Javatari.CARTRIDGE_SHOW_RECENT && !Javatari.CARTRIDGE_CHANGE_DISABLED) self.screen.openCartridgeChooserDialog(true);   // Show even if no recent ROMs present
    }

    function buildMainClock() {
        // Clock frequency will be changed directly by the Console
        self.mainVideoClock = new jt.Clock(self.mainVideoClockPulse);
    }

    function buildPeripherals() {
        self.peripheralControls = new jt.DOMPeripheralControls(self);
        self.consoleControls = new jt.DOMConsoleControls(self, self.peripheralControls);
        self.fileDownloader = new jt.FileDownloader();
        self.stateMedia = new jt.LocalStorageSaveStateMedia(self);
        self.recentROMs = new jt.RecentStoredROMs();
        self.fileLoader = new jt.FileLoader(self, self.recentROMs, self.peripheralControls);
        self.speaker = new jt.WebAudioSpeaker(screenElement);
        self.screen = new jt.CanvasDisplay(self, screenElement);

        self.fileDownloader.connectPeripherals(self.screen);
        self.screen.connectPeripherals(self.recentROMs, self.fileLoader, self.fileDownloader, self.consoleControls, self.peripheralControls, self.stateMedia);
        self.speaker.connectPeripherals(self.screen);
        self.consoleControls.connectPeripherals(self.screen);
        self.stateMedia.connectPeripherals(self.fileDownloader);
        self.peripheralControls.connectPeripherals(self.screen, self.speaker, self.consoleControls, self.fileLoader);
    }

    function buildAndPlugConsole() {
        self.console = new jt.AtariConsole();
        self.mainVideoClock.connect(self.console.getVideoClockSocket());
        self.stateMedia.connect(self.console.getSavestateSocket());
        self.fileLoader.connect(self.console);
        self.screen.connect(self.console);
        self.speaker.connect(self.console.getAudioSocket());
        self.consoleControls.connect(self.console.getConsoleControlsSocket());
        self.peripheralControls.connect(self.console.getCartridgeSocket());
        self.console.socketsConnected();
    }


    this.mainVideoClock = null;
    this.console = null;
    this.screen = null;
    this.speaker = null;
    this.consoleControls = null;
    this.fileDownloader = null;
    this.stateMedia = null;
    this.recentROMs = null;
    this.fileLoader = null;
    this.peripheralControls = null;

    this.netPlayMode = 0;       // -1 = pending, 0 = standalone, 1 = server, 2 = client
    this.netController = undefined;
    this.netServer = undefined;
    this.netClient = undefined;
    this.netPlayStateBeforeClientMode = undefined;
    this.netPlayControlsModeBeforeClientMode = undefined;

    this.isLoading = false;

    var roomPowerOnTime;


    // Debug methods  ------------------------------------------------------

    this.runFramesAtTopSpeed = function(frames) {
        this.mainVideoClock.pause();
        var start = jt.Util.performanceNow();
        for (var i = 0; i < frames; i++) {
            //var pulseTime = jt.Util.performanceNow();
            self.mainVideoClockPulse();
            //console.log(jt.Util.performanceNow() - pulseTime);
        }
        var duration = jt.Util.performanceNow() - start;
        jt.Util.log("Done running " + frames + " frames in " + (duration | 0) + " ms");
        jt.Util.log((frames / (duration/1000)).toFixed(2) + "  frames/sec");
        this.mainVideoClock.go();
    };


    init();

};

