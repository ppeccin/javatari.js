// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.Monitor = function(display) {
"use strict";

    var self = this;

    function init() {
        prepareResources();
        setDisplayDefaultSize();
        self.setVideoStandard(videoStandard);
    }

    this.connect = function(pVideoSignal) {
        videoSignal = pVideoSignal;
        videoSignal.connectMonitor(this);
    };

    this.nextLine = function(pixels, vSynchSignal) {
        // Process new line received
        var vSynched = false;
        if (line < signalHeight) {
            // Copy to the back buffer only contents that will be displayed
            if (line >= viewportOriginY && line < viewportOriginY + viewportHeight)
                backBuffer.set(pixels, (line - viewportOriginY) * signalWidth);
        } else
            vSynched = maxLineExceeded();
        line++;
        if (!videoStandardDetected) videoStandardDetectionFrameLineCount++;
        if (vSynchSignal) {
            if (!videoStandardDetected) videoStandardDetectionNewFrame();
            vSynched |= newFrame();
        }
        return vSynched;
    };

    //this.nextLineNew = function(pixels, vSynchSignal) {
    //    // Process new line received
    //    var frameEnd = false;
    //    if (line < signalHeight) {
    //        // Copy to the back buffer only contents that will be displayed
    //        if (line >= viewportOriginY && line < viewportOriginY + viewportHeight)
    //            backBuffer.set(pixels, (line - viewportOriginY) * signalWidth);
    //    } else
    //        frameEnd = maxLineExceeded();
    //    line++;
    //    if (!videoStandardDetected) ++videoStandardDetectionFrameLineCount;
    //    if (vSynchActive ^ vSynchSignal) {
    //        vSynchActive = vSynchSignal;
    //        if (!vSynchSignal) {
    //            if (!videoStandardDetected) videoStandardDetectionNewFrame();
    //            return newFrame();
    //        }
    //    }
    //    return frameEnd;
    //};

    var newFrame = function() {
        if (line < minLinesToSync) return false;

        if (showInfo) display.showOSD(videoStandard.name + "  " + line + " lines" /* ,  CRT mode: " + crtModeNames[crtMode] */, true);

        // Start a new frame
        line = 0;
        frame++;
        return true;
    };

    var maxLineExceeded = function() {
        if (line > maxLinesToSync) {
            //if (debug > 0) Util.log("Display maximum scanlines exceeded: " + line);
            return newFrame();
        } else
            return false;
    };

    this.setVideoStandard = function(standard) {
        videoStandard = standard;
        signalWidth = standard.totalWidth;
        signalHeight = standard.totalHeight;
        minLinesToSync = signalHeight - VSYNC_TOLERANCE;
        maxLinesToSync = signalHeight + VSYNC_TOLERANCE + EXTRA_UPPER_VSYNC_TOLERANCE;
        if (isDefaultViewport) {
            viewportHeightPct = videoStandard.defaultHeightPct;
            viewportOriginYPct = videoStandard.defaultOriginYPct;
        }
        setViewportSize(viewportWidth, viewportHeightPct);
        setViewportOrigin(viewportOriginX, viewportOriginYPct);
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
        var newAdd = linesCount - videoStandardDetected.totalHeight;
        if (newAdd > 2) newAdd = (newAdd > 6 ? 6 : newAdd) - 2;
        else newAdd = 0;

        // Only sets size now if additional lines changed
        if (newAdd != prevAdd) {
            videoStandardDetectionAdtLinesPerFrame = newAdd;
            self.setVideoStandard(videoStandardDetected);
        }
    };

    this.videoSignalOff = function() {
        line = 0;
        display.videoSignalOff();
    };

    var setViewportOrigin = function(x, yPct) {
        viewportOriginX = x;
        if (viewportOriginX < 0) viewportOriginX = 0;
        else if (viewportOriginX > signalWidth - viewportWidth) viewportOriginX = signalWidth - viewportWidth;

        viewportOriginYPct = yPct;
        if (viewportOriginYPct < 0) viewportOriginYPct = 0;
        else if ((viewportOriginYPct / 100 * signalHeight) > signalHeight - viewportHeight)
            viewportOriginYPct = (signalHeight - viewportHeight) / signalHeight * 100;

        // Compute final display originY, adding a little for additional lines as discovered in last video standard detection
        var adtOriginY = videoStandardDetectionAdtLinesPerFrame / 2;
        viewportOriginY = ((viewportOriginYPct / 100 * signalHeight) + adtOriginY) | 0;
        if ((viewportOriginY + viewportHeight) > signalHeight) viewportOriginY = signalHeight - viewportHeight;
    };

    var setViewportSize = function(width, heightPct) {
        viewportWidth = width;
        if (viewportWidth < 10) viewportWidth = 10;
        else if (viewportWidth > signalWidth) viewportWidth = signalWidth;

        viewportHeightPct = heightPct;
        if (viewportHeightPct < 10) viewportHeightPct = 10;
        else if (viewportHeightPct > 100) viewportHeightPct = 100;

        // Compute final display height, considering additional lines as discovered in last video standard detection
        viewportHeight = (viewportHeightPct / 100 * (signalHeight + videoStandardDetectionAdtLinesPerFrame)) | 0;
        if (viewportHeight > signalHeight) viewportHeight = signalHeight;

        offCanvas.width = viewportWidth;
        offCanvas.height = viewportHeight;

        setViewportOrigin(viewportOriginX, viewportOriginYPct);
        displayUpdateSize();
    };

    var displayUpdateSize = function() {
        if (!display) return;
        display.displayMetrics(viewportWidth, viewportHeight);
    };

    var setDisplayDefaultSize = function() {
        isDefaultViewport = true;
        viewportOriginX = DEFAULT_ORIGIN_X;
        viewportOriginYPct = videoStandard.defaultOriginYPct;
        setViewportSize(DEFAULT_WIDTH, videoStandard.defaultHeightPct);
    };

    var prepareResources = function() {
        offCanvas = document.createElement('canvas');
        offCanvas.width = DEFAULT_WIDTH;
        offCanvas.height = DEFAULT_HEIGHT;
        offContext = offCanvas.getContext("2d", { alpha: false, antialias: false });
        offContext.globalCompositeOperation = "copy";
        offContext.globalAlpha = 1;
        offImageData = offContext.createImageData(jt.VideoStandard.PAL.totalWidth, jt.VideoStandard.PAL.totalHeight);
        backBuffer = new Uint32Array(offImageData.data.buffer);
    };

    this.currentLine = function() {
        return line;
    };

    this.refresh = function() {
        // First paint the offscreen canvas with new frame data
        offContext.putImageData(offImageData, -viewportOriginX, 0, viewportOriginX, 0, viewportWidth, viewportHeight);

        // Then refresh display with the new image (canvas) and correct dimensions
        display.refresh(offCanvas, viewportWidth, viewportHeight);

        //if (debug > 0) cleanBackBuffer();
    };

    this.videoStandardDetectionStart = function() {
        videoStandardDetected = null;
        videoStandardDetectionFrameCount = 0;
        videoStandardDetectionFrameLineCount = 0;
    };

    this.getVideoStandardDetected = function() {
        return videoStandardDetected;
    };

    this.toggleShowInfo = function() {
        showInfo = !showInfo;
        if (!showInfo) display.showOSD(null, true);
    };

    this.signalOff = function() {
        display.videoSignalOff();
    };

    this.showOSD = function(message, overlap, error) {
        display.showOSD(message, overlap, error);
    };

    this.setDefaults = function() {
        setDisplayDefaultSize();
        display.crtModeSetDefault();
        display.crtFilterSetDefault();
        display.requestReadjust(true);
    };

    this.setDebugMode = function(boo) {
        display.setDebugMode(boo);
    };

    this.crtModeToggle = function() {
        display.crtModeToggle();
    };

    this.crtFilterToggle = function() {
        display.crtFilterToggle();
    };

    this.fullscreenToggle = function() {
        display.displayToggleFullscreen();
    };

    this.displayAspectDecrease = function() {
        this.displayScale(normalizeAspectX(displayAspectX - SCALE_STEP), displayScaleY);
        this.showOSD("Display Aspect: " + displayAspectX.toFixed(2) + "x", true);
    };

    this.displayAspectIncrease = function() {
        this.displayScale(normalizeAspectX(displayAspectX + SCALE_STEP), displayScaleY);
        this.showOSD("Display Aspect: " + displayAspectX.toFixed(2) + "x", true);
    };

    this.displayScaleDecrease = function() {
        this.displayScale(displayAspectX, normalizeScaleY(displayScaleY - SCALE_STEP));
        this.showOSD("Display Size: " + displayScaleY.toFixed(2) + "x", true);
    };

    this.displayScaleIncrease = function() {
        this.displayScale(displayAspectX, normalizeScaleY(displayScaleY + SCALE_STEP));
        this.showOSD("Display Size: " + displayScaleY.toFixed(2) + "x", true);
    };

    this.viewportOriginDecrease = function() {
        isDefaultViewport = false;
        setViewportOrigin(viewportOriginX, viewportOriginYPct + ORIGIN_Y_STEP);
        this.showOSD("Viewport Origin: " + viewportOriginY, true);
    };

    this.viewportOriginIncrease = function() {
        isDefaultViewport = false;
        setViewportOrigin(viewportOriginX, viewportOriginYPct - ORIGIN_Y_STEP);
        this.showOSD("Viewport Origin: " + viewportOriginY, true);
    };

    this.viewportSizeDecrease = function() {
        setDisplayDefaultSize();
        this.showOSD("Viewport Size: Standard", true);
    };

    this.viewportSizeIncrease = function() {
        isDefaultViewport = false;
        setViewportSize(signalWidth, 100);
        this.showOSD("Viewport Size: Full Signal", true);
    };

    this.displayScale = function(aspectX, scaleY) {
        displayAspectX = aspectX;
        displayScaleY = scaleY;
        display.displayScale(displayAspectX, displayScaleY);
    };

    function normalizeAspectX(aspectX) {
        var ret = aspectX < 0.5 ? 0.5 : aspectX > 2.5 ? 2.5 : aspectX;
        return Math.round(ret * 10) / 10;
    }

    function normalizeScaleY(scaleY) {
        var ret = scaleY < 0.5 ? 0.5 : scaleY;
        return Math.round(ret * 10) / 10;
    }

    this.controlStateChanged = function(control, state) {
        display.controlStateChanged(control, state);
    };

    this.controlsStatesRedefined = function() {
        display.controlsStatesRedefined();
    };

    this.consolePowerAndUserPauseStateUpdate = function(power, paused) {
        display.consolePowerAndUserPauseStateUpdate(power, paused);
    };

    this.cartridgeInserted = function(cart) {
        display.cartridgeInserted(cart);
    };


    var offCanvas;
    var offContext;
    var offImageData;
    var backBuffer;

    var videoSignal;
    var signalWidth;
    var signalHeight;
    var videoStandard = jt.VideoStandard.NTSC;

    var minLinesToSync;
    var maxLinesToSync;

    var line = 0;
    var frame = 0;

    var viewportWidth;
    var viewportHeight;
    var viewportHeightPct;
    var viewportOriginX;
    var viewportOriginY;
    var viewportOriginYPct;
    var isDefaultViewport = true;

    var displayAspectX;
    var displayScaleY;

    var videoStandardDetected;
    var videoStandardDetectionFrameCount;
    var videoStandardDetectionFrameLineCount = 0;
    var videoStandardDetectionAdtLinesPerFrame = 0;

    var showInfo = false;

    var DEFAULT_WIDTH = 160;
    var DEFAULT_HEIGHT = 213;
    var DEFAULT_ORIGIN_X = 68;
    var VSYNC_TOLERANCE = 16;
    var EXTRA_UPPER_VSYNC_TOLERANCE = 5;

    var SCALE_STEP = 0.1;
    var ORIGIN_Y_STEP = 0.4;


    init();

};


