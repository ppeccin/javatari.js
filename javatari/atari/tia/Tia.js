/**
 * Created by ppeccin on 20/11/2014.
 */

function Tia(pCpu, pPia) {
    var self = this;

    this.powerOn = function() {
        Util.arrayFill(linePixels, HBLANK_COLOR);
        Util.arrayFill(debugPixels, 0);
        audioSignal.getChannel0().setVolume(0);
        audioSignal.getChannel1().setVolume(0);
        initLatchesAtPowerOn();
        observableChange(); observableChangeExtended = true;
        audioSignal.signalOn();
        powerOn = true;
    };

    this.powerOff = function() {
        powerOn = false;
        // Let monitors know that the signals are off
        videoSignal.signalOff();
        audioSignal.signalOff();
    };

    this.frame = function() {
        var frameEnd = false;
        do {
            clock = 0;
            // Send the first clock/3 pulse to the CPU and PIA, perceived by TIA at clock 0
            pia.clockPulse();
            cpu.clockPulse();
            // Releases the CPU at the beginning of the line in case a WSYNC has halted it
            cpu.setRDY(true);
            // HBLANK period
            for (clock = 3; clock < HBLANK_DURATION; clock += 3) {		// 3 .. 66
                if (!repeatLastLine) checkRepeatMode();
                // Send clock/3 pulse to the CPU and PIA each 3rd TIA cycle
                pia.clockPulse();
                cpu.clockPulse();
            }
            // 67
            // First Audio Sample. 2 samples per scan line ~ 31440 KHz
            audioSignal.clockPulse();
            // Display period
            var subClock3 = 2;	    // To control the clock/3 cycles. First at clock 69
            for (clock = 68; clock < LINE_WIDTH; clock++) {			// 68 .. 227
                if (!repeatLastLine) checkRepeatMode();
                // Clock delay decodes
                if (vBlankDecodeActive) vBlankClockDecode();
                // Send clock/3 pulse to the CPU and PIA each 3rd TIA cycle
                if (--subClock3 === 0) {
                    pia.clockPulse();
                    cpu.clockPulse();
                    subClock3 = 3;
                }
                objectsClockCounters();
                if (!repeatLastLine && (clock >= 76 || !hMoveHitBlank))
                    setPixelValue();
                // else linePixels[clock] |= 0x88800080;	// Add a pink dye to show pixels repeated
            }
            // End of scan line
            // Second Audio Sample. 2 samples per scan line ~ 31440 KHz
            audioSignal.clockPulse();
            finishLine();
            // Send the finished line to the output and check if monitor vSynched
            frameEnd = videoSignal.nextLine(linePixels, vSyncOn);
        } while(!frameEnd);
        // Ask for a refresh of the frame
        audioSignal.finishFrame();
        videoSignal.finishFrame();
    };

    this.connectBus = function(aBus) {
        bus = aBus;
    };

    this.getVideoOutput = function() {
        return videoSignal;
    };

    this.getAudioOutput = function() {
        return audioSignal;
    };

    this.setVideoStandard = function(standard) {
        videoSignal.standard = standard;
        palette = standard === VideoStandard.NTSC ? VideoStandard.NTSC.palette : VideoStandard.PAL.palette;
    };

    this.debug = function(level) {
        debugLevel = level > 4 ? 0 : level;
        debug = debugLevel !== 0;
        videoSignal.showOSD(debug ? "Debug Level " + debugLevel : "Debug OFF", true);
        cpu.debug = debug;
        pia.debug = debug;
        if (debug) debugSetColors();
        else debugRestoreColors();
    };

    this.read = function(address) {
        var reg = address & READ_ADDRESS_MASK;
        if (reg === 0x00) return CXM0P;
        if (reg === 0x01) return CXM1P;
        if (reg === 0x02) return CXP0FB;
        if (reg === 0x03) return CXP1FB;
        if (reg === 0x04) return CXM0FB;
        if (reg === 0x05) return CXM1FB;
        if (reg === 0x06) return CXBLPF;
        if (reg === 0x07) return CXPPMM;
        if (reg === 0x08) return INPT0;
        if (reg === 0x09) return INPT1;
        if (reg === 0x0A) return INPT2;
        if (reg === 0x0B) return INPT3;
        if (reg === 0x0C) return INPT4;
        if (reg === 0x0D) return INPT5;
        return 0;
    };

    this.write = function(address, i) {
        var reg = address & WRITE_ADDRESS_MASK;
        if (reg === 0x1B) {  playerDelaySpriteChange(0, i); return; }
        if (reg === 0x1C) { playerDelaySpriteChange(1, i); return; }
   		if (reg === 0x02) { cpu.setRDY(false); if (debug) debugPixel(DEBUG_WSYNC_COLOR); return; } 	// <STROBE> Halts the CPU until the next HBLANK
        if (reg === 0x2A) { hitHMOVE(); return; }
        if (reg === 0x0D) { if (PF0 != i || playfieldDelayedChangePart === 0) playfieldDelaySpriteChange(0, i); return; }
        if (reg === 0x0E) { if (PF1 != i || playfieldDelayedChangePart === 1) playfieldDelaySpriteChange(1, i); return; }
        if (reg === 0x0F) { if (PF2 != i || playfieldDelayedChangePart === 2) playfieldDelaySpriteChange(2, i); return; }
        if (reg === 0x06) { observableChange(); if (!debug) player0Color = missile0Color = palette[i]; return; }
        if (reg === 0x07) { observableChange(); if (!debug) player1Color = missile1Color = palette[i]; return; }
        if (reg === 0x08) { observableChange(); if (!debug) playfieldColor = ballColor = palette[i]; return; }
        if (reg === 0x09) { observableChange(); if (!debug) playfieldBackground = palette[i]; return; }
        if (reg === 0x1D) { observableChange(); missile0Enabled = (i & 0x02) !== 0; return; }
        if (reg === 0x1E) { observableChange(); missile1Enabled = (i & 0x02) !== 0; return; }
        if (reg === 0x14) { hitRESBL(); return; }
        if (reg === 0x10) { hitRESP0(); return; }
        if (reg === 0x11) { hitRESP1(); return; }
        if (reg === 0x12) { hitRESM0(); return; }
        if (reg === 0x13) { hitRESM1(); return; }
        if (reg === 0x20) { HMP0 = i > 127 ? -16 + (i >>> 4) : i >>> 4; return; }
        if (reg === 0x21) { HMP1 = i > 127 ? -16 + (i >>> 4) : i >>> 4; return; }
        if (reg === 0x22) { HMM0 = i > 127 ? -16 + (i >>> 4) : i >>> 4; return; }
        if (reg === 0x23) { HMM1 = i > 127 ? -16 + (i >>> 4) : i >>> 4; return; }
        if (reg === 0x24) { HMBL = i > 127 ? -16 + (i >>> 4) : i >>> 4; return; }
        if (reg === 0x2B) { HMP0 = HMP1 = HMM0 = HMM1 = HMBL = 0; return; }
        if (reg === 0x1F) { ballSetGraphic(i); return; }
        if (reg === 0x04) { player0SetShape(i); return; }
        if (reg === 0x05) { player1SetShape(i); return; }
        if (reg === 0x0A) { playfieldAndBallSetShape(i); return; }
        if (reg === 0x0B) { observableChange(); player0Reflected = (i & 0x08) !== 0; return; }
        if (reg === 0x0C) { observableChange(); player1Reflected = (i & 0x08) !== 0; return; }
        if (reg === 0x25) { observableChange(); player0VerticalDelay = (i & 0x01) !== 0; return; }
        if (reg === 0x26) { observableChange(); player1VerticalDelay = (i & 0x01) !== 0; return; }
        if (reg === 0x27) { observableChange(); ballVerticalDelay = (i & 0x01) !== 0; return; }
        if (reg === 0x15) { AUDC0 = i; audioSignal.getChannel0().setControl(i & 0x0f); return; }
        if (reg === 0x16) { AUDC1 = i; audioSignal.getChannel1().setControl(i & 0x0f); return; }
        if (reg === 0x17) { AUDF0 = i; audioSignal.getChannel0().setDivider((i & 0x1f) + 1); return; }     // Bits 0-4, Divider from 1 to 32
        if (reg === 0x18) { AUDF1 = i; audioSignal.getChannel1().setDivider((i & 0x1f) + 1); return; }     // Bits 0-4, Divider from 1 to 32
        if (reg === 0x19) { AUDV0 = i; audioSignal.getChannel0().setVolume(i & 0x0f); return; }            // Bits 0-3, Volume from 0 to 15
        if (reg === 0x1A) { AUDV1 = i; audioSignal.getChannel1().setVolume(i & 0x0f); return; }            // Bits 0-3, Volume from 0 to 15
        if (reg === 0x28) { missile0SetResetToPlayer(i); return; }
        if (reg === 0x29) { missile1SetResetToPlayer(i); return; }
        if (reg === 0x01) { vBlankSet(i); return; }
        if (reg === 0x00) { observableChange(); vSyncOn = (i & 0x02) !== 0; if (debug) debugPixel(VSYNC_COLOR); return; }
        if (reg === 0x2C) { observableChange(); CXM0P = CXM1P = CXP0FB = CXP1FB = CXM0FB = CXM1FB = CXBLPF = CXPPMM = 0; return; }
        // if (reg === 0x03) { clock = 0; return; }  //  RSYNC
        return 0;
    };

    var setPixelValue = function() {
        // No need to calculate all possibilities in vSync/vBlank. TODO No collisions will be detected
        if (vSyncOn) {
            linePixels[clock] = vSyncColor;
            return;
        }
        if (vBlankOn) {
            linePixels[clock] = vBlankColor;
            return;
        }
        // Flags for Collision latches
        var P0 = false, P1 = false, M0 = false, M1 = false, FL = false, BL = false;
        // Updates the current PlayFiled pixel to draw only each 4 pixels, or at the first calculated pixel after stopped using cached line
        if ((clock & 0x03) === 0 || clock === lastObservableChangeClock)		// clock & 0x03 is the same as clock % 4
            playfieldUpdateCurrentPixel();
        // Pixel color
        var color;

        // Get the value for the PlayField and Ball first only if PlayField and Ball have higher priority
        if (playfieldPriority) {
            // Get the value for the Ball
            if (ballScanCounter >= 0 && ballScanCounter <= 7) {
                playersPerformDelayedSpriteChanges();		// May trigger Ball delayed enablement
                if (ballEnabled) {
                    BL = true;
                    color = ballColor;
                }
            }
            if (playfieldCurrentPixel) {
                FL = true;
                if (!color) color = playfieldColor;	// No Score Mode in priority mode
            }
        }
        // Get the value for Player0
        if (player0ScanCounter >= 0 && player0ScanCounter <= 31) {
            playersPerformDelayedSpriteChanges();
            var sprite = player0VerticalDelay ? player0ActiveSprite : player0DelayedSprite;
            if (sprite != 0)
                if (((sprite >> (player0Reflected ? (7 - (player0ScanCounter >>> 2)) : (player0ScanCounter >>> 2))) & 0x01) !== 0) {
                    P0 = true;
                    if (!color) color = player0Color;
                }
        }
        if (missile0ScanCounter >= 0 && missile0Enabled && missile0ScanCounter <= 7 && !missile0ResetToPlayer) {
            M0 = true;
            if (!color > 0) color = missile0Color;
        }
        // Get the value for Player1
        if (player1ScanCounter >= 0 && player1ScanCounter <= 31) {
            playersPerformDelayedSpriteChanges();
            sprite = player1VerticalDelay ? player1ActiveSprite : player1DelayedSprite;
            if (sprite !== 0)
                if (((sprite >> (player1Reflected ? (7 - (player1ScanCounter >>> 2)) : (player1ScanCounter >>> 2))) & 0x01) !== 0) {
                    P1 = true;
                    if (!color) color = player1Color;
                }
        }
        if (missile1ScanCounter >= 0 && missile1Enabled &&  missile1ScanCounter <= 7 && !missile1ResetToPlayer) {
            M1 = true;
            if (!color) color = missile1Color;
        }
        if (!playfieldPriority) {
            // Get the value for the Ball (low priority)
            if (ballScanCounter >= 0 && ballScanCounter <= 7) {
                playersPerformDelayedSpriteChanges();		// May trigger Ball delayed enablement
                if (ballEnabled) {
                    BL = true;
                    if (!color) color = ballColor;
                }
            }
            // Get the value for the the PlayField (low priority)
            if (playfieldCurrentPixel) {
                FL = true;
                if (!color) color = !playfieldScoreMode ? playfieldColor : (clock < 148 ? player0Color : player1Color);
            }
        }
        // If nothing more is showing, get the PlayField background value (low priority)
        if (!color) color = playfieldBackground;
        // Set the correct pixel color
        linePixels[clock] = color;
        // Finish collision latches
        if (debugNoCollisions) return;
        if (P0 && FL)
            CXP0FB |= 0x80;
        if (P1) {
            if (FL) CXP1FB |= 0x80;
            if (P0) CXPPMM |= 0x80;
        }
        if (BL) {
            if (FL) CXBLPF |= 0x80;
            if (P0) CXP0FB |= 0x40;
            if (P1) CXP1FB |= 0x40;
        }
        if (M0) {
            if (P1) CXM0P  |= 0x80;
            if (P0) CXM0P  |= 0x40;
            if (FL) CXM0FB |= 0x80;
            if (BL) CXM0FB |= 0x40;
        }
        if (M1) {
            if (P0) CXM1P  |= 0x80;
            if (P1) CXM1P  |= 0x40;
            if (FL) CXM1FB |= 0x80;
            if (BL) CXM1FB |= 0x40;
            if (M0) CXPPMM |= 0x40;
        }
    };

    var finishLine = function() {
        // Handle Paddles capacitor charging, only if paddles are connected (position >= 0)
        if (paddle0Position >= 0 && !paddleCapacitorsGrounded) {
            if (INPT0 < 0x80 && ++paddle0CapacitorCharge >= paddle0Position) INPT0 |= 0x80;
            if (INPT1 < 0x80 && ++paddle1CapacitorCharge >= paddle1Position) INPT1 |= 0x80;
        }
        // Fills the extended HBLANK portion of the current line if needed
        if (hMoveHitBlank) {
            linePixels[HBLANK_DURATION] = linePixels[HBLANK_DURATION + 1] =
            linePixels[HBLANK_DURATION + 2] = linePixels[HBLANK_DURATION + 3] =
            linePixels[HBLANK_DURATION + 4] = linePixels[HBLANK_DURATION + 5] =
            linePixels[HBLANK_DURATION + 6] = linePixels[HBLANK_DURATION + 7] = hBlankColor;    // This is faster than a fill
            hMoveHitBlank = false;
        }
        // Perform late HMOVE hit if needed
        if (hMoveLateHit) {
            hMoveLateHit = false;
            hMoveHitBlank = hMoveLateHitBlank;
            performHMOVE();
        }
        // Extend pixel computation to the entire next line if needed
        if (observableChangeExtended) {
            lastObservableChangeClock = 227;
            observableChangeExtended = false;
        }
        // Inject debugging information in the line if needed
        if (debugLevel >= 2) processDebugPixelsInLine();
    };

    var playfieldUpdateCurrentPixel = function() {
        playfieldPerformDelayedSpriteChange(false);
        if (playfieldPatternInvalid) {
            playfieldPatternInvalid = false;
            // Shortcut if the Playfield is all clear
            if (PF0 === 0 && PF1 === 0 && PF2 === 0) {
                Util.arrayFill(playfieldPattern, false);
                playfieldCurrentPixel = false;
                return;
            }
            var s, i;
            if (playfieldReflected) {
                s = 40; i = -1;
            } else {
                s = 19; i = 1;
            }
            playfieldPattern[0]  = playfieldPattern[s+=i] = (PF0 & 0x10) != 0;
            playfieldPattern[1]  = playfieldPattern[s+=i] = (PF0 & 0x20) != 0;
            playfieldPattern[2]  = playfieldPattern[s+=i] = (PF0 & 0x40) != 0;
            playfieldPattern[3]  = playfieldPattern[s+=i] = (PF0 & 0x80) != 0;
            playfieldPattern[4]  = playfieldPattern[s+=i] = (PF1 & 0x80) != 0;
            playfieldPattern[5]  = playfieldPattern[s+=i] = (PF1 & 0x40) != 0;
            playfieldPattern[6]  = playfieldPattern[s+=i] = (PF1 & 0x20) != 0;
            playfieldPattern[7]  = playfieldPattern[s+=i] = (PF1 & 0x10) != 0;
            playfieldPattern[8]  = playfieldPattern[s+=i] = (PF1 & 0x08) != 0;
            playfieldPattern[9]  = playfieldPattern[s+=i] = (PF1 & 0x04) != 0;
            playfieldPattern[10] = playfieldPattern[s+=i] = (PF1 & 0x02) != 0;
            playfieldPattern[11] = playfieldPattern[s+=i] = (PF1 & 0x01) != 0;
            playfieldPattern[12] = playfieldPattern[s+=i] = (PF2 & 0x01) != 0;
            playfieldPattern[13] = playfieldPattern[s+=i] = (PF2 & 0x02) != 0;
            playfieldPattern[14] = playfieldPattern[s+=i] = (PF2 & 0x04) != 0;
            playfieldPattern[15] = playfieldPattern[s+=i] = (PF2 & 0x08) != 0;
            playfieldPattern[16] = playfieldPattern[s+=i] = (PF2 & 0x10) != 0;
            playfieldPattern[17] = playfieldPattern[s+=i] = (PF2 & 0x20) != 0;
            playfieldPattern[18] = playfieldPattern[s+=i] = (PF2 & 0x40) != 0;
            playfieldPattern[19] = playfieldPattern[s+=i] = (PF2 & 0x80) != 0;
        }
        playfieldCurrentPixel = playfieldPattern[((clock - HBLANK_DURATION) >>> 2)];
    };

    var playfieldDelaySpriteChange = function(part, sprite) {
        observableChange();
        if (debug) debugPixel(DEBUG_PF_GR_COLOR);
        playfieldPerformDelayedSpriteChange(true);
        playfieldDelayedChangeClock = clock;
        playfieldDelayedChangePart = part;
        playfieldDelayedChangePattern = sprite;
    };

    var playfieldPerformDelayedSpriteChange = function(force) {
        // Only commits change if there is one and the delay has passed
        if (playfieldDelayedChangePart === -1) return;
        if (!force) {
            var dif = clock - playfieldDelayedChangeClock;
            if (dif === 0 || dif === 1) return;
        }
        observableChange();
        if 		(playfieldDelayedChangePart === 0) PF0 = playfieldDelayedChangePattern;
        else if	(playfieldDelayedChangePart === 1) PF1 = playfieldDelayedChangePattern;
        else if (playfieldDelayedChangePart === 2) PF2 = playfieldDelayedChangePattern;
        playfieldPatternInvalid = true;
        playfieldDelayedChangePart = -1;		// Marks the delayed change as nothing
    };

    var ballSetGraphic = function(value) {
        observableChange();
        ballDelayedEnablement = (value & 0x02) != 0;
        if (!ballVerticalDelay) ballEnabled = ballDelayedEnablement;
    };

    var player0SetShape = function(shape) {
        observableChange();
        // Missile size
        var speed = shape & 0x30;
        if 		(speed === 0x00) speed = 8;		// Normal size = 8 = full speed = 1 pixel per clock
        else if	(speed === 0x10) speed = 4;
        else if	(speed === 0x20) speed = 2;
        else if	(speed === 0x30) speed = 1;
        if (missile0ScanSpeed !== speed) {
            // if a copy is about to start, adjust for the new speed
            if (missile0ScanCounter > 7) missile0ScanCounter = 7 + (missile0ScanCounter - 7) / missile0ScanSpeed * speed;
            // if a copy is being scanned, kill the scan
            else if (missile0ScanCounter >= 0) missile0ScanCounter = -1;
            missile0ScanSpeed = speed;
        }
        // Player size and copies
        if ((shape & 0x07) === 0x05) {			// Double size = 1/2 speed
            speed = 2;
            player0CloseCopy = player0MediumCopy = player0WideCopy = false;
        } else if ((shape & 0x07) === 0x07) {	// Quad size = 1/4 speed
            speed = 1;
            player0CloseCopy = player0MediumCopy = player0WideCopy = false;
        } else {
            speed = 4;							// Normal size = 4 = full speed = 1 pixel per clock
            player0CloseCopy =  (shape & 0x01) !== 0;
            player0MediumCopy = (shape & 0x02) !== 0;
            player0WideCopy =   (shape & 0x04) !== 0;
        }
        if (player0ScanSpeed !== speed) {
            // if a copy is about to start, adjust for the new speed
            if (player0ScanCounter > 31) player0ScanCounter = 31 + (player0ScanCounter - 31) / player0ScanSpeed * speed;
            // if a copy is being scanned, kill the scan
            else if (player0ScanCounter >= 0) player0ScanCounter = -1;
            player0ScanSpeed = speed;
        }
    };

    var player1SetShape = function(shape) {
        observableChange();
        // Missile size
        var speed = shape & 0x30;
        if 		(speed === 0x00) speed = 8;		// Normal size = 8 = full speed = 1 pixel per clock
        else if	(speed === 0x10) speed = 4;
        else if	(speed === 0x20) speed = 2;
        else if	(speed === 0x30) speed = 1;
        if (missile1ScanSpeed !== speed) {
            // if a copy is about to start, adjust for the new speed
            if (missile1ScanCounter > 7) missile1ScanCounter = 7 + (missile1ScanCounter - 7) / missile1ScanSpeed * speed;
            // if a copy is being scanned, kill the scan
            else if (missile1ScanCounter >= 0) missile1ScanCounter = -1;
            missile1ScanSpeed = speed;
        }
        // Player size and copies
        if ((shape & 0x07) === 0x05) {			// Double size = 1/2 speed
            speed = 2;
            player1CloseCopy = player1MediumCopy = player1WideCopy = false;
        } else if ((shape & 0x07) === 0x07) {	// Quad size = 1/4 speed
            speed = 1;
            player1CloseCopy = player1MediumCopy = player1WideCopy = false;
        } else {
            speed = 4;							// Normal size = 4 = full speed = 1 pixel per clock
            player1CloseCopy =  (shape & 0x01) !== 0;
            player1MediumCopy = (shape & 0x02) !== 0;
            player1WideCopy =   (shape & 0x04) !== 0;
        }
        if (player1ScanSpeed !== speed) {
            // if a copy is about to start, adjust to produce the same start position
            if (player1ScanCounter > 31) player1ScanCounter = 31 + (player1ScanCounter - 31) / player1ScanSpeed * speed;
            // if a copy is being scanned, kill the scan
            else if (player1ScanCounter >= 0) player1ScanCounter = -1;
            player1ScanSpeed = speed;
        }
    };

    var playfieldAndBallSetShape = function(shape) {
        observableChange();
        var reflect = (shape & 0x01) !== 0;
        if (playfieldReflected != reflect) {
            playfieldReflected = reflect;
            playfieldPatternInvalid = true;
        }
        playfieldScoreMode = (shape & 0x02) !== 0;
        playfieldPriority = (shape & 0x04) !== 0;
        var speed = shape & 0x30;
        if 		(speed === 0x00) speed = 8;		// Normal size = 8 = full speed = 1 pixel per clock
        else if	(speed === 0x10) speed = 4;
        else if	(speed === 0x20) speed = 2;
        else if	(speed === 0x30) speed = 1;
        if (ballScanSpeed !== speed) {
            // if a copy is about to start, adjust for the new speed
            if (ballScanCounter > 7) ballScanCounter = 7 + (ballScanCounter - 7) / ballScanSpeed * speed;
            // if a copy is being scanned, kill the scan
            else if (ballScanCounter >= 0) ballScanCounter = -1;
            ballScanSpeed = speed;
        }
    };

    var hitRESP0 = function() {
        observableChange(); observableChangeExtended = true;
        if (debug) debugPixel(DEBUG_P0_RES_COLOR);

        // Hit in last pixel of HBLANK or after
        if (clock >= HBLANK_DURATION + (hMoveHitBlank ? 8-1 : 0)) {
            if (player0Counter !== 155) player0RecentReset = true;
            player0Counter = 155;
            return;
        }

        // Hit before last pixel of HBLANK
        var d = 0;									// No HMOVE, displacement = 0
        if (hMoveHitBlank) {						// With HMOVE
            if (clock >= HBLANK_DURATION)			// During extended HBLANK
                d = (HBLANK_DURATION - clock) + 8;
            else {
                d = (clock - hMoveHitClock - 4) >> 2;
                if (d > 8) d = 8;
            }
        }

        player0Counter = 157 - d;
        player0RecentReset = player0Counter <= 155;
    };

    var hitRESP1 = function() {
        observableChange(); observableChangeExtended = true;
        if (debug) debugPixel(DEBUG_P1_RES_COLOR);

        // Hit in last pixel of HBLANK or after
        if (clock >= HBLANK_DURATION + (hMoveHitBlank ? 8-1 : 0)) {
            if (player1Counter !== 155) player1RecentReset = true;
            player1Counter = 155;
            return;
        }

        // Hit before last pixel of HBLANK
        var d = 0;									// No HMOVE, displacement = 0
        if (hMoveHitBlank) {						// With HMOVE
            if (clock >= HBLANK_DURATION)			// During extended HBLANK
                d = (HBLANK_DURATION - clock) + 8;
            else {
                d = (clock - hMoveHitClock - 4) >> 2;
                if (d > 8) d = 8;
            }
        }

        player1Counter = 157 - d;
        player1RecentReset = player1Counter <= 155;
    };

    var hitRESM0 = function() {
        observableChange(); observableChangeExtended = true;
        if (debug) debugPixel(DEBUG_M0_COLOR);

        // Hit in last pixel of HBLANK or after
        if (clock >= HBLANK_DURATION + (hMoveHitBlank ? 8-1 : 0)) {
            if (missile0Counter !== 155) missile0RecentReset = true;
            missile0Counter = 155;
            return;
        }

        // Hit before last pixel of HBLANK
        var d = 0;									// No HMOVE, displacement = 0
        if (hMoveHitBlank) {						// With HMOVE
            if (clock >= HBLANK_DURATION)			// During extended HBLANK
                d = (HBLANK_DURATION - clock) + 8;
            else {
                d = (clock - hMoveHitClock - 4) >> 2;
                if (d > 8) d = 8;
            }
        }

        missile0Counter = 157 - d;
        missile0RecentReset = missile0Counter <= 155;
    };

    var hitRESM1 = function() {
        observableChange(); observableChangeExtended = true;
        if (debug) debugPixel(DEBUG_M1_COLOR);

        // Hit in last pixel of HBLANK or after
        if (clock >= HBLANK_DURATION + (hMoveHitBlank ? 8-1 : 0)) {
            if (missile1Counter !== 155) missile1RecentReset = true;
            missile1Counter = 155;
            return;
        }

        // Hit before last pixel of HBLANK
        var d = 0;									// No HMOVE, displacement = 0
        if (hMoveHitBlank) {						// With HMOVE
            if (clock >= HBLANK_DURATION)			// During extended HBLANK
                d = (HBLANK_DURATION - clock) + 8;
            else {
                d = (clock - hMoveHitClock - 4) >> 2;
                if (d > 8) d = 8;
            }
        }

        missile1Counter = 157 - d;
        missile1RecentReset = missile1Counter <= 155;
    };

    var hitRESBL = function() {
        observableChange();
        if (debug) debugPixel(DEBUG_BL_COLOR);

        // Hit in last pixel of HBLANK or after
        if (clock >= HBLANK_DURATION + (hMoveHitBlank ? 8-1 : 0)) {
            ballCounter = 155;
            return;
        }

        // Hit before last pixel of HBLANK
        var d = 0;				// No HMOVE, displacement = 0
        if (hMoveHitBlank)		// With HMOVE
            if (clock >= HBLANK_DURATION)				// During extended HBLANK
                d = (HBLANK_DURATION - clock) + 8;
            else {
                d = (clock - hMoveHitClock - 4) >> 2;
                if (d > 8) d = 8;
            }

        ballCounter = 157 - d;
    };

    var hitHMOVE = function() {
        if (debug) debugPixel(DEBUG_HMOVE_COLOR);
        // Normal HMOVE
        if (clock < HBLANK_DURATION) {
            hMoveHitClock = clock;
            hMoveHitBlank = true;
            performHMOVE();
            return;
        }
        // Unsupported HMOVE
        if (clock < 219) {
            debugInfo("Unsupported HMOVE hit");
            return;
        }
        // Late HMOVE: Clocks [219-224] hide HMOVE blank next line, clocks [225, 0] produce normal behavior next line
        hMoveHitClock = 160 - clock;
        hMoveLateHit = true;
        hMoveLateHitBlank = clock >= 225;
    };

    var performHMOVE = function() {
        var add;
        var vis = false;
        add = (hMoveHitBlank ? HMP0 : HMP0 + 8); if (add !== 0) {
            vis = true;
            if (add > 0) {
                for (var i = add; i > 0; i--) player0ClockCounter();
            } else {
                player0Counter += add; if (player0Counter < 0) player0Counter += 160;
                if (player0ScanCounter >= 0) player0ScanCounter -= player0ScanSpeed * add;
            }
        }
        add = (hMoveHitBlank ? HMP1 : HMP1 + 8); if (add !== 0) {
            vis = true;
            if (add > 0) {
                for (i = add; i > 0; i--) player1ClockCounter();
            } else {
                player1Counter += add; if (player1Counter < 0) player1Counter += 160;
                if (player1ScanCounter >= 0) player1ScanCounter -= player1ScanSpeed * add;
            }
        }
        add = (hMoveHitBlank ? HMM0 : HMM0 + 8); if (add !== 0) {
            vis = true;
            if (add > 0) {
                for (i = add; i > 0; i--) missile0ClockCounter();
            } else {
                missile0Counter += add; if (missile0Counter < 0) missile0Counter += 160;
                if (missile0ScanCounter >= 0) missile0ScanCounter -= missile0ScanSpeed * add;
            }
        }
        add = (hMoveHitBlank ? HMM1 : HMM1 + 8); if (add != 0) {
            vis = true;
            if (add > 0) {
                for (i = add; i > 0; i--) missile1ClockCounter();
            } else {
                missile1Counter += add; if (missile1Counter < 0) missile1Counter += 160;
                if (missile1ScanCounter >= 0) missile1ScanCounter -= missile1ScanSpeed * add;
            }
        }
        add = (hMoveHitBlank ? HMBL : HMBL + 8); if (add != 0) {
            vis = true;
            if (add > 0) {
                for (i = add; i > 0; i--) ballClockCounter();
            } else {
                ballCounter += add; if (ballCounter < 0) ballCounter += 160;
                if (ballScanCounter >= 0) ballScanCounter -= ballScanSpeed * add;
            }
        }
        if (vis) observableChange();
    };

    var objectsClockCounters = function() {
        player0ClockCounter();
        player1ClockCounter();
        missile0ClockCounter();
        missile1ClockCounter();
        ballClockCounter();
    };

    var player0ClockCounter = function() {
        if (++player0Counter === 160) player0Counter = 0;
        if (player0ScanCounter >= 0) {
            // If missileResetToPlayer is on and the player scan has started the FIRST copy
            if (missile0ResetToPlayer && player0Counter < 12 && player0ScanCounter >= 28 && player0ScanCounter <= 31)
                missile0Counter = 156;
            player0ScanCounter -= player0ScanSpeed;
        }
        // Start scans 4 clocks before each copy. Scan is between 0 and 31, each pixel = 4 scan clocks
        if (player0Counter === 156) {
            if (player0RecentReset) player0RecentReset = false;
            else player0ScanCounter = 31 + player0ScanSpeed * (player0ScanSpeed === 4 ? 5 : 6);	// If Double or Quadruple size, delays 1 additional pixel
        }
        else if (player0Counter === 12) {
            if (player0CloseCopy) player0ScanCounter = 31 + player0ScanSpeed * 5;
        }
        else if (player0Counter === 28) {
            if (player0MediumCopy) player0ScanCounter = 31 + player0ScanSpeed * 5;
        }
        else if (player0Counter === 60) {
            if (player0WideCopy) player0ScanCounter = 31 + player0ScanSpeed * 5;
        }
    };

    var player1ClockCounter = function() {
        if (++player1Counter === 160) player1Counter = 0;
        if (player1ScanCounter >= 0) {
            // If missileResetToPlayer is on and the player scan has started the FIRST copy
            if (missile1ResetToPlayer && player1Counter < 12 && player1ScanCounter >= 28 && player1ScanCounter <= 31)
                missile1Counter = 156;
            player1ScanCounter -= player1ScanSpeed;
        }
        // Start scans 4 clocks before each copy. Scan is between 0 and 31, each pixel = 4 scan clocks
        if (player1Counter === 156) {
            if (player1RecentReset) player1RecentReset = false;
            else player1ScanCounter = 31 + player1ScanSpeed * (player1ScanSpeed === 4 ? 5 : 6);	// If Double or Quadruple size, delays 1 additional pixel
        }
        else if (player1Counter === 12) {
            if (player1CloseCopy) player1ScanCounter = 31 + player1ScanSpeed * 5;
        }
        else if (player1Counter === 28) {
            if (player1MediumCopy) player1ScanCounter = 31 + player1ScanSpeed * 5;
        }
        else if (player1Counter === 60) {
            if (player1WideCopy) player1ScanCounter = 31 + player1ScanSpeed * 5;
        }
    };

    var missile0ClockCounter = function() {
        if (++missile0Counter === 160) missile0Counter = 0;
        if (missile0ScanCounter >= 0) missile0ScanCounter -= missile0ScanSpeed;
        // Start scans 4 clocks before each copy. Scan is between 0 and 7, each pixel = 8 scan clocks
        if (missile0Counter === 156) {
            if (missile0RecentReset) missile0RecentReset = false;
            else missile0ScanCounter = 7 + missile0ScanSpeed * 4;
        }
        else if (missile0Counter === 12) {
            if (player0CloseCopy) missile0ScanCounter = 7 + missile0ScanSpeed * 4;
        }
        else if (missile0Counter === 28) {
            if (player0MediumCopy) missile0ScanCounter = 7 + missile0ScanSpeed * 4;
        }
        else if (missile0Counter === 60) {
            if (player0WideCopy) missile0ScanCounter = 7 + missile0ScanSpeed * 4;
        }
    };

    var missile1ClockCounter = function() {
        if (++missile1Counter === 160) missile1Counter = 0;
        if (missile1ScanCounter >= 0) missile1ScanCounter -= missile1ScanSpeed;
        // Start scans 4 clocks before each copy. Scan is between 0 and 7, each pixel = 8 scan clocks
        if (missile1Counter === 156) {
            if (missile1RecentReset) missile1RecentReset = false;
            else missile1ScanCounter = 7 + missile1ScanSpeed * 4;
        }
        else if (missile1Counter === 12) {
            if (player1CloseCopy) missile1ScanCounter = 7 + missile1ScanSpeed * 4;
        }
        else if (missile1Counter === 28) {
            if (player1MediumCopy) missile1ScanCounter = 7 + missile1ScanSpeed * 4;
        }
        else if (missile1Counter === 60) {
            if (player1WideCopy) missile1ScanCounter = 7 + missile1ScanSpeed * 4;
        }
    };

    var ballClockCounter = function() {
        if (++ballCounter === 160) ballCounter = 0;
        if (ballScanCounter >= 0) ballScanCounter -= ballScanSpeed;
        // The ball does not have copies and does not wait for the next scanline to start even if recently reset
        // Start scans 4 clocks before. Scan is between 0 and 7, each pixel = 8 scan clocks
        if (ballCounter === 156) ballScanCounter = 7 + ballScanSpeed * 4;
    };

    var playerDelaySpriteChange = function(player, sprite) {
        observableChange();
        if (debug) debugPixel(player === 0 ? DEBUG_P0_GR_COLOR : DEBUG_P1_GR_COLOR);
        if (playersDelayedSpriteChangesCount >= PLAYERS_DELAYED_SPRITE_CHANGES_MAX_COUNT) {
            debugInfo(">>> Max player delayed changes reached: " + PLAYERS_DELAYED_SPRITE_CHANGES_MAX_COUNT);
            return;
        }
        playersDelayedSpriteChanges[playersDelayedSpriteChangesCount][0] = clock;
        playersDelayedSpriteChanges[playersDelayedSpriteChangesCount][1] = player;
        playersDelayedSpriteChanges[playersDelayedSpriteChangesCount][2] = sprite;
        playersDelayedSpriteChangesCount++;
    };

    var playersPerformDelayedSpriteChanges = function() {
        if (playersDelayedSpriteChangesCount === 0 || playersDelayedSpriteChanges[0][0] === clock) return;
        for (var i = 0; i < playersDelayedSpriteChangesCount; i++) {
            var change = playersDelayedSpriteChanges[i];
            if (change[1] === 0) {
                player0DelayedSprite = change[2];
                player1ActiveSprite = player1DelayedSprite;
            } else {
                player1DelayedSprite = change[2];
                player0ActiveSprite = player0DelayedSprite;
                ballEnabled = ballDelayedEnablement;
            }
        }
        playersDelayedSpriteChangesCount = 0;
    };

    var missile0SetResetToPlayer = function(res) {
        observableChange();
        if (missile0ResetToPlayer = (res & 0x02) !== 0) missile0Enabled = false;
    };

    var missile1SetResetToPlayer = function(res) {
        observableChange();
        if (missile1ResetToPlayer = (res & 0x02) !== 0) missile1Enabled = false;
    };

    var vBlankSet = function(blank) {
        if (((blank & 0x02) != 0) !== vBlankOn) {	// Start the delayed decode for vBlank state change
            vBlankDecodeActive = true;
            vBlankNewState = !vBlankOn;
        }
        if ((blank & 0x40) !== 0) {
            controlsButtonsLatched = true;			// Enable Joystick Button latches
        } else {
            controlsButtonsLatched = false;			// Disable latches and update registers with the current button state
            if (controlsJOY0ButtonPressed) INPT4 &= 0x7f; else INPT4 |= 0x80;
            if (controlsJOY1ButtonPressed) INPT5 &= 0x7f; else INPT5 |= 0x80;
        }
        if ((blank & 0x80) != 0) {					// Ground paddle capacitors
            paddleCapacitorsGrounded = true;
            paddle0CapacitorCharge = paddle1CapacitorCharge = 0;
            INPT0 &= 0x7f; INPT1 &= 0x7f; INPT2 &= 0x7f; INPT3 &= 0x7f;
        }
        else
            paddleCapacitorsGrounded = false;
    };

    var vBlankClockDecode = function() {
        vBlankDecodeActive = false;
        vBlankOn = vBlankNewState;
        if (debug) debugPixel(DEBUG_VBLANK_COLOR);
        observableChange();
    };

    var observableChange = function() {
        lastObservableChangeClock = clock;
        if (repeatLastLine) repeatLastLine = false;
    };

    var checkRepeatMode = function() {
        // If one entire line since last observable change has just completed, enter repeatLastLine mode
        if (clock === lastObservableChangeClock) {
            repeatLastLine = true;
            lastObservableChangeClock = -1;
        }
    };

    var initLatchesAtPowerOn = function() {
        CXM0P = CXM1P = CXP0FB = CXP1FB = CXM0FB = CXM1FB = CXBLPF = CXPPMM = 0;
        INPT0 = INPT1 = INPT2 = INPT3 = 0;
        INPT4 = INPT5 = 0x80;
    };

    var debugPixel = function(color) {
        debugPixels[clock] = color;
    };

    var processDebugPixelsInLine = function() {
        Util.arrayFillSegment(linePixels, 0, HBLANK_DURATION, hBlankColor);
        if (debugLevel >= 4 && videoSignal.monitor.currentLine() % 10 == 0) {
            for (var i = 0; i < LINE_WIDTH; i++) {
                if (debugPixels[i] !== 0) continue;
                if (i < HBLANK_DURATION) {
                    if (i % 6 == 0 || i == 66 || i == 63)
                        debugPixels[i] = DEBUG_MARKS_COLOR;
                } else {
                    if ((i - HBLANK_DURATION - 1) % 6 == 0)
                        debugPixels[i] = DEBUG_MARKS_COLOR;
                }
            }
        }
        if (debugLevel >= 3) {
            for (i = 0; i < LINE_WIDTH; i++) {
                if (debugPixels[i] != 0) {
                    linePixels[i] = debugPixels[i];
                    debugPixels[i] = 0;
                }
            }
        }
        observableChange();
    };

    var debugSetColors = function() {
        player0Color = DEBUG_P0_COLOR;
        player1Color = DEBUG_P1_COLOR;
        missile0Color = DEBUG_M0_COLOR;
        missile1Color = DEBUG_M1_COLOR;
        ballColor = DEBUG_BL_COLOR;
        playfieldColor = DEBUG_PF_COLOR;
        playfieldBackground = DEBUG_BK_COLOR;
        hBlankColor = debugLevel >= 1 ? DEBUG_HBLANK_COLOR : HBLANK_COLOR;
        vBlankColor = debugLevel >= 2 ? DEBUG_VBLANK_COLOR : VBLANK_COLOR;
    };

    var debugRestoreColors = function() {
        hBlankColor = HBLANK_COLOR;
        vBlankColor = VBLANK_COLOR;
        playfieldBackground = palette[0];
        Util.arrayFill(linePixels, hBlankColor);
        observableChange();
    };

    var debugInfo = function(str) {
        if (debug) console.log("Line: " + videoSignal.monitor.currentLine() +", Pixel: " + clock + ". " + str);
    };


    // Controls interface  -----------------------------------

    var controls = ConsoleControls;

    this.controlStateChanged = function(control, state) {
        switch (control) {
            case controls.JOY0_BUTTON:
                if (state) {
                    controlsJOY0ButtonPressed = true;
                    INPT4 &= 0x7f;
                } else {
                    controlsJOY0ButtonPressed = false;
                    if (!controlsButtonsLatched)			// Does not lift the button if Latched Mode is on
                        INPT4 |= 0x80;
                }
                return;
            case controls.JOY1_BUTTON:
                if (state) {
                    controlsJOY1ButtonPressed = true;
                    INPT5 &= 0x7f;
                } else {
                    controlsJOY1ButtonPressed = false;
                    if (!controlsButtonsLatched)			// Does not lift the button if Latched Mode is on
                        INPT5 |= 0x80;
                }
                return;
        }
        // Toggles
        if (!state) return;
        switch (control) {
            case controls.DEBUG:
                self.debug(debugLevel + 1); return;
            case controls.NO_COLLISIONS:
                debugNoCollisions = !debugNoCollisions;
                videoSignal.showOSD(debugNoCollisions ? "Collisions OFF" : "Collisions ON", true);
                return;
            case controls.PAUSE:
                debugPause = !debugPause; debugPauseMoreFrames = 0;
                videoSignal.showOSD(debugPause ? "PAUSE" : "RESUME", true);
                return;
            case controls.FRAME:
                debugPauseMoreFrames++; return;
            case controls.TRACE:
                cpu.trace = !cpu.trace; return;
        }
    };

    this.controlValueChanged = function(control, position) {
        switch (control) {
            case controls.PADDLE0_POSITION:
                paddle0Position = position; return;
            case controls.PADDLE1_POSITION:
                paddle1Position = position; return;
        }
    };

    this.controlsStateReport = function(report) {
        //  No TIA controls visible outside by now
    };


    // Savestate  ------------------------------------------------

    this.saveState = function() {
        return {
            lp:     btoa(Util.uInt32ArrayToByteString(linePixels)),
            lo:     lastObservableChangeClock,
            oc:     observableChangeExtended | 0,
            rl:     repeatLastLine | 0,
            vs:     vSyncOn | 0,
            vb:     vBlankOn | 0,
            vbd:    vBlankDecodeActive | 0,
            vbn:    vBlankNewState | 0,
            f:      Util.booleanArrayToByteString(playfieldPattern),
            fi:     playfieldPatternInvalid | 0,
            fp:     playfieldCurrentPixel | 0,
            fc:     playfieldColor,
            fb:     playfieldBackground,
            fr:     playfieldReflected | 0,
            fs:     playfieldScoreMode | 0,
            ft:     playfieldPriority | 0,
            p0:     player0ActiveSprite,
            p0d:    player0DelayedSprite,
            p0c:    player0Color,
            p0rr:   player0RecentReset | 0,
            p0co:   player0Counter,
            p0sc:   player0ScanCounter,
            p0ss:   player0ScanSpeed,
            p0v:    player0VerticalDelay | 0,
            p0cc:   player0CloseCopy | 0,
            p0mc:   player0MediumCopy | 0,
            p0wc:   player0WideCopy | 0,
            p0r:    player0Reflected | 0,
            p1:     player1ActiveSprite,
            p1d:    player1DelayedSprite,
            p1c:    player1Color,
            p1rr:   player1RecentReset | 0,
            p1co:   player1Counter,
            p1sc:   player1ScanCounter,
            p1ss:   player1ScanSpeed,
            p1v:    player1VerticalDelay | 0,
            p1cc:   player1CloseCopy | 0,
            p1mc:   player1MediumCopy | 0,
            p1wc:   player1WideCopy | 0,
            p1r:    player1Reflected | 0,
            m0:     missile0Enabled | 0,
            m0c:    missile0Color,
            m0rr:   missile0RecentReset | 0,
            m0co:   missile0Counter,
            m0sc:   missile0ScanCounter,
            m0ss:   missile0ScanSpeed,
            m0r:    missile0ResetToPlayer | 0,
            m1:     missile1Enabled | 0,
            m1c:    missile1Color,
            m1rr:   missile1RecentReset | 0,
            m1co:   missile1Counter,
            m1sc:   missile1ScanCounter,
            m1ss:   missile1ScanSpeed,
            m1r:    missile1ResetToPlayer | 0,
            b:      ballEnabled | 0,
            bd:     ballDelayedEnablement | 0,
            bc:     ballColor,
            bco:    ballCounter,
            bsc:    ballScanCounter,
            bss:    ballScanSpeed,
            bv:     ballVerticalDelay | 0,
            fd:     playfieldDelayedChangeClock,
            fdc:    playfieldDelayedChangePart,
            fdp:    playfieldDelayedChangePattern,
            pds:    btoa(Util.uInt8BiArrayToByteString(playersDelayedSpriteChanges)),
            pdc:    playersDelayedSpriteChangesCount,
            hb:     hMoveHitBlank | 0,
            hc:     hMoveHitClock,
            PF0:    PF0,
            PF1:    PF1,
            PF2:    PF2,
            AC0:    AUDC0,
            AC1:    AUDC1,
            AF0:    AUDF0,
            AF1:    AUDF1,
            AV0:    AUDV0,
            AV1:    AUDV1,
            HP0:    HMP0,
            HP1:    HMP1,
            HM0:    HMM0,
            HM1:    HMM1,
            HB:     HMBL,
            XM0P:   CXM0P,
            XM1P:   CXM1P,
            XP0F:   CXP0FB,
            XP1F:   CXP1FB,
            XM0F:   CXM0FB,
            XM1F:   CXM1FB,
            XBP:    CXBLPF,
            XPM:    CXPPMM
        };
    };

    this.loadState = function(state) {
        linePixels						 =  Util.byteStringToUInt32Array(atob(state.lp));
        lastObservableChangeClock		 =	state.lo;
        observableChangeExtended		 =  !!state.oc;
        repeatLastLine 					 =	!!state.rl;
        vSyncOn                     	 =  !!state.vs;
        vBlankOn                    	 =  !!state.vb;
        vBlankDecodeActive				 =  !!state.vbd;
        vBlankNewState				 	 =  !!state.vbn;
        playfieldPattern            	 =  Util.byteStringToBooleanArray(state.f);
        playfieldPatternInvalid     	 =  !!state.fi;
        playfieldCurrentPixel       	 =  !!state.fp;
        playfieldColor              	 =  state.fc;
        playfieldBackground         	 =  state.fb;
        playfieldReflected          	 =  !!state.fr;
        playfieldScoreMode          	 =  !!state.fs;
        playfieldPriority           	 =  !!state.ft;
        player0ActiveSprite         	 =  state.p0;
        player0DelayedSprite        	 =  state.p0d;
        player0Color                	 =  state.p0c;
        player0RecentReset       	 	 =  !!state.p0rr;
        player0Counter	            	 =  state.p0co;
        player0ScanCounter	        	 =  state.p0sc;
        player0ScanSpeed            	 =  state.p0ss;
        player0VerticalDelay        	 =  !!state.p0v;
        player0CloseCopy            	 =  !!state.p0cc;
        player0MediumCopy           	 =  !!state.p0mc;
        player0WideCopy             	 =  !!state.p0wc;
        player0Reflected            	 =  !!state.p0r;
        player1ActiveSprite         	 =  state.p1;
        player1DelayedSprite        	 =  state.p1d;
        player1Color                	 =  state.p1c;
        player1RecentReset       		 =  !!state.p1rr;
        player1Counter              	 =  state.p1co;
        player1ScanCounter				 =  state.p1sc;
        player1ScanSpeed				 =  state.p1ss;
        player1VerticalDelay        	 =  !!state.p1v;
        player1CloseCopy            	 =  !!state.p1cc;
        player1MediumCopy           	 =  !!state.p1mc;
        player1WideCopy             	 =  !!state.p1wc;
        player1Reflected            	 =  !!state.p1r;
        missile0Enabled             	 =  !!state.m0;
        missile0Color               	 =  state.m0c;
        missile0RecentReset      	 	 =  !!state.m0rr;
        missile0Counter             	 =  state.m0co;
        missile0ScanCounter         	 =  state.m0sc;
        missile0ScanSpeed				 =  state.m0ss;
        missile0ResetToPlayer			 =  !!state.m0r;
        missile1Enabled             	 =  !!state.m1;
        missile1Color               	 =  state.m1c;
        missile1RecentReset      	 	 =  !!state.m1rr;
        missile1Counter             	 =  state.m1co;
        missile1ScanCounter         	 =  state.m1sc;
        missile1ScanSpeed				 =  state.m1ss;
        missile1ResetToPlayer			 =  !!state.m1r;
        ballEnabled                 	 =  !!state.b;
        ballDelayedEnablement       	 =  !!state.bd;
        ballColor                   	 =  state.bc;
        ballCounter                 	 =  state.bco;
        ballScanCounter             	 =  state.bsc;
        ballScanSpeed					 =  state.bss;
        ballVerticalDelay           	 =  !!state.bv;
        playfieldDelayedChangeClock		 =  state.fd;
        playfieldDelayedChangePart		 =  state.fdc;
        playfieldDelayedChangePattern	 =  state.fdp;
        playersDelayedSpriteChanges      =  Util.byteStringToUInt8BiArray(atob(state.pds), 3);
        playersDelayedSpriteChangesCount =  state.pdc;
        hMoveHitBlank					 =  !!state.hb;
        hMoveHitClock					 =  state.hc;
        PF0								 =  state.PF0;
        PF1								 =  state.PF1;
        PF2								 =  state.PF2;
        AUDC0							 =  state.AC0; audioSignal.getChannel0().setControl(AUDC0 & 0x0f);		// Also update the Audio Generator
        AUDC1							 =  state.AC1; audioSignal.getChannel1().setControl(AUDC1 & 0x0f);
        AUDF0							 =  state.AF0; audioSignal.getChannel0().setDivider((AUDF0 & 0x1f) + 1);
        AUDF1							 =  state.AF1; audioSignal.getChannel1().setDivider((AUDF1 & 0x1f) + 1);
        AUDV0							 =  state.AV0; audioSignal.getChannel0().setVolume(AUDV0 & 0x0f);
        AUDV1							 =  state.AV1; audioSignal.getChannel1().setVolume(AUDV1 & 0x0f);
        HMP0							 =  state.HP0;
        HMP1							 =  state.HP1;
        HMM0							 =  state.HM0;
        HMM1							 =  state.HM1;
        HMBL							 =  state.HB;
        CXM0P 							 =  state.XM0P;
        CXM1P 							 =  state.XM1P;
        CXP0FB							 =  state.XP0F;
        CXP1FB							 =  state.XP1F;
        CXM0FB							 =  state.XM0F;
        CXM1FB							 =  state.XM1F;
        CXBLPF							 =  state.XBP;
        CXPPMM							 =  state.XPM;
        if (debug) debugSetColors();						// IF debug is on, ensure debug colors are used
    };


    // Constants  ------------------------------------------------

    var HBLANK_DURATION = 68;
    var LINE_WIDTH = 228;

    var PLAYERS_DELAYED_SPRITE_CHANGES_MAX_COUNT = 50;  // Supports a maximum of player GR changes before any is drawn

    var VBLANK_COLOR = 0xff000000;		// Full transparency needed for CRT emulation modes
    var HBLANK_COLOR = 0xff000000;
    var VSYNC_COLOR  = 0xffdddddd;

    var DEBUG_P0_COLOR     = 0xff0000ff;
    var DEBUG_P0_RES_COLOR = 0xff2222bb;
    var DEBUG_P0_GR_COLOR  = 0xff111177;
    var DEBUG_P1_COLOR     = 0xffff0000;
    var DEBUG_P1_RES_COLOR = 0xffbb2222;
    var DEBUG_P1_GR_COLOR  = 0xff771111;
    var DEBUG_M0_COLOR     = 0xff6666ff;
    var DEBUG_M1_COLOR     = 0xffff6666;
    var DEBUG_PF_COLOR     = 0xff448844;
    var DEBUG_PF_GR_COLOR  = 0xff33dd33;
    var DEBUG_BK_COLOR     = 0xff334433;
    var DEBUG_BL_COLOR     = 0xff00ffff;
    var DEBUG_MARKS_COLOR  = 0xff202020;
    var DEBUG_HBLANK_COLOR = 0xff444444;
    var DEBUG_VBLANK_COLOR = 0xff2a2a2a;
    var DEBUG_WSYNC_COLOR  = 0xff880088;
    var DEBUG_HMOVE_COLOR  = 0xffffffff;

    var READ_ADDRESS_MASK  = 0x000f;
    var WRITE_ADDRESS_MASK = 0x003f;


    // Variables  ---------------------------------------------------

    var cpu = pCpu;
    var pia = pPia;
    var bus;

    var powerOn = false;

    var clock;
    var linePixels = new Array(LINE_WIDTH);

    var vSyncOn = false;
    var vBlankOn = false;
    var vBlankDecodeActive = false;
    var vBlankNewState;

    var playfieldPattern = Util.arrayFill(new Array(40), false);
    var playfieldPatternInvalid = true;
    var playfieldCurrentPixel = false;
    var playfieldColor = 0xff000000;
    var playfieldBackground = 0xff000000;
    var playfieldReflected = false;
    var playfieldScoreMode = false;
    var playfieldPriority = false;
    var playfieldDelayedChangeClock = -1;
    var playfieldDelayedChangePart = -1;			// Supports only one delayed change at a time.
    var playfieldDelayedChangePattern = -1;

    var player0ActiveSprite = 0;
    var player0DelayedSprite = 0;
    var player0Color = 0xff000000;
    var player0RecentReset = false;
    var player0Counter = 0;							// Position!
    var player0ScanCounter = -1;					// 31 down to 0. Current scan position. Negative = scan not happening
    var player0ScanSpeed = 4;						// Decrement ScanCounter. 4 per clock = 1 pixel wide
    var player0VerticalDelay = false;
    var player0CloseCopy = false;
    var player0MediumCopy = false;
    var player0WideCopy = false;
    var player0Reflected = false;

    var player1ActiveSprite = 0;
    var player1DelayedSprite = 0;
    var player1Color = 0xff000000;
    var player1RecentReset = false;
    var player1Counter = 0;
    var player1ScanCounter = -1;
    var player1ScanSpeed = 4;
    var player1VerticalDelay = false;
    var player1CloseCopy = false;
    var player1MediumCopy = false;
    var player1WideCopy = false;
    var player1Reflected = false;

    var missile0Enabled = false;
    var missile0Color = 0xff000000;
    var missile0RecentReset = false;
    var missile0Counter = 0;
    var missile0ScanCounter = -1;
    var missile0ScanSpeed = 8;						// 8 per clock = 1 pixel wide
    var missile0ResetToPlayer = false;

    var missile1Enabled = false;
    var missile1Color = 0xff000000;
    var missile1RecentReset = false;
    var missile1Counter = 0;
    var missile1ScanCounter = -1;
    var missile1ScanSpeed = 8;
    var missile1ResetToPlayer = false;

    var ballEnabled = false;
    var ballDelayedEnablement = false;
    var ballColor = 0xff000000;
    var ballCounter = 0;
    var ballScanCounter = -1;
    var ballScanSpeed = 8;							// 8 per clock = 1 pixel wide
    var ballVerticalDelay = false;

    var playersDelayedSpriteChanges = Util.arrayFillWithArrayClone(new Array(PLAYERS_DELAYED_SPRITE_CHANGES_MAX_COUNT), [0, 0, 0]);
    var playersDelayedSpriteChangesCount = 0;

    var hMoveHitBlank = false;
    var hMoveHitClock = -1;
    var hMoveLateHit = false;
    var hMoveLateHitBlank = false;

    var debug = false;
    var debugLevel = 0;
    var debugNoCollisions = false;
    var debugPixels = Util.arrayFill(new Array(LINE_WIDTH), 0);
    var debugPause = false;
    var debugPauseMoreFrames = 0;

    var vSyncColor = VSYNC_COLOR;
    var vBlankColor = VBLANK_COLOR;
    var hBlankColor = VBLANK_COLOR;

    var repeatLastLine = false;
    var lastObservableChangeClock = -1;
    var observableChangeExtended = false;

    var controlsButtonsLatched = false;
    var controlsJOY0ButtonPressed = false;
    var controlsJOY1ButtonPressed = false;

    var paddleCapacitorsGrounded = false;
    var paddle0Position = -1;			    // 380 = Left, 190 = Middle, 0 = Right. -1 = disconnected, won't charge POTs
    var paddle0CapacitorCharge = 0;
    var paddle1Position = -1;
    var paddle1CapacitorCharge = 0;

    var videoSignal = new TiaVideoSignal();
    var palette;

    var audioSignal = new TiaAudioSignal();


    // Read registers -------------------------------------------

    var CXM0P  = 0;     // collision M0-P1, M0-P0 (Bit 7,6)
    var CXM1P  = 0;     // collision M1-P0, M1-P1
    var CXP0FB = 0;	    // collision P0-PF, P0-BL
    var CXP1FB = 0;	    // collision P1-PF, P1-BL
    var CXM0FB = 0;	    // collision M0-PF, M0-BL
    var CXM1FB = 0;	    // collision M1-PF, M1-BL
    var CXBLPF = 0;	    // collision BL-PF, unused
    var CXPPMM = 0;	    // collision P0-P1, M0-M1
    var INPT0 =  0;     // Paddle0 Left pot port
    var INPT1 =  0;     // Paddle0 Right pot port
    var INPT2 =  0;     // Paddle1 Left pot port
    var INPT3 =  0;     // Paddle1 Right pot port
    var INPT4 =  0;     // input (Joy0 button)
    var INPT5 =  0;     // input (Joy1 button)


    // Write registers  ------------------------------------------

    var PF0;		// 1111....  playfield register byte 0
    var PF1;		// 11111111  playfield register byte 1
    var PF2;		// 11111111  playfield register byte 2
    var AUDC0;		// ....1111  audio control 0
    var AUDC1;		// ....1111  audio control 1
    var AUDF0;		// ...11111  audio frequency 0
    var AUDF1;		// ...11111  audio frequency 1
    var AUDV0;		// ....1111  audio volume 0
    var AUDV1;		// ....1111  audio volume 1
    var HMP0;		// 1111....  horizontal motion player 0
    var HMP1;		// 1111....  horizontal motion player 1
    var HMM0;		// 1111....  horizontal motion missile 0
    var HMM1;		// 1111....  horizontal motion missile 1
    var HMBL;		// 1111....  horizontal motion ball

}