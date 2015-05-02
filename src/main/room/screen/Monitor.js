// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.Monitor = function() {

    function init(self) {
        prepareResources();
        adjustToVideoStandard(jt.VideoStandard.NTSC);
        setDisplayDefaultSize();
        controls = new jt.DOMMonitorControls(self);
    }

    this.connectDisplay = function(monitorDisplay) {
        display = monitorDisplay;
        var scX = display.displayDefaultOpeningScaleX(displayWidth, displayHeight);
        setDisplayScale(scX, scX / DEFAULT_SCALE_ASPECT_X);
        displayCenter();
    };

    this.connectPeripherals = function(pROMLoader) {
        romLoader = pROMLoader;
    };

    this.connect = function(pVideoSignal, pCartridgeSocket) {
        pCartridgeSocket.addInsertionListener(this);
        videoSignal = pVideoSignal;
        videoSignal.connectMonitor(this);
        adjustToVideoSignal();
    };

    this.addControlInputElements = function(elements) {
        controls.addInputElements(elements);
    };

    this.nextLine = function(pixels, vSynchSignal) {
        // Adjusts to the new signal state (on or off) as necessary
        if (!signalState(pixels !== null))		// If signal is off, we are done
            return false;
        // Process new line received
        var vSynched = false;
        if (line < signalHeight) {
            // Copy to the back buffer only contents that will be displayed
            if (line >= displayOriginY && line < displayOriginY + displayHeight) {
                if (backBuffer)
                    jt.Util.arrayCopy(pixels, displayOriginX, backBuffer, (line - displayOriginY) * signalWidth, displayWidth);
                else
                    jt.Util.uInt32ArrayCopyToUInt8Array(pixels, displayOriginX, backData, (line - displayOriginY) * signalWidth, displayWidth);
            }
        } else
            vSynched = maxLineExceeded();
        line++;
        if (!videoStandardDetected) videoStandardDetectionFrameLineCount++;
        if (vSynchSignal) {
            if (!videoStandardDetected) videoStandardDetectionNewFrame();
            vSynched = newFrame() || vSynched;
        }
        return vSynched;
    };

    this.synchOutput = function() {
        refresh();
    };

    this.currentLine = function() {
        return line;
    };

    this.showOSD = function(message, overlap) {
        display.showOSD(message, overlap);
    };

    this.videoStandardDetectionStart = function() {
        videoStandardDetected = null;
        videoStandardDetectionFrameCount = 0;
        videoStandardDetectionFrameLineCount = 0;
    };

    this.getVideoStandardDetected = function() {
        return videoStandardDetected;
    };

    this.cartridgeInserted = function(cartridge) {
        // Only change mode if not forced
        if (CRT_MODE >= 0) return;
        if (crtMode === 0 || crtMode === 1)
            setCrtMode(!cartridge ? 0 : cartridge.rom.info.c || 0);
    };

    var newFrame = function() {
        if (line < signalHeight - VSYNC_TOLERANCE) return false;

        if (showStats) display.showOSD(videoSignal.standard.name + "  " + line + " lines" /* ,  CRT mode: " + crtModeNames[crtMode] */, true);

        // Start a new frame
        line = 0;
        frame++;
        return true;
    };

    var maxLineExceeded = function() {
        if (line > signalHeight + VSYNC_TOLERANCE + EXTRA_UPPER_VSYNC_TOLERANCE) {
            //if (debug > 0) Util.log("Display maximum scanlines exceeded: " + line);
            return newFrame();
        }
        return false;
    };

    var signalState = function(state) {
        if (state) {
            signalOn = true;
            adjustToVideoSignal();
        } else {
            signalOn = false;
            adjustToVideoSignalOff();
        }
        return state;
    };

    var adjustToVideoStandard = function(videoStandard) {
        signalStandard = videoStandard;
        signalWidth = videoStandard.width;
        signalHeight = videoStandard.height;
        setDisplaySize(displayWidth, displayHeightPct);
        setDisplayOrigin(displayOriginX, displayOriginYPct);
    };

    var videoStandardDetectionNewFrame = function() {
        var linesCount = videoStandardDetectionFrameLineCount;
        videoStandardDetectionFrameLineCount = 0;
        // Only consider frames with linesCount in range with tolerances (NTSC 262, PAL 312)
        if ((linesCount >= 250 && linesCount <= 281)
            || (linesCount >= 300 && linesCount <= 325))
            if (++videoStandardDetectionFrameCount >= 5)
                videoStandardDetectionFinish(linesCount);
    };

    var videoStandardDetectionFinish = function(linesCount) {
        videoStandardDetected = linesCount < 290 ? jt.VideoStandard.NTSC : jt.VideoStandard.PAL;

        // Compute an additional number of lines to make the display bigger, if needed
        // Only used when the detected number of lines per frame is bigger than standard by a reasonable amount
        var prevAdd = videoStandardDetectionAdtLinesPerFrame;
        var newAdd = linesCount - videoStandardDetected.height;
        if (newAdd > 2) newAdd = (newAdd > 6 ? 6 : newAdd) - 2;
        else newAdd = 0;

        // Only sets size now if additional lines changed
        if (newAdd != prevAdd) {
            videoStandardDetectionAdtLinesPerFrame = newAdd;
            adjustToVideoStandard(videoStandardDetected);
        }
    };

    var adjustToVideoSignal = function() {
        if (signalStandard != videoSignal.standard)
            adjustToVideoStandard(videoSignal.standard);
    };

    var adjustToVideoSignalOff = function() {
        line = 0;
        display.adjustToVideoSignalOff();
    };

    var setDisplayDefaultSize = function() {
        setDisplaySize(DEFAULT_WIDTH, DEFAULT_HEIGHT_PCT);
        setDisplayOrigin(DEFAULT_ORIGIN_X, DEFAULT_ORIGIN_Y_PCT);
        if (display != null) {
            var scX = display.displayDefaultOpeningScaleX(displayWidth, displayHeight);
            setDisplayScale(scX, scX / DEFAULT_SCALE_ASPECT_X);
        } else
            setDisplayScale(DEFAULT_SCALE_X, DEFAULT_SCALE_Y);
        displayCenter();
    };

    var setDisplayOrigin = function(x, yPct) {
        displayOriginX = x;
        if (displayOriginX < 0) displayOriginX = 0;
        else if (displayOriginX > signalWidth - displayWidth) displayOriginX = signalWidth - displayWidth;

        displayOriginYPct = yPct;
        if (displayOriginYPct < 0) displayOriginYPct = 0;
        else if ((displayOriginYPct / 100 * signalHeight) > signalHeight - displayHeight)
            displayOriginYPct = (signalHeight - displayHeight) / signalHeight * 100;

        // Compute final display originY, adding a little for additional lines as discovered in last video standard detection
        var adtOriginY = videoStandardDetectionAdtLinesPerFrame / 2;
        displayOriginY = ((displayOriginYPct / 100 * signalHeight) + adtOriginY) | 0;
        if ((displayOriginY + displayHeight) > signalHeight) displayOriginY = signalHeight - displayHeight;
    };

    var setDisplaySize = function(width, heightPct) {
        displayWidth = width;
        if (displayWidth < 10) displayWidth = 10;
        else if (displayWidth > signalWidth) displayWidth = signalWidth;

        displayHeightPct = heightPct;
        if (displayHeightPct < 10) displayHeightPct = 10;
        else if (displayHeightPct > 100) displayHeightPct = 100;

        // Compute final display height, considering additional lines as discovered in last video standard detection
        displayHeight = (displayHeightPct / 100 * (signalHeight + videoStandardDetectionAdtLinesPerFrame)) | 0;
        if (displayHeight > signalHeight) displayHeight = signalHeight;

        setDisplayOrigin(displayOriginX, displayOriginYPct);
        displayUpdateSize();
    };

    var displayUpdateSize = function() {
        if (!display) return;
        display.displaySize((displayWidth * displayScaleX) | 0, (displayHeight * displayScaleY) | 0);
        display.displayMinimumSize((displayWidth * DEFAULT_SCALE_X / DEFAULT_SCALE_Y) | 0, displayHeight);
    };

    var setDisplayScale = function(x, y) {
        displayScaleX = x;
        if (displayScaleX < 1) displayScaleX = 1;
        displayScaleY = y;
        if (displayScaleY < 1) displayScaleY = 1;
        displayUpdateSize();
    };

    var setDisplayScaleDefaultAspect = function(y) {
        var scaleY = y | 0;
        if (scaleY < 1) scaleY = 1;
        setDisplayScale(scaleY * DEFAULT_SCALE_ASPECT_X, scaleY);
    };

    var displayCenter = function() {
        if (display) display.displayCenter();
    };

    var refresh = function() {
        if (!signalOn) return;

        // First paint the offscreen canvas with new frame data
        offContext.putImageData(offImageData, 0, 0);
        // Then refresh display with the new image (canvas) and correct dimensions
        display.refresh(offCanvas, displayWidth, displayHeight);

        if (debug > 0) cleanBackBuffer();
    };

    var toggleFullscreen = function() {
        display.displayToggleFullscreen();
    };

    var crtModeToggle = function() {
        setCrtMode(crtMode + 1);
    };

    var setCrtMode = function(mode) {
        var newMode = mode > 4 || mode < 0 ? 0 : mode;
        if (crtMode === newMode) return;
        crtMode = newMode;
        display.showOSD("CRT mode: " + CRT_MODE_NAMES[crtMode], true);
    };

    var exit = function() {
        display.exit();
    };

    var prepareResources = function() {
        offCanvas = document.createElement('canvas');
        offCanvas.width = jt.VideoStandard.PAL.width;
        offCanvas.height = jt.VideoStandard.PAL.height;
        offContext = offCanvas.getContext("2d");
        offImageData = offContext.getImageData(0, 0, offCanvas.width, offCanvas.height);
        if (offImageData.data.buffer)
            backBuffer = new Uint32Array(offImageData.data.buffer);
        else {
            // Needed for IE compatibility, which has no underlying buffer
            backData = offImageData.data;
        }
    };

    var cleanBackBuffer = function() {
        // Put a nice green for detection of undrawn lines, for debug purposes
        if (backBuffer) jt.Util.arrayFill(backBuffer, 0xff00ff00);
    };

    var cartridgeChangeDisabledWarning = function() {
        if (Javatari.CARTRIDGE_CHANGE_DISABLED) {
            display.showOSD("Cartridge change is disabled", true);
            return true;
        }
        return false;
    };


    // Controls Interface  -----------------------------------------

    var monControls = jt.Monitor.Controls;

    this.controlActivated = function(control) {
        // All controls are Press-only and repeatable
        switch(control) {
            case monControls.LOAD_CARTRIDGE_FILE:
                if (!cartridgeChangeDisabledWarning()) romLoader.openFileChooserDialog(true);
                break;
            case monControls.LOAD_CARTRIDGE_FILE_NO_AUTO_POWER:
                if (!cartridgeChangeDisabledWarning()) romLoader.openFileChooserDialog(false);
                break;
            case monControls.LOAD_CARTRIDGE_URL:
                if (!cartridgeChangeDisabledWarning()) romLoader.openURLChooserDialog(true);
                break;
            case monControls.LOAD_CARTRIDGE_URL_NO_AUTO_POWER:
                if (!cartridgeChangeDisabledWarning()) romLoader.openURLChooserDialog(false);
                break;
            case monControls.LOAD_CARTRIDGE_PASTE:
                if (!cartridgeChangeDisabledWarning()) romLoader.openFileChooserDialog();
                break;
            case monControls.CRT_MODES:
                crtModeToggle(); break;
            case monControls.CRT_FILTER:
                display.toggleCRTFilter(); break;
            case monControls.STATS:
                showStats = !showStats; display.showOSD(null, true); break;
            case monControls.DEBUG:
                debug++;
                if (debug > 4) debug = 0;
                break;
            case monControls.ORIGIN_X_MINUS:
                setDisplayOrigin(displayOriginX + 1, displayOriginYPct); break;
            case monControls.ORIGIN_X_PLUS:
                setDisplayOrigin(displayOriginX - 1, displayOriginYPct); break;
            case monControls.ORIGIN_Y_MINUS:
                setDisplayOrigin(displayOriginX, displayOriginYPct + 0.5); break;
            case monControls.ORIGIN_Y_PLUS:
                setDisplayOrigin(displayOriginX, displayOriginYPct - 0.5); break;
            case monControls.SIZE_DEFAULT:
                setDisplayDefaultSize(); break;
            case monControls.FULLSCREEN:
                toggleFullscreen(); break;
            case monControls.EXIT:
                exit(); break;
        }
        if (fixedSizeMode) return;
        switch(control) {
            case monControls.WIDTH_MINUS:
                setDisplaySize(displayWidth - 1, displayHeightPct); break;
            case monControls.WIDTH_PLUS:
                setDisplaySize(displayWidth + 1, displayHeightPct); break;
            case monControls.HEIGHT_MINUS:
                setDisplaySize(displayWidth, displayHeightPct - 0.5); break;
            case monControls.HEIGHT_PLUS:
                setDisplaySize(displayWidth, displayHeightPct + 0.5); break;
            case monControls.SCALE_X_MINUS:
                setDisplayScale(displayScaleX - 0.5, displayScaleY); break;
            case monControls.SCALE_X_PLUS:
                setDisplayScale(displayScaleX + 0.5, displayScaleY); break;
            case monControls.SCALE_Y_MINUS:
                setDisplayScale(displayScaleX, displayScaleY - 0.5); break;
            case monControls.SCALE_Y_PLUS:
                setDisplayScale(displayScaleX, displayScaleY + 0.5); break;
            case monControls.SIZE_MINUS:
                setDisplayScaleDefaultAspect(displayScaleY - 1); break;
            case monControls.SIZE_PLUS:
                setDisplayScaleDefaultAspect(displayScaleY + 1); break;
        }
    };


    var display;
    var romLoader;

    var videoSignal;
    var controls;

    var line = 0;
    var frame = 0;

    var offCanvas;
    var offContext;
    var offImageData;

    var backBuffer;
    var backData;       // Needed for IE compatibility, which has no underlying buffer

    var signalOn = false;
    var signalStandard;
    var signalWidth;
    var signalHeight;

    var displayWidth;
    var displayHeight;
    var displayHeightPct;
    var displayOriginX;
    var displayOriginY;
    var displayOriginYPct;
    var displayScaleX;
    var displayScaleY;

    var videoStandardDetected;
    var videoStandardDetectionFrameCount;
    var videoStandardDetectionFrameLineCount = 0;
    var videoStandardDetectionAdtLinesPerFrame = 0;

    var debug = 0;
    var showStats = false;
    var fixedSizeMode = Javatari.SCREEN_RESIZE_DISABLED;

    var DEFAULT_ORIGIN_X = 68;
    var DEFAULT_ORIGIN_Y_PCT = 12.4;		// Percentage of height
    var DEFAULT_WIDTH = 160;
    var DEFAULT_HEIGHT_PCT = 81.5;	        // Percentage of height
    var DEFAULT_SCALE_X = 4;
    var DEFAULT_SCALE_ASPECT_X = 2;
    var DEFAULT_SCALE_Y = 2;
    var VSYNC_TOLERANCE = 16;
    var EXTRA_UPPER_VSYNC_TOLERANCE = 5;
    var CRT_MODE = Javatari.SCREEN_CRT_MODE;
    var CRT_MODE_NAMES = [ "OFF", "Phosphor", "Phosphor Scanlines", "RGB", "RGB Phosphor" ];

    var crtMode = CRT_MODE < 0 ? 0 : CRT_MODE;


    init(this);

};

jt.Monitor.Controls = {
    WIDTH_PLUS: 1, HEIGHT_PLUS: 2,
    WIDTH_MINUS: 3, HEIGHT_MINUS: 4,
    ORIGIN_X_PLUS: 5, ORIGIN_Y_PLUS: 6,
    ORIGIN_X_MINUS: 7, ORIGIN_Y_MINUS: 8,
    SCALE_X_PLUS: 9, SCALE_Y_PLUS: 10,
    SCALE_X_MINUS: 11, SCALE_Y_MINUS: 12,
    SIZE_PLUS: 13, SIZE_MINUS: 14,
    SIZE_DEFAULT: 15,
    FULLSCREEN: 16,
    LOAD_CARTRIDGE_FILE: 21, LOAD_CARTRIDGE_FILE_NO_AUTO_POWER: 22,
    LOAD_CARTRIDGE_URL: 23, LOAD_CARTRIDGE_URL_NO_AUTO_POWER: 24,
    LOAD_CARTRIDGE_PASTE: 25,
    CRT_FILTER: 31, CRT_MODES: 32,
    DEBUG: 41, STATS: 42,
    EXIT: 51
};