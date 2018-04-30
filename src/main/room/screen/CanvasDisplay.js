// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// TODO Remove "Center" rounding problems as possible. Main screen element centering still remaining
// TODO Possible to use hotkeys and bypass logo messages

jt.CanvasDisplay = function(room, mainElement) {
"use strict";

    var self = this;

    function init() {
        jt.Util.insertCSS(jt.ScreenGUI.css());
        delete jt.ScreenGUI.css;
        setupMain();
        setupBar();
        setupFullscreen();
        consolePanel = new jt.ConsolePanel(self, consolePanelElement);
        monitor = new jt.Monitor(self);
    }

    this.connect = function(pConsole) {
        atariConsole = pConsole;
        monitor.connect(atariConsole.getVideoOutput());
        consoleControlsSocket = atariConsole.getConsoleControlsSocket();
        cartridgeSocket = atariConsole.getCartridgeSocket();
        consolePanel.connect(consoleControlsSocket);
    };

    this.connectPeripherals = function(pRecentROMs, pFileLoader, pFileDownloader, pConsoleControls, pPeripheralControls, pStateMedia) {
        recentROMs = pRecentROMs;
        fileLoader = pFileLoader;
        pFileLoader.registerForDnD(fsElement);
        pFileLoader.registerForFileInputElement(fsElement);
        fileDownloader = pFileDownloader;
        fileDownloader.registerForDownloadElement(fsElement);
        peripheralControls = pPeripheralControls;
        consoleControls = pConsoleControls;
        consoleControls.addKeyInputElement(fsElement);
        stateMedia = pStateMedia;
        consolePanel.connectPeripherals(pFileLoader, consoleControls, peripheralControls);
    };

    this.powerOn = function() {
        monitor.setDefaults();
        updateLogo();
        document.documentElement.classList.add("jt-started");
        setPageVisibilityHandling();
        this.focus();
        if (JavatariFullScreenSetup.shouldStartInFullScreen()) {
            setFullscreenState(true);
            setEnterFullscreenByAPIOnFirstTouch();
        }
    };

    this.powerOff = function() {
        document.documentElement.remove("jt-started");
    };

    this.start = function(startAction) {
        // Show mobile messages or start automatically
        if (isMobileDevice && !isBrowserStandalone && !isFullscreen) {
            // Install as App message
            if (jt.Util.isOfficialHomepage())
                showLogoMessage('For ' + (fullscreenAPIEnterMethod ? 'the best' : 'a full-screen') + ' experience, use<br>the "Add to Home Screen" function<br>then launch from the Installed App', "NICE!", false, startActionInFullScreen);
            // Go fullscreen message
            else
                showLogoMessage('For the best experience,<br>Javatari will go full-screen', "GO!", true, startActionInFullScreen);
        } else
            startAction();

        function startActionInFullScreen() {
            self.setFullscreen(true);
            startAction();
        }
    };

    this.refresh = function(image, sourceWidth, sourceHeight) {
        // Hide mouse cursor if not moving for some time
        if (cursorHideFrameCountdown > 0)
            if (--cursorHideFrameCountdown <= 0) hideCursorAndBar();

        // If needed, turn signal on and hide logo
        if (!signalIsOn) {
            signalIsOn = true;
            updateLogo();
        }

        // Update frame
        if (!canvasContext) createCanvasContext();
        canvasContext.drawImage(
            image,
            0, 0,
            canvas.width, canvas.height
        );

        //console.log("" + sourceWidth + "x" + sourceHeight + " > " + targetWidth + "x" + targetHeight);
    };

    this.videoSignalOff = function() {
        signalIsOn = false;
        showCursorAndBar();
        updateLogo();
    };

    this.mousePointerLocked = function(state) {
        mousePointerLocked = state;
        if (mousePointerLocked) hideCursorAndBar();
        else showCursorAndBar();
    };

    this.openHelp = function() {
        self.openSettings("GENERAL");
        return false;
    };

    this.openAbout = function() {
        self.openSettings("ABOUT");
        return false;
    };

    this.openSettings = function(page) {
        closeAllOverlays();
        if (!settingsDialog) settingsDialog = new jt.SettingsDialog(fsElementCenter, consoleControls);
        settingsDialog.show(page);
    };

    this.openSaveStateDialog = function(save) {
        closeAllOverlays();
        if (!saveStateDialog) saveStateDialog = new jt.SaveStateDialog(fsElementCenter, consoleControls, peripheralControls, stateMedia);
        saveStateDialog.show(save);
    };

    this.openQuickOptionsDialog = function() {
        closeAllOverlays();
        if (!quickOtionsDialog) quickOtionsDialog = new jt.QuickOptionsDialog(fsElementCenter, consoleControls, consoleControlsSocket, peripheralControls);
        quickOtionsDialog.show();
    };

    this.openNetPlayDialog = function() {
        closeAllOverlays();
        if (!netPlayDialog) netPlayDialog = new jt.NetPlayDialog(room, fsElementCenter);
        netPlayDialog.show();
    };

    this.openCartridgeFormatDialog = function(altPower) {
        closeAllOverlays();
        if (!cartFormatDialog) cartFormatDialog = new jt.CartridgeFormatDialog(this, fsElementCenter, atariConsole, cartridgeSocket);
        cartFormatDialog.show(altPower);
    };

    this.openLoadFileDialog = function(altPower, secPort) {
        fileLoader.openFileChooserDialog(jt.FileLoader.OPEN_TYPE.AUTO, altPower, secPort, false);
    };

    this.openRecentROMsDialog = function () {
        closeAllOverlays();
        if (!recentROMsDialog) recentROMsDialog = new jt.RecentROMsDialog(fsElementCenter, this, recentROMs, fileLoader);
        recentROMsDialog.show();
    };

    this.openCartridgeChooserDialog = function (force, altPower, secPort) {
        if (logoMessageActive) self.closeLogoMessage();      // May be invoked directly from outside!
        if (!force && recentROMs.getCatalog().length === 0) this.openLoadFileDialog(altPower, secPort);
        else this.openRecentROMsDialog();
    };

    this.toggleConsolePanel = function() {
        if (isFullscreen && isLandscape) consolePanelActiveLandscape = !consolePanelActiveLandscape;
        else consolePanelActivePortrait = !consolePanelActivePortrait;
        consolePanelUpdateForOrientation();
    };

    this.getControlReport = function(control) {
        // Only CRT Filter for now
        return { label: crtFilter === -2 ? "Browser" : crtFilter === -1 ? "Auto" : crtFilter === 0 ? "OFF" : "Level " + crtFilter, active: crtFilter >= 0 };
    };

    function consolePanelUpdateForOrientation() {
        setConsolePanelActive(isFullscreen && isLandscape ? consolePanelActiveLandscape : consolePanelActivePortrait);
    }

    function setConsolePanelActive(active) {
        if (consolePanelActive === active) return;
        consolePanelActive = active;
        consolePanel.setActive(consolePanelActive);
        updateScale();
        if (consolePanelActive) showBar();
        else cursorHideFrameCountdown = CURSOR_HIDE_FRAMES;
    }

    this.toggleMenuByKey = function() {
        if (barMenuActive) hideBarMenu();
        else {
            closeAllOverlays();
            showBarMenu(barMenuSystem, true);
        }
    };

    this.getScreenCapture = function() {
        if (!signalIsOn) return;
        return canvas.toDataURL('image/png');
    };

    this.saveScreenCapture = function() {
        var cap = this.getScreenCapture();
        if (cap) fileDownloader.startDownloadURL("Javatari Screen", cap, "Screen Capture");
    };

    this.displayMetrics = function (pTargetWidth, pTargetHeight) {
        // No need to resize display if target size is unchanged
        if (targetWidth === pTargetWidth && targetHeight === pTargetHeight) return;

        targetWidth = pTargetWidth;
        targetHeight = pTargetHeight;
        updateCanvasContentSize();
        if (isFullscreen) this.requestReadjust(true);
        else updateScale();
    };

    this.displayScale = function(pAspectX, pScaleY) {
        aspectX = pAspectX;
        scaleY = pScaleY;
        updateScale();
    };

    this.getMonitor = function() {
        return monitor;
    };

    this.showOSD = function(message, overlap, error) {
        if (osdTimeout) clearTimeout(osdTimeout);
        if (!message) {
            osd.style.transition = "all 0.15s linear";
            osd.style.top = "-29px";
            osd.style.opacity = 0;
            osdShowing = false;
            return;
        }
        if (overlap || !osdShowing) {
            osd.innerHTML = message;
            osd.style.color = error ? "rgb(255, 60, 40)" : "rgb(0, 255, 0)";
        }
        osd.style.transition = "none";
        osd.style.top = "15px";
        osd.style.opacity = 1;
        osdShowing = true;

        var availWidth = canvasOuter.clientWidth - 30;      //  message width - borders
        var width = osd.clientWidth;
        var scale = width < availWidth ? 1 : availWidth / width;
        osd.style.transform = "scale(" + scale.toFixed(4) + ")";

        osdTimeout = setTimeout(hideOSD, OSD_TIME);
    };

    this.displayDefaultScale = function() {
        if (Javatari.SCREEN_DEFAULT_SCALE > 0) return Javatari.SCREEN_DEFAULT_SCALE;

        var maxWidth = Number.parseFloat(window.getComputedStyle(mainElement.parentElement).width);

        //atariConsole.error(">>> Parent width: " + maxWidth);

        return maxWidth >= 640 ? 2.0 : maxWidth >= 540 ? 1.65 : maxWidth >= 420 ? 1.25 : maxWidth >= 355 ? 1.05 : maxWidth >= 340 ? 1 : maxWidth >= 300 ? 0.9 : 0.8;
    };

    function hideOSD() {
        osd.style.transition = "all 0.15s linear";
        osd.style.top = "-29px";
        osd.style.opacity = 0;
        osdShowing = false;
    }

    this.setDebugMode = function(boo) {
        debugMode = !!boo;
        canvasContext = null;
    };

    this.crtFilterToggle = function() {
        var newLevel = crtFilter + 1; if (newLevel > 3) newLevel = -2;
        setCRTFilter(newLevel);
        var levelDesc = crtFilterEffective === null ? "browser default" : crtFilterEffective < 1 ? "OFF" : "level " + crtFilterEffective;
        this.showOSD("CRT filter: " + (crtFilter === -1 ? "AUTO (" + levelDesc + ")" : levelDesc), true);

        // Persist
        if (Javatari.userPreferences.current.crtFilter !== crtFilter) {
            Javatari.userPreferences.current.crtFilter = crtFilter;
            Javatari.userPreferences.setDirty();
            Javatari.userPreferences.save();
        }
    };

    this.crtFilterSetDefault = function() {
        var user = Javatari.userPreferences.current.crtFilter;
        setCRTFilter(Javatari.SCREEN_FILTER_MODE !== -3 ? Javatari.SCREEN_FILTER_MODE : user !== null && user > -3 ? user : -1);
    };

    this.crtModeToggle = function() {
        var newMode = crtMode + 1; if (newMode > 1) newMode = -1;
        setCRTMode(newMode);
        var effectDesc = crtModeEffective === 1 ? "Phosphor" : "OFF";
        this.showOSD("CRT mode: " + (crtMode === -1 ? "AUTO (" + effectDesc + ")" : effectDesc), true);
    };

    this.crtModeSetDefault = function() {
        setCRTMode(Javatari.SCREEN_CRT_MODE);
    };

    this.displayToggleFullscreen = function() {                 // Only and Always user initiated
        if (FULLSCREEN_MODE === -2) return;

        // If FullScreenAPI supported but not active, enter full screen by API regardless of previous state
        if (fullscreenAPIEnterMethod && !isFullScreenByAPI()) {
            enterFullScreenByAPI();
            return;
        }

        // If not, toggle complete full screen state
        this.setFullscreen(!isFullscreen);
    };

    this.setFullscreen = function(mode) {
        if (fullscreenAPIEnterMethod) {
            if (mode) enterFullScreenByAPI();
            else exitFullScreenByAPI();
        } else
            setFullscreenState(mode)
    };

    this.focus = function() {
        canvas.focus();
    };

    this.consolePowerAndUserPauseStateUpdate = function(power, paused) {
        if (isLoading) power = false;
        powerButton.style.backgroundPosition = "" + powerButton.jtBX + "px " + (mediaButtonBackYOffsets[power ? 2 : 1]) + "px";
        powerButton.jtMenu[0].label = "Power " + (power ? "OFF" : "ON");

        var netDisable = room.netPlayMode === 2;
        powerButton.jtMenu[1].disabled = powerButton.jtMenu[12].disabled = netDisable || !power;
        powerButton.jtMenu[6].disabled = netDisable || !(cartridgeSocket && cartridgeSocket.inserted());
        powerButton.jtMenu[5].disabled = powerButton.jtMenu[8].disabled = powerButton.jtMenu[9].disabled = powerButton.jtMenu[11].disabled = netDisable;
    };

    this.cartridgeInserted = function(cart) {
        consolePanel.cartridgeInserted(cart);
        powerButton.jtMenu[6].disabled = !cart || room.netPlayMode === 2;
    };

    this.controlsModeStateUpdate = function () {
        if(settingsDialog) settingsDialog.controlsModeStateUpdate();
        if(quickOtionsDialog) quickOtionsDialog.controlsModeStateUpdate();
    };

    this.touchControlsActiveUpdate = function(active, dirBig) {
        if (touchControlsActive === active && touchControlsDirBig === dirBig) return;
        touchControlsActive = active;
        touchControlsDirBig = dirBig;
        if (isFullscreen) {
            if (touchControlsActive) consoleControls.setupTouchControlsIfNeeded(fsElementCenter);
            this.requestReadjust(true);
        }
    };

    this.roomNetPlayStatusChangeUpdate = function(oldMode) {
        if (!netPlayDialog || !netPlayDialog.isVisible()) closeAllOverlays();
        if (netPlayDialog) netPlayDialog.roomNetPlayStatusChangeUpdate(oldMode);
        netplayButton.classList.toggle("jt-hidden", room.netPlayMode < 1);
    };

    this.controlStateChanged = function(control, state) {
        consolePanel.controlStateChanged(control, state);
        if (quickOtionsDialog) quickOtionsDialog.controlStateChanged(control, state);
    };

    this.controlsStatesRedefined = function() {
        consolePanel.controlsStatesRedefined();
    };

    this.setLoading = function(state) {
        isLoading = state;
        updateLoading();
    };

    this.requestReadjust = function(now) {
        if (settingsDialog && settingsDialog.isVisible()) settingsDialog.position();
        if (now)
            readjustAll(true);
        else {
            readjustRequestTime = jt.Util.performanceNow();
            if (!readjustInterval) readjustInterval = setInterval(readjustAll, 50);
        }
    };

    function releaseControllersOnLostFocus() {
        consoleControlsSocket.releaseControllers();
    }

    function hideCursorAndBar() {
        hideCursor();
        hideBar();
        cursorHideFrameCountdown = -1;
    }

    function showCursorAndBar(forceBar) {
        showCursor();
        if (forceBar || !mousePointerLocked) showBar();
        cursorHideFrameCountdown = CURSOR_HIDE_FRAMES;
    }

    function showCursor() {
        if (!cursorShowing) {
            fsElement.style.cursor = cursorType;
            cursorShowing = true;
        }
    }

    function hideCursor() {
        if (cursorShowing) {
            fsElement.style.cursor = "none";
            cursorShowing = false;
        }
    }

    function fullscreenByAPIChanged() {
        var prevFSState = isFullscreen;
        var newAPIState = isFullScreenByAPI();

        // Return to window interface mode if user asked or not in standalone mode
        if (newAPIState || fullScreenAPIExitUserRequested || !isBrowserStandalone) setFullscreenState(newAPIState);
        else self.requestReadjust();

        // If console not paused and on mobile, set message to resume, or set event to return to full screen
        if (prevFSState && !newAPIState && !fullScreenAPIExitUserRequested && isMobileDevice) {
            if (isBrowserStandalone) {
                setEnterFullscreenByAPIOnFirstTouch();
            } else {
                atariConsole.systemPause(true);
                showLogoMessage("<br>Emulation suspended", "RESUME", true, function () {
                    self.setFullscreen(true);
                    atariConsole.systemPause(false);
                });
            }
        }

        fullScreenAPIExitUserRequested = false;
    }

    function isFullScreenByAPI() {
        return !!document[fullScreenAPIQueryProp];
    }

    function enterFullScreenByAPI() {
        if (fullscreenAPIEnterMethod) try {
            fullscreenAPIEnterMethod.call(fsElement);
        } catch (e) {
            /* give up */
        }
    }

    function exitFullScreenByAPI() {
        if (fullScreenAPIExitMethod) try {
            fullScreenAPIExitUserRequested = true;
            fullScreenAPIExitMethod.call(document);
        } catch (e) {
            /* give up */
        }
    }

    function updateScale() {
        var canvasWidth = Math.round(targetWidth * scaleY * aspectX * 2);    // Fixed internal aspectX of 2
        var canvasHeight = Math.round(targetHeight * scaleY);
        canvas.style.width = "" + canvasWidth + "px";
        canvas.style.height = "" + canvasHeight + "px";
        updateBarWidth(canvasWidth);
        if (!signalIsOn) updateLogoScale();
        if (settingsDialog && settingsDialog.isVisible()) settingsDialog.position();
        updateConsolePanelScale(canvasWidth);
    }

    function updateBarWidth(canvasWidth) {
        var fixedWidth = buttonsBarDesiredWidth > 0 ? buttonsBarDesiredWidth : canvasWidth;
        buttonsBar.style.width = buttonsBarDesiredWidth === -1 ? "100%" : "" + fixedWidth + "px";
        buttonsBar.classList.toggle("jt-narrow", fixedWidth < NARROW_WIDTH);
    }

    function updateConsolePanelScale(maxWidth) {
        var panelHeight = consolePanel.updateScale(maxWidth, isFullscreen, isLandscape);
        mainElement.style.marginBottom = !isFullscreen && panelHeight > 0
            ? "" + Math.ceil(panelHeight + 3) + "px"
            : "initial";
    }

    function updateCanvasContentSize() {
        var factor = crtFilterEffective > 0 ? CANVAS_SIZE_FACTOR : 1;
        canvas.width = targetWidth * factor;
        canvas.height = targetHeight * factor;
        canvasContext = null;
    }

    function setCRTFilter(level) {
        crtFilter = level;
        crtFilterEffective = crtFilter === -2 ? null : crtFilter === -1 ? crtFilterAutoValue() : level;
        updateCanvasContentSize();
    }

    function crtFilterAutoValue() {
        // Use mode 1 by default (context imageSmoothing OFF and CSS image-rendering set to smooth)
        // iOS browser bug: freezes after some time if imageSmoothing = true. OK if we use the setting above
        // Firefox on Android bug: image looks terrible if imageSmoothing = false. Lets use mode 2 or 3, or let browser default
        return isMobileDevice && !isIOSDevice && browserName === "FIREFOX" ? 0 : 1;
    }

    function setCRTMode(mode) {
        crtMode = mode;
        crtModeEffective = crtMode === -1 ? crtModeAutoValue() : crtMode;
        canvasContext = null;
    }

    function crtModeAutoValue() {
        return isMobileDevice ? 0 : 1;
    }

    function updateLogo() {
        if (!signalIsOn) {
            updateLogoScale();
            showCursorAndBar(true);
            if (canvasContext) canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        }
        logo.classList.toggle("jt-show", !signalIsOn);
    }

    function updateLoading() {
        var disp = isLoading ? "block" : "none";
        logoLoadingIcon.style.display = disp;
        canvasLoadingIcon.style.display = disp;
    }

    function createCanvasContext() {
        // Prepare Context used to draw frame
        canvasContext = canvas.getContext("2d", { alpha: false, antialias: false });
        setImageComposition();
        setImageSmoothing();
    }

    function setImageComposition() {
        if (crtModeEffective > 0 && !debugMode) {
            canvasContext.globalCompositeOperation = "source-over";
            canvasContext.globalAlpha = 0.8;
        } else {
            canvasContext.globalCompositeOperation = "copy";
            canvasContext.globalAlpha = 1;
        }
    }

    function setImageSmoothing() {
        canvas.style.imageRendering = (crtFilterEffective === 0 || crtFilterEffective === 2) ? canvasImageRenderingValue : "initial";

        if (crtFilterEffective === null) return;    // let default values for imageSmoothingEnabled

        var smoothing = crtFilterEffective >= 2;
        if (canvasContext.imageSmoothingEnabled !== undefined)
            canvasContext.imageSmoothingEnabled = smoothing;
        else {
            canvasContext.webkitImageSmoothingEnabled = smoothing;
            canvasContext.mozImageSmoothingEnabled = smoothing;
            canvasContext.msImageSmoothingEnabled = smoothing;
        }
    }

    function suppressContextMenu(element) {
        element.addEventListener("contextmenu", jt.Util.blockEvent);
    }

    function preventDrag(element) {
        element.ondragstart = jt.Util.blockEvent;
    }

    function setupMain() {
        mainElement.innerHTML = jt.ScreenGUI.html();
        mainElement.tabIndex = -1;
        delete jt.ScreenGUI.html;

        fsElement = document.getElementById("jt-screen-fs");
        fsElementCenter = document.getElementById("jt-screen-fs-center");
        canvasOuter = document.getElementById("jt-screen-canvas-outer");
        canvas = document.getElementById("jt-screen-canvas");
        canvasLoadingIcon = document.getElementById("jt-canvas-loading-icon");
        osd = document.getElementById("jt-osd");
        logo = document.getElementById("jt-logo");
        logoCenter = document.getElementById("jt-logo-center");
        logoImage = document.getElementById("jt-logo-image");
        logoLoadingIcon = document.getElementById("jt-logo-loading-icon");
        logoMessage = document.getElementById("jt-logo-message");
        logoMessageText = document.getElementById("jt-logo-message-text");
        logoMessageOK = document.getElementById("jt-logo-message-ok");
        logoMessageOKText = document.getElementById("jt-logo-message-ok-text");
        scrollMessage = document.getElementById("jt-screen-scroll-message");
        consolePanelElement = document.getElementById("jt-console-panel");

        suppressContextMenu(mainElement);
        preventDrag(logoImage);
        preventDrag(logoLoadingIcon);
        preventDrag(canvasLoadingIcon);

        updateCanvasContentSize();

        // Try to determine correct value for image-rendering for the canvas filter modes
        switch (browserName) {
            case "CHROME":
            case "EDGE":
            case "OPERA":   canvasImageRenderingValue = "pixelated"; break;
            case "FIREFOX": canvasImageRenderingValue = "-moz-crisp-edges"; break;
            case "SAFARI":  canvasImageRenderingValue = "-webkit-optimize-contrast"; break;
            default:        canvasImageRenderingValue = "pixelated";
        }
        setupMainEvents();
    }

    function setupMainEvents() {
        (isMobileDevice ? canvasOuter : fsElement).addEventListener("mousemove", function showCursorOnMouseMove() {
            showCursorAndBar();
        });

        if ("onblur" in document) fsElement.addEventListener("blur", releaseControllersOnLostFocus, true);
        else fsElement.addEventListener("focusout", releaseControllersOnLostFocus, true);

        window.addEventListener("orientationchange", function orientationChanged() {
            closeAllOverlays();
            if (signalIsOn) hideCursorAndBar();
            else showCursorAndBar();
            self.requestReadjust();
        });

        mainElement.addEventListener("drop", closeAllOverlays, true);

        logoMessageOK.jtNeedsUIG = logoMessageOKText.jtNeedsUIG = true;     // User Initiated Gesture required
        jt.Util.onTapOrMouseDownWithBlockUIG(logoMessageOK, self.closeLogoMessage);

        // Used to show bar and close overlays and modals if not processed by any other function
        jt.Util.addEventsListener(fsElementCenter, "touchstart touchend mousedown", function backScreenTouched(e) {
            if (e.type !== "touchend") {                            // Execute actions only for touchstart or mousedown
                closeAllOverlays();
                showCursorAndBar();
            } else
                if (e.cancelable) e.preventDefault();               // preventDefault only on touchend to avoid redundant mousedown ater a touchstart
        });
    }

    function setupBar() {
        buttonsBar = document.getElementById("jt-bar");
        buttonsBarInner = document.getElementById("jt-bar-inner");

        if (BAR_AUTO_HIDE) {
            document.documentElement.classList.add("jt-bar-auto-hide");
            fsElement.addEventListener("mouseleave", hideBar);
            hideBar();
        }

        var menu = [
            { label: "Power",              clickModif: 0, control: jt.PeripheralControls.CONSOLE_POWER_TOGGLE },
            { label: "Fry Console",                       control: jt.PeripheralControls.CONSOLE_POWER_FRY },
            { label: "",                   divider: true },
            { label: "Net Play!",                         control: jt.PeripheralControls.SCREEN_OPEN_NETPLAY },
            { label: "",                   divider: true },
            { label: "Select Cartridge",                  control: jt.PeripheralControls.CARTRIDGE_LOAD_RECENT },
            { label: "Set ROM Format",     clickModif: KEY_SHIFT_MASK, control: jt.PeripheralControls.CARTRIDGE_CHOOSE_FORMAT },
            { label: "",                   divider: true },
            { label: "Open File",          clickModif: KEY_CTRL_MASK, control: jt.PeripheralControls.AUTO_LOAD_FILE, needsUIG: true },
            { label: "Open URL",           clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: jt.PeripheralControls.AUTO_LOAD_URL, needsUIG: true },
            { label: "",                   divider: true },
            { label: "Load State",                        control: jt.PeripheralControls.CONSOLE_LOAD_STATE_MENU },
            { label: "Save State",                        control: jt.PeripheralControls.CONSOLE_SAVE_STATE_MENU }
        ];
        powerButton = addBarButton("jt-bar-power", -5, -26, "System Power", null, false, menu, "System");
        barMenuSystem = menu;
        self.consolePowerAndUserPauseStateUpdate(false, false);     // init states

        netplayButton  = addBarButton("jt-bar-netplay", -192, -1, "NetPlay!", jt.PeripheralControls.SCREEN_OPEN_NETPLAY);
        netplayButton.classList.add("jt-hidden");

        if (!isMobileDevice) {
            menu = [
                { label: "Help & Settings", clickModif: 0, control: jt.PeripheralControls.SCREEN_OPEN_SETTINGS },
                { label: "Quick Options",                  control: jt.PeripheralControls.SCREEN_OPEN_QUICK_OPTIONS },
                { label: "Defaults",                       control: jt.PeripheralControls.SCREEN_DEFAULTS/*,          fullScreenHidden: true*/ }
            ];
            settingsButton = addBarButton("jt-bar-settings", -33, -26, "Settings", null, false, menu, "Settings");
        } else {
            settingsButton = addBarButton("jt-bar-settings", -33, -26, "Quick Options", jt.PeripheralControls.SCREEN_OPEN_QUICK_OPTIONS, false);
        }

        gameSelectButton = addBarButton("jt-bar-select", -78, -51, "Game Select", jt.ConsoleControls.SELECT, true);
        gameResetButton = addBarButton("jt-bar-reset", -33, -51, "Game Reset", jt.ConsoleControls.RESET, true);

        if (FULLSCREEN_MODE !== -2) {
            fullscreenButton = addBarButton("jt-bar-full-screen", -103, -1, "Full Screen", jt.PeripheralControls.SCREEN_FULLSCREEN, false);
            fullscreenButton.jtNeedsUIG = true;
            if (isMobileDevice) fullscreenButton.classList.add("jt-mobile");
        }

        if (!Javatari.SCREEN_RESIZE_DISABLED && !isMobileDevice) {
            scaleUpButton = addBarButton("jt-bar-scale-plus", -80, -1, "Increase Screen", jt.PeripheralControls.SCREEN_SCALE_PLUS, false);
            scaleUpButton.classList.add("jt-full-screen-hidden");
            scaleDownButton = addBarButton("jt-bar-scale-minus", -58, -1, "Decrease Screen", jt.PeripheralControls.SCREEN_SCALE_MINUS, false);
            scaleDownButton.classList.add("jt-full-screen-hidden");
        }

        var consolePanelButton = addBarButton("jt-bar-console-panel", -61, -25, "Toggle Console Panel", jt.PeripheralControls.SCREEN_CONSOLE_PANEL_TOGGLE, false);
        consolePanelButton.classList.add("jt-full-screen-only");

        logoButton = addBarButton("jt-bar-logo", -99, -26, "About Javatari", jt.PeripheralControls.SCREEN_OPEN_ABOUT, false);
        logoButton.classList.add("jt-full-screen-hidden");

        // Events for BarButtons and also MenuItems
        jt.Util.onTapOrMouseDownWithBlockUIG(buttonsBar, barElementTapOrMouseDown);
        jt.Util.addEventsListener(buttonsBar, "touchmove", barElementTouchMove);
        jt.Util.addEventsListener(buttonsBar, "mouseup touchend", barElementTouchEndOrMouseUp);
    }

    function addBarButton(id, bx, by, tooltip, control, isConsoleControl, menu, menuTitle) {
        var but = document.createElement('div');
        but.id = id;
        but.classList.add("jt-bar-button");
        but.jtBarElementType = 1;     // Bar button
        but.jtControl = control;
        but.jtIsConsoleControl = isConsoleControl;
        but.style.backgroundPosition = "" + bx + "px " + by + "px";
        but.jtBX = bx;
        if (menu) {
            but.jtMenu = menu;
            menu.jtTitle = menuTitle;
            menu.jtRefElement = but;
            menu.jtMenuIndex = barMenus.length;
            barMenus.push(menu);
        }
        if (tooltip) but.title = tooltip;

        // Mouse hover button
        but.addEventListener("mouseenter", function(e) { barButtonHoverOver(e.target, e); });
        // Mouse left button (only for ConsoleControls)
        if (isConsoleControl) but.addEventListener("mouseleave", barButtonMouseLeft);

        buttonsBarInner.appendChild(but);
        return but;
    }

    function barButtonTapOrMousedown(elem, e, uigStart, uigEnd) {
        if (!uigEnd) consoleControls.hapticFeedbackOnTouch(e);
        if (logoMessageActive || uigStart) return;

        var prevActiveMenu = barMenuActive;
        closeAllOverlays();

        // Single option, only left click
        if (elem.jtControl) {
            if (!e.button) {
                if (elem.jtIsConsoleControl) {
                    barConsoleControlPressed = elem.jtControl;
                    consoleControls.processControlState(barConsoleControlPressed, true);
                } else
                    peripheralControls.controlActivated(elem.jtControl);
            }
            return;
        }

        var menu = elem.jtMenu;
        if (!menu) return;

        var modifs = 0 | (e.altKey && KEY_ALT_MASK) | (e.ctrlKey && KEY_CTRL_MASK) | (e.shiftKey && KEY_SHIFT_MASK);

        // Open/close menu with left-click if no modifiers
        if (modifs === 0 && !e.button) {
            if (prevActiveMenu !== menu) {
                showBarMenu(menu);
                // Only start LongTouch for touches!
                if (e.type === "touchstart") barButtonLongTouchStart(e);
            }
            return;
        }

        // Modifier options for left, middle or right click
        for (var i = 0; i < menu.length; ++i)
            if (menu[i].clickModif === modifs) {
                peripheralControls.controlActivated(menu[i].control, e.button === 1, menu[i].secSlot);         // altPower for middleClick (button === 1)
                return;
            }
        // If no direct shortcut found with modifiers used, use SHIFT as secSlot modifier and try again
        if (modifs & KEY_SHIFT_MASK) {
            modifs &= ~KEY_SHIFT_MASK;
            for (i = 0; i < menu.length; ++i)
                if (menu[i].clickModif === modifs) {
                    peripheralControls.controlActivated(menu[i].control, e.button === 1, true);               // altPower for middleClick (button === 1)
                    return;
                }
        }
    }

    function barButtonLongTouchStart(e) {
        barButtonLongTouchTarget = e.target;
        barButtonLongTouchSelectTimeout = window.setTimeout(function buttonsBarLongTouchSelectDefault() {
            if (!barMenuActive) return;
            var items = barMenu.jtItems;
            for (var i = 0; i < items.length; ++i) {
                var option = items[i].jtMenuOption;
                if (option && option.clickModif === 0) {
                    barMenuItemSetActive(items[i], true);
                    return;
                }}
        }, 450);
    }

    function barButtonLongTouchCancel() {
        if (barButtonLongTouchSelectTimeout) {
            clearTimeout(barButtonLongTouchSelectTimeout);
            barButtonLongTouchSelectTimeout = null;
        }
    }

    function barButtonHoverOver(elem, e) {
        if (barMenuActive && elem.jtMenu && barMenuActive !== elem.jtMenu ) {
            consoleControls.hapticFeedbackOnTouch(e);
            showBarMenu(elem.jtMenu);
        }
    }

    function barButtonMouseLeft() {
        if (barConsoleControlPressed) {
            cursorHideFrameCountdown = CURSOR_HIDE_FRAMES;
            consoleControls.processControlState(barConsoleControlPressed, false);
            barConsoleControlPressed = null;
        }
    }

    function barButtonTouchEndOrMouseUp(e) {
        if (logoMessageActive) return;
        // Special case for ConsoleControl
        if (barConsoleControlPressed) {
            consoleControls.hapticFeedbackOnTouch(e);
            consoleControls.processControlState(barConsoleControlPressed, false);
            barConsoleControlPressed = null;
            return;
        }
        // Only touch, left or middle button
        if (barMenuItemActive && !(e.button > 1)) barMenuItemFireActive(e.shiftKey, e.button === 1 || e.ctrlKey);
    }

    function barMenuItemTapOrMouseDown(elem, e, uigEnd) {
        if (uigEnd) return;
        barMenuItemSetActive(elem, e.type === "touchstart");
    }

    function barMenuItemHoverOver(elem, e) {
        barMenuItemSetActive(elem, e.type === "touchmove");
    }

    function barMenuItemHoverOut() {
        barMenuItemSetActive(null);
    }

    function barMenuItemTouchEndOrMouseUp(e) {
        if (logoMessageActive) return;
        // Only touch, left or middle button
        if (barMenuItemActive && !(e.button > 1)) barMenuItemFireActive(e.shiftKey, e.button === 1 || e.ctrlKey);
    }

    function barMenuItemFireActive(secSlot, altPower) {
        var option = barMenuItemActive.jtMenuOption;
        barMenuItemSetActive(null);
        if (option && !option.disabled) {
            if (option.extension) {
                extensionsSocket.toggleExtension(option.extension, altPower, secSlot);
            } else if (option.control) {
                secSlot |= option.secSlot;
                closeAllOverlays();
                peripheralControls.controlActivated(option.control, altPower, secSlot);
            }
        }
    }

    function barMenuItemSetActive(element, haptic) {
        if (element === barMenuItemActive) return;
        if (barMenuItemActive) barMenuItemActive.classList.remove("jt-hover");
        if (element && element.jtMenuOption) {
            barMenuItemActive = element;
            if (haptic) consoleControls.hapticFeedback();
            barMenuItemActive.classList.add("jt-hover");
        } else
            barMenuItemActive = null;
    }

    function barElementTapOrMouseDown(e, uigStart, uigEnd) {
        cursorHideFrameCountdown = CURSOR_HIDE_FRAMES;
        var elem = e.target;
        if (elem.jtBarElementType === 1) barButtonTapOrMousedown(elem, e, uigStart, uigEnd);
        else if (elem.jtBarElementType === 2) barMenuItemTapOrMouseDown(elem, e, uigEnd);
        else hideBarMenu();
    }

    function barElementTouchMove(e) {
        jt.Util.blockEvent(e);
        var t = e.changedTouches[0];
        var elem = t && document.elementFromPoint(t.clientX, t.clientY);
        if (barButtonLongTouchTarget && elem !== barButtonLongTouchTarget) barButtonLongTouchCancel();
        if (elem.jtBarElementType !== 2 && elem !== barButtonLongTouchTarget) barMenuItemSetActive(null);
        if (elem.jtBarElementType === 1) barButtonHoverOver(elem, e);
        else if (elem.jtBarElementType === 2) barMenuItemHoverOver(elem, e);

    }

    function barElementTouchEndOrMouseUp(e) {
        cursorHideFrameCountdown = CURSOR_HIDE_FRAMES;
        jt.Util.blockEvent(e);
        barButtonLongTouchCancel();
        var elem = e.target;
        if (elem.jtBarElementType === 1) barButtonTouchEndOrMouseUp(e);
        else if (elem.jtBarElementType === 2) barMenuItemTouchEndOrMouseUp(e);
    }

    function setupFullscreen() {
        fullscreenAPIEnterMethod = fsElement.requestFullscreen || fsElement.webkitRequestFullscreen || fsElement.webkitRequestFullScreen || fsElement.mozRequestFullScreen;
        fullScreenAPIExitMethod =  document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen;
        if ("fullscreenElement" in document) fullScreenAPIQueryProp = "fullscreenElement";
        else if ("webkitFullscreenElement" in document) fullScreenAPIQueryProp = "webkitFullscreenElement";
        else if ("mozFullScreenElement" in document) fullScreenAPIQueryProp = "mozFullScreenElement";

        if (!fullscreenAPIEnterMethod && isMobileDevice && !isBrowserStandalone) fullScreenScrollHack = true;

        if ("onfullscreenchange" in document)            document.addEventListener("fullscreenchange", fullscreenByAPIChanged);
        else if ("onwebkitfullscreenchange" in document) document.addEventListener("webkitfullscreenchange", fullscreenByAPIChanged);
        else if ("onmozfullscreenchange" in document)    document.addEventListener("mozfullscreenchange", fullscreenByAPIChanged);

        // Prevent scroll & zoom in fullscreen if not touching on the screen (canvas) or scroll message in hack mode
        if (!fullscreenAPIEnterMethod) {
            scrollMessage.jtScroll = canvas.jtScroll = logo.jtScroll = logoCenter.jtScroll = logoImage.jtScroll =
                logoMessage.jtScroll = logoMessageText.jtScroll = logoMessageOK.jtScroll = logoMessageOKText.jtScroll = true;

            fsElement.addEventListener("touchmove", function preventTouchMoveInFullscreenByHack(e) {
                if (isFullscreen) {
                    if (!fullScreenScrollHack || !e.target.jtScroll)
                        return jt.Util.blockEvent(e);
                    else
                        if (scrollMessageActive) setScrollMessage(false);
                }
            });
        }
    }

    function setEnterFullscreenByAPIOnFirstTouch() {
        // Add event to enter in real fullScreenByAPI on first touch/click if possible
        if (fullscreenAPIEnterMethod) {
            var done = false;
            var enterFullScreenByAPIonFirstTouch = function() {
                if (done) return;
                done = true;
                jt.Util.removeEventsListener(fsElement, "touchend mousedown", enterFullScreenByAPIonFirstTouch, true);
                enterFullScreenByAPI();
            };
            jt.Util.addEventsListener(fsElement, "touchend mousedown", enterFullScreenByAPIonFirstTouch, true);    // Capture!
        }
    }

    function setFullscreenState(mode) {
        isFullscreen = mode;

        if (mode) {
            setViewport();
            document.documentElement.classList.add("jt-full-screen");
            if (fullScreenScrollHack) document.documentElement.classList.add("jt-full-screen-scroll-hack");
            consoleControls.setupTouchControlsIfNeeded(fsElementCenter);
            if (fullScreenScrollHack) setScrollMessage(true);
            if (!fullscreenAPIEnterMethod) tryToFixSafariBugOnFullScreenChange();
        } else {
            restoreViewport();
            document.documentElement.classList.remove("jt-full-screen");
            if (fullScreenScrollHack) document.documentElement.classList.remove("jt-full-screen-scroll-hack");
            if (!fullscreenAPIEnterMethod) tryToFixSafariBugOnFullScreenChange();
        }

        closeAllOverlays();
        self.requestReadjust();
    }

    function tryToFixSafariBugOnFullScreenChange() {
        // Toggle a dummy element existence inside mainElement to try to force a reflow
        var dummy = document.getElementById("jt-dummy-element");
        if (dummy) {
            mainElement.removeChild(dummy);
        } else {
            dummy = document.createElement("div");
            dummy.id = "jt-dummy-element";
            mainElement.appendChild(dummy);
        }
    }

    function showBar() {
        buttonsBar.classList.remove("jt-hidden");
    }

    function hideBar() {
        if ((BAR_AUTO_HIDE || isFullscreen) && !barMenuActive && !consolePanelActive && !barConsoleControlPressed) {
            hideBarMenu();
            buttonsBar.classList.add("jt-hidden");
        }
    }

    function showBarMenu(menu, select) {
        if (!menu || barMenuActive === menu) return;

        if (!barMenu) {
            setupBarMenu();
            setTimeout(function() {
                showBarMenu(menu, select);
            }, 1);
            return;
        }

        // Define items
        refreshBarMenu(menu);
        barMenuItemSetActive(select ? barMenu.jtDefaultItem : null);

        // Position
        var refElement = menu.jtRefElement;
        var p = (refElement && (refElement.offsetLeft - 15)) || 0;
        if (p + jt.ScreenGUI.BAR_MENU_WIDTH > refElement.parentElement.clientWidth) {
            barMenu.style.right = 0;
            barMenu.style.left = "auto";
            barMenu.style.transformOrigin = "bottom right";
        } else {
            if (p < 0) p = 0;
            barMenu.style.left = "" + p + "px";
            barMenu.style.right = "auto";
            barMenu.style.transformOrigin = "bottom left";
        }

        // Show
        showCursorAndBar(true);
        barMenuActive = menu;
        barMenu.style.display = "inline-block";
        barMenu.jtTitle.focus();
    }

    function refreshBarMenu(menu) {
        barMenu.jtTitle.innerHTML = menu.jtTitle;
        barMenu.jtDefaultItem = null;

        var it = 0;
        var item;
        var maxShown = Math.min(menu.length, BAR_MENU_MAX_ITEMS);
        var h = jt.ScreenGUI.BAR_MENU_ITEM_HEIGHT + 3;         // title + borders

        for (var op = 0; op < maxShown; ++op) {
            var option = menu[op];
            if (option.label !== undefined) {
                item = barMenu.jtItems[it];
                item.firstChild.textContent = option.label;
                item.jtMenuOption = null;

                if (option.hidden || (isFullscreen && option.fullScreenHidden) || (!isFullscreen && option.fullScreenOnly)) {
                    item.style.display = "none";
                } else {
                    item.style.display = "block";

                    // Divider?
                    if (option.divider) {
                        item.classList.add("jt-bar-menu-item-divider");
                    } else {
                        item.classList.remove("jt-bar-menu-item-divider");
                        h += jt.ScreenGUI.BAR_MENU_ITEM_HEIGHT;   // each non-divider item

                        // Toggle
                        item.classList.toggle("jt-bar-menu-item-toggle", option.toggle !== undefined);

                        // Disabled?
                        if (option.disabled) {
                            item.classList.add("jt-bar-menu-item-disabled");
                        } else {
                            item.classList.remove("jt-bar-menu-item-disabled");

                            item.jtMenuOption = option;
                            if (option.clickModif === 0) barMenu.jtDefaultItem = item;    // If option is the default, set this item to be selected as default

                            // User Generated Gesture needed?
                            item.jtNeedsUIG = option.needsUIG;

                            // Toggle checked
                             if (option.toggle !== undefined) item.classList.toggle("jt-bar-menu-item-toggle-checked", !!option.checked);
                        }
                    }
                }

                ++it;
            }
        }
        for (var r = it; r < BAR_MENU_MAX_ITEMS; ++r) {
            item = barMenu.jtItems[r];
            item.firstChild.textContent = "";
            item.style.display = "none";
            item.jtMenuOption = null;
        }

        var height = fsElementCenter.clientHeight - jt.ScreenGUI.BAR_HEIGHT - 12;      // bar + borders + tolerance
        var scale = h < height ? 1 : height / h;
        if (barMenu) barMenu.style.transform = "scale(" + scale.toFixed(4) + ")";

        //console.error("MESSAGE SCALE height: " + height + ", h: " + h);
    }

    function hideBarMenu() {
        if (!barMenuActive) return;
        barMenuActive = null;
        barMenu.style.display = "none";
        barMenuItemSetActive(null);
        cursorHideFrameCountdown = CURSOR_HIDE_FRAMES;
        self.focus();
    }

    function setupBarMenu() {
        barMenu = document.createElement('div');
        barMenu.id = "jt-bar-menu";

        var inner = document.createElement('div');
        inner.id = "jt-bar-menu-inner";
        barMenu.appendChild(inner);

        var title = document.createElement('div');
        title.id = "jt-bar-menu-title";
        title.tabIndex = -1;
        title.innerHTML = "Menu Title";
        inner.appendChild(title);
        barMenu.jtTitle = title;

        barMenu.jtItems = new Array(BAR_MENU_MAX_ITEMS);
        for (var i = 0; i < BAR_MENU_MAX_ITEMS; ++i) {
            var item = document.createElement('div');
            item.classList.add("jt-bar-menu-item");
            item.style.display = "none";
            item.innerHTML = "Menu Item " + i;
            item.jtBarElementType = 2;     // Menu Item
            item.jtItemIndex = i;
            item.addEventListener("mouseenter", function (e) { barMenuItemHoverOver(e.target, e); });
            item.addEventListener("mouseleave", barMenuItemHoverOut);
            inner.appendChild(item);
            barMenu.jtItems[i] = item;
        }

        // Block keys and respond to some
        barMenu.addEventListener("keydown", function(e) {
            // Hide
            if (MENU_CLOSE_KEYS[e.keyCode]) hideBarMenu();
            // Execute
            else if (barMenuItemActive && MENU_EXEC_KEYS[e.keyCode & ~KEY_SHIFT_MASK & ~KEY_CTRL_MASK]) barMenuItemFireActive(e.shiftKey, e.ctrlKey);
            // Select Menu
            else if (MENU_SELECT_KEYS[e.keyCode]) {
                if (!barMenuActive) return;
                var newMenu = (barMenus.length + barMenuActive.jtMenuIndex + MENU_SELECT_KEYS[e.keyCode]) % barMenus.length;
                showBarMenu(barMenus[newMenu], true);
            }
            // Select Item
            else if (MENU_ITEM_SELECT_KEYS[e.keyCode]) {
                var items = barMenu.jtItems;
                var newItem = barMenuItemActive ? barMenuItemActive.jtItemIndex : -1;
                var tries = BAR_MENU_MAX_ITEMS + 1;
                do {
                    newItem = (newItem + items.length + MENU_ITEM_SELECT_KEYS[e.keyCode]) % items.length;
                } while (--tries >= 0 && !items[newItem].jtMenuOption);
                if (tries >= 0) barMenuItemSetActive(items[newItem]);
            }
            return jt.Util.blockEvent(e);
        });

        buttonsBar.appendChild(barMenu);
    }

    function closeAllOverlays() {
        hideBarMenu();
        if (saveStateDialog) saveStateDialog.hide();
        if (quickOtionsDialog) quickOtionsDialog.hide();
        if (netPlayDialog) netPlayDialog.hide();
        if (cartFormatDialog) cartFormatDialog.hide();
        if (settingsDialog) settingsDialog.hide();
        if (recentROMsDialog) recentROMsDialog.hide();
    }
    this.closeAllOverlays = closeAllOverlays;

    function showLogoMessage(mes, button, higherButton, afterAction) {
        consolePanel.setLogoMessageActive(true);
        if (logoMessageActive) return;

        closeAllOverlays();
        if (afterAction) afterMessageAction = afterAction;
        logoMessageText.innerHTML = mes;
        logoMessageOK.classList.toggle("jt-higher", !!higherButton);
        logoMessageOKText.innerHTML = button || "OK";
        fsElement.classList.add("jt-logo-message-active");
        logoMessageActive = true;

        signalIsOn = false;
        updateLogo();
    }

    this.closeLogoMessage = function(e, uigStart, uigEnd) {
        if (!uigEnd) consoleControls.hapticFeedbackOnTouch(e);
        if (uigStart) return;
        consolePanel.setLogoMessageActive(false);
        fsElement.classList.remove("jt-logo-message-active");
        logoMessageActive = false;
        if (afterMessageAction) {
            var action = afterMessageAction;
            afterMessageAction = null;
            action();
        }
    };

    function updateLogoScale() {
        var width = canvasOuter.clientWidth;
        var scale = Math.min(width / jt.ScreenGUI.LOGO_SCREEN_WIDTH, 1);
        if (scale < 1)
            logoCenter.style.transform = "translate(-50%, -50%) scale(" + scale.toFixed(4) + ")";
        else
            logoCenter.style.transform = "translate(-50%, -50%)";
    }

    function setScrollMessage(state) {

        console.error("Scroll Message: " + state);

        fsElement.classList.toggle("jt-scroll-message", state);
        scrollMessageActive = state;
        if (state) {
            setTimeout(function() {
                setScrollMessage(false);
            }, 5000);
        }
    }

    function readjustAll(force) {
        if (isReadjustScreeSizeChanged(force)) {
            if (isFullscreen) {
                buttonsBarDesiredWidth = isLandscape ? 0 : -1;
                var winH = readjustScreenSize.h;
                if (!isLandscape) winH -= jt.ScreenGUI.BAR_HEIGHT + 2;
                monitor.displayScale(aspectX, displayOptimalScaleY(readjustScreenSize.w, winH));
            } else {
                buttonsBarDesiredWidth = -1;
                monitor.displayScale(Javatari.SCREEN_DEFAULT_ASPECT, self.displayDefaultScale());
            }

            self.focus();
            consolePanelUpdateForOrientation();
            consoleControlsSocket.releaseControllers();

            //console.log("READJUST");
        }

        if (readjustInterval && (jt.Util.performanceNow() - readjustRequestTime >= 1000)) {
            clearInterval(readjustInterval);
            readjustInterval = null;
            //console.log("READJUST TERMINATED");
        }
    }

    function isReadjustScreeSizeChanged(force) {
        var parW = mainElement.parentElement.clientWidth;
        var winW = fsElementCenter.clientWidth;
        var winH = fsElementCenter.clientHeight;

        if (!force && readjustScreenSize.pw === parW && readjustScreenSize.w === winW && readjustScreenSize.h === winH)
            return false;

        readjustScreenSize.pw = parW;
        readjustScreenSize.w = winW;
        readjustScreenSize.h = winH;
        isLandscape = winW > winH;
        return true;
    }

    function displayOptimalScaleY(maxWidth, maxHeight) {
        var effectiveScaleX = aspectX * 2;      // Fixed internal aspectX of 2
        var scY = maxHeight / targetHeight;
        if (targetWidth * effectiveScaleX * scY > maxWidth)
            scY = maxWidth / (targetWidth * effectiveScaleX);
        return scY;
    }

    function setViewport() {
        if (!isMobileDevice) return;

        if (viewPortOriginalContent === undefined) {    // store only once!
            viewPortOriginalTag = document.querySelector("meta[name=viewport]");
            viewPortOriginalContent = (viewPortOriginalTag && viewPortOriginalTag.content) || null;
        }

        if (!viewportTag) {
            viewportTag = document.createElement('meta');
            viewportTag.name = "viewport";
            // Android Firefox bug (as of 11/2016). Going back and forth from full-screen makes scale all wrong. Set user-scalable = yes to let user correct it in full-screen :-(
            viewportTag.content = "width = device-width, height = device-height, initial-scale = 1.0, minimum-scale = 1.0, maximum-scale = 1.0, user-scalable = yes";
            document.head.appendChild(viewportTag);
        }

        if (viewPortOriginalTag) try { document.head.removeChild(viewPortOriginalTag); } catch (e) { /* ignore */ }
        viewPortOriginalTag = null;
    }

    function restoreViewport() {
        if (!isMobileDevice) return;

        if (!viewPortOriginalTag && viewPortOriginalContent) {
            viewPortOriginalTag = document.createElement('meta');
            viewPortOriginalTag.name = "viewport";
            viewPortOriginalTag.content = viewPortOriginalContent;
            document.head.appendChild(viewPortOriginalTag);
        }

        if (viewportTag) try { document.head.removeChild(viewportTag); } catch (e) { /* ignore */ }
        viewportTag = null;
    }

    function setPageVisibilityHandling() {
        var wasUnpaused;
        function visibilityChange() {
            if (logoMessageActive) return;

            if (document.hidden) {
                wasUnpaused = !atariConsole.systemPause(true);
            } else {
                if (wasUnpaused) atariConsole.systemPause(false);
            }
        }
        document.addEventListener("visibilitychange", visibilityChange);
    }


    var afterMessageAction;

    var atariConsole;
    var consoleControlsSocket;

    var monitor;
    var peripheralControls;
    var fileLoader;
    var fileDownloader;
    var consoleControls;
    var cartridgeSocket;
    var stateMedia;
    var recentROMs;

    var readjustInterval = 0, readjustRequestTime = 0;
    var readjustScreenSize = { w: 0, wk: 0, h: 0, pw: 0, l: false };

    var isFullscreen = false, isLandscape = false;

    var isTouchDevice = jt.Util.isTouchDevice();
    var isMobileDevice = jt.Util.isMobileDevice();
    var isIOSDevice = jt.Util.isIOSDevice();
    var isBrowserStandalone = jt.Util.isBrowserStandaloneMode();
    var browserName = jt.Util.browserInfo().name;

    var fullscreenAPIEnterMethod, fullScreenAPIExitMethod, fullScreenAPIQueryProp, fullScreenAPIExitUserRequested = false, fullScreenScrollHack = false;
    var viewportTag, viewPortOriginalTag, viewPortOriginalContent;

    var consolePanel;
    var consolePanelElement;
    var settingsDialog;
    var saveStateDialog;
    var recentROMsDialog;
    var quickOtionsDialog;
    var netPlayDialog;
    var cartFormatDialog;

    var fsElement, fsElementCenter;

    var canvas, canvasOuter, canvasLoadingIcon;
    var canvasContext;
    var canvasImageRenderingValue;

    var touchControlsActive = false, touchControlsDirBig = false;
    var consolePanelActive = false;
    var consolePanelActiveLandscape = false;
    var consolePanelActivePortrait = jt.ConsolePanel.shouldStartActive();

    var buttonsBar, buttonsBarInner, buttonsBarDesiredWidth = -1;       // 0 = same as canvas. -1 means full width mode (100%)
    var barButtonLongTouchTarget, barButtonLongTouchSelectTimeout;

    var barMenu;
    var barMenus = [], barMenuActive, barMenuItemActive, barMenuSystem;
    var barConsoleControlPressed;

    var osd;
    var osdTimeout;
    var osdShowing = false;

    var cursorType = "auto";
    var cursorShowing = true;
    var cursorHideFrameCountdown = -1;
    var signalIsOn = false;
    var crtFilter = -2, crtFilterEffective = null;
    var crtMode = -1, crtModeEffective = 0;
    var debugMode = false;
    var isLoading = false;

    var aspectX = Javatari.SCREEN_DEFAULT_ASPECT;
    var scaleY = 1.0;

    var mousePointerLocked = false;

    var targetWidth = 160;
    var targetHeight = 213;

    var logo, logoCenter, logoImage, logoMessage, logoMessageText, logoMessageOK, logoMessageOKText, logoMessageActive = false;
    var logoLoadingIcon;
    var scrollMessage, scrollMessageActive = false;

    var powerButton;
    var netplayButton;
    var logoButton;
    var scaleDownButton;
    var scaleUpButton;
    var fullscreenButton;
    var settingsButton;
    var gameSelectButton;
    var gameResetButton;

    var mediaButtonBackYOffsets = [-51, -26, -1];

    var CANVAS_SIZE_FACTOR = Javatari.SCREEN_CANVAS_SIZE;

    var OSD_TIME = 3000;
    var CURSOR_HIDE_FRAMES = 180;

    var FULLSCREEN_MODE = Javatari.SCREEN_FULLSCREEN_MODE;

    var BAR_AUTO_HIDE = Javatari.SCREEN_CONTROL_BAR === 0;
    var BAR_MENU_MAX_ITEMS = 13;

    var NARROW_WIDTH = 336;

    var k = jt.DOMKeys;
    var KEY_CTRL_MASK  =  k.CONTROL;
    var KEY_ALT_MASK   =  k.ALT;
    var KEY_SHIFT_MASK =  k.SHIFT;

    var MENU_CLOSE_KEYS = {}; MENU_CLOSE_KEYS[k.VK_ESCAPE.c] = 1; MENU_CLOSE_KEYS[k.VK_CONTEXT.c] = 1;
    var MENU_EXEC_KEYS = {}; MENU_EXEC_KEYS[k.VK_ENTER.c] = 1; MENU_EXEC_KEYS[k.VK_SPACE.c] = 1;
    var MENU_SELECT_KEYS = {}; MENU_SELECT_KEYS[k.VK_LEFT.c] = -1; MENU_SELECT_KEYS[k.VK_RIGHT.c] = 1;
    var MENU_ITEM_SELECT_KEYS = {}; MENU_ITEM_SELECT_KEYS[k.VK_UP.c] = -1; MENU_ITEM_SELECT_KEYS[k.VK_DOWN.c] = 1;


    init();

    this.eval = function(str) {
        return eval(str);
    };

};
