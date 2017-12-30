// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.Room = function(screenElement, consoleStartPowerOn) {
"use strict";

    var self = this;

    this.enterStandaloneMode = function() {
        this.netPlayMode = 0;
        this.netServer = undefined;
        self.mainVideoClock.go();       // Local Clock
    };

    this.enterNetServerMode = function(netServer) {
        this.netPlayMode = 1;
        this.netServer = netServer;
        self.mainVideoClock.go();       // Local Clock, also sent to Client
    };

    this.enterNetClientMode = function() {
        this.netPlayMode = 2;
        self.mainVideoClock.pause();    // Clock comes Server
    };

    function init() {
        buildMainClock();
        buildPeripherals();
        buildAndPlugConsole();
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

    this.setLoading = function(boo) {
        if (this.isLoading === boo) return;
        this.isLoading = boo;
        this.console.setLoading(this.isLoading);
        this.screen.setLoading(this.isLoading);
    };

    this.start = function(startAction) {
        jt.Clock.detectHostNativeFPSAndCallback(function(nativeFPS) {
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

    this.videoClockPulse = function() {
        self.console.videoClockPulse();

        if (self.netServer) self.netServer.broadcastClockPulse();
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
        // Main clock will be the Tia Frame VideoClock (60Hz/50Hz)
        // CPU and other clocks (Pia, Audio) will be sent by the Tia
        // Clock frequency will be changed directly by the Console
        self.mainVideoClock = new jt.Clock(self.videoClockPulse);
    }

    function buildPeripherals() {
        self.peripheralControls = new jt.DOMPeripheralControls();
        self.consoleControls = new jt.DOMConsoleControls(self.peripheralControls);
        self.fileDownloader = new jt.FileDownloader();
        self.stateMedia = new jt.LocalStorageSaveStateMedia();
        self.recentROMs = new jt.RecentStoredROMs();
        self.fileLoader = new jt.FileLoader(self.recentROMs);
        self.speaker = new jt.WebAudioSpeaker(screenElement);
        self.screen = new jt.CanvasDisplay(screenElement);

        self.fileDownloader.connectPeripherals(self.screen);
        self.screen.connectPeripherals(self.recentROMs, self.fileLoader, self.fileDownloader, self.consoleControls, self.peripheralControls, self.stateMedia);
        self.speaker.connectPeripherals(self.screen);
        self.consoleControls.connectPeripherals(self.screen);
        self.stateMedia.connectPeripherals(self.fileDownloader);
        self.peripheralControls.connectPeripherals(self.screen, self.speaker, self.consoleControls, self.fileLoader);
    }

    function buildAndPlugConsole() {
        self.console = new jt.AtariConsole(self.mainVideoClock);
        self.stateMedia.connect(self.console.getSavestateSocket());
        self.fileLoader.connect(self.console);
        self.screen.connect(self.console);
        self.speaker.connect(self.console.getAudioSocket());
        self.consoleControls.connect(self.console.getConsoleControlsSocket());
        self.peripheralControls.connect(self.console.getConsoleControlsSocket(), self.console.getCartridgeSocket());
        // Cartridge Data operations unavailable self.console.getCartridgeSocket().connectFileDownloader(self.fileDownloader);
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

    this.netPlayMode = 0;       // 0 = standalone, 1 = server, 2 = client
    this.netServer = undefined;

    this.isLoading = false;

    var roomPowerOnTime;


    init();

};

