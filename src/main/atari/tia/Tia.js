// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// TODO NUSIZ during scan with HMOVE not correct. For now kill the scan in progress
// TODO Starfield Effect not implemented
// TODO AUTO Video Standard Detection too aggressive?
// TODO Vsynch lines count affects vertical position!

jt.Tia = function(pCpu, pPia, audioSocket) {
    "use strict";

    var self = this;

    function init() {
    }

    this.powerOn = function() {
        jt.Util.arrayFill(linePixels, VBLANK_COLOR);
        jt.Util.arrayFill(debugPixels, 0);
        audioSignal.getChannel0().setVolume(0);
        audioSignal.getChannel1().setVolume(0);
        initLatchesAtPowerOn();
        hMoveLateHit = false;
        audioSignal.powerOn();
        powerOn = true;
    };

    this.powerOff = function() {
        powerOn = false;
        // Let monitors know that the signals are off
        videoSignal.signalOff();
        audioSignal.powerOff();
    };

    this.frame = function() {
        do {
            // Begin line
            clock = 0;
            renderClock = HBLANK_DURATION;

            if (debug && debugLevel >= 4) jt.Util.arrayFill(linePixels, 0xff000000);     // clear line

            checkLateHMOVE();
            // Send the first clock/3 pulse to the CPU and PIA, perceived by TIA at clock 0 before releasing halt, then release halt
            bus.clockPulse();
            cpu.setRDY(true);
            for (var x = 0; x < 22; ++x) { clock += 3; bus.clockPulse(); }      // TIA 3..66     CPU 1..22
            for (var y = 0; y < 27; ++y) { clock += 3; bus.clockPulse(); }      // TIA 69..147   CPU 23..49
            audioSignal.audioClockPulse();
            for (var z = 0; z < 26; ++z) { clock += 3; bus.clockPulse(); }      // TIA 150..225  CPU 50..75
            audioSignal.audioClockPulse();
            finishLine();
        } while(!videoSignal.nextLine(linePixels, vSyncOn));

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
        videoSignal.setVideoStandard(standard);
        palette = jt.TiaPalettes[standard.name];
    };

    this.debug = function(level) {
        debugLevel = level > 4 ? 0 : level;
        debug = debugLevel !== 0;
        //cpu.debug = debug;
        pia.debug = debug;
        if (debug) debugSetColors();
        else debugRestoreColors();
    };

    this.showDebugMessage = function() {
        videoSignal.showOSD(debug ? "Debug Level " + debugLevel : "Debug OFF", true);
    };

    this.debugNoCollisions = function(state) {
        debugNoCollisions = !!state;
    };

    this.getDebugNoCollisions = function() {
        return debugNoCollisions;
    };

    this.read = function(address) {
        switch(address & READ_ADDRESS_MASK) {
            // P0P1, P0M0, P0M1, P0PF,     P0BL, P1M0, P1M1, P1PF,     P1BL, M0M1, M0PF, M0BL,     M1PF, M1BL, PFBL, XXXX
            //  15    14    13    12        11    10    9     8         7     6     5     4         3     2     1     0

            case 0x00: updateToClock(); return ((collisions & 0x0400) >> 3) | ((collisions & 0x4000) >> 8);          // CXM0P
            case 0x01: updateToClock(); return ((collisions & 0x2000) >> 6) | ((collisions & 0x0200) >> 3);          // CXM1P
            case 0x02: updateToClock(); return ((collisions & 0x1000) >> 5) | ((collisions & 0x0800) >> 5);          // CXP0FB
            case 0x03: updateToClock(); return ((collisions & 0x0100) >> 1) | ((collisions & 0x0080) >> 1);          // CXP1FB
            case 0x04: updateToClock(); return ((collisions & 0x0020) << 2) | ((collisions & 0x0010) << 2);          // CXM0FB
            case 0x05: updateToClock(); return ((collisions & 0x0008) << 4) | ((collisions & 0x0004) << 4);          // CXM1FB
            case 0x06: updateToClock(); return ((collisions & 0x0002) << 6);                                         // CXBLPF
            case 0x07: updateToClock(); return ((collisions & 0x8000) >> 8) | (collisions & 0x0040);                 // CXPPMM

            case 0x08: return INPT0;
            case 0x09: return INPT1;
            case 0x0A: return INPT2;
            case 0x0B: return INPT3;
            case 0x0C: return INPT4;
            case 0x0D: return INPT5;
            default:   return 0;
        }
    };

    this.write = function(address, i) {
        switch (address & WRITE_ADDRESS_MASK) {
            // VSync, VBlank and HSync
            case 0x00: vSyncSet(i); return;
            case 0x01: vBlankSet(i); return;
            case 0x02: cpu.setRDY(false); if (debug) debugPixel(DEBUG_WSYNC_COLOR); return; 	       // <STROBE> Halts the CPU until the next HBLANK

            // Playfield
            case 0x09: if (COLUBK !== i && !debug) { changeAtClock(); COLUBK = i; playfieldBackground = palette[i]; } return;
            case 0x0D: if (PF0 !== (i & 0xf0)) { changePlayfieldAtClock(); PF0 = i & 0xf0; playfieldUpdateSprite(); } return;
            case 0x0E: if (PF1 !== i) { changePlayfieldAtClock(); PF1 = i; playfieldUpdateSprite(); } return;
            case 0x0F: if (PF2 !== i) { changePlayfieldAtClock(); PF2 = i; playfieldUpdateSprite(); } return;

            // Playfield & Ball
            case 0x08: if (COLUPF !== i && !debug) { if ((playfieldEnabled && !playfieldScoreMode) || ballEnabled) changeAtClock(); COLUPF = i; ballColor = palette[i]; if (!playfieldScoreMode) playfieldColor = playfieldLeftColor = playfieldRightColor = ballColor } return;
            case 0x0A: if (CTRLPF !== i) { playfieldSetShape(i); } return;

            // Ball
            case 0x14: hitRESBL(); return;
            case 0x1F: if (ENABLd !== (i & 0x02)) { ENABLd = i & 0x02; if (!VDELBL) { changeAtClock(); ballSetEnabled(ENABLd); } } return;
            case 0x27: if (VDELBL !== (i  & 1)) { VDELBL = i & 1; if (ENABL !== ENABLd) { changeAtClock(); ballSetEnabled(VDELBL ? ENABL : ENABLd); } } return;

            // Player0
            case 0x04: player0SetShape(i); return;
            case 0x06: if (COLUP0 !== i && !debug) { COLUP0 = i; if (player0Enabled || missile0Enabled || (playfieldEnabled && playfieldScoreMode)) changeAtClock(); player0Color = missile0Color = palette[i]; if (playfieldScoreMode) playfieldLeftColor = player0Color; } return;
            case 0x0B: if (REFP0 !== ((i >> 3) & 1)) { REFP0 = (i >> 3) & 1; player0UpdateSprite(0); } return;
            case 0x10: hitRESP0(); return;
            case 0x1B: player0SetSprite(i); return;
            case 0x25: if (VDELP0 !== (i  & 1)) { VDELP0 = i & 1; if (GRP0 !== GRP0d) player0UpdateSprite(0); } return;

            // Player1
            case 0x05: player1SetShape(i); return;
            case 0x07: if (COLUP1 !== i && !debug) { COLUP1 = i; if (player1Enabled || missile1Enabled || (playfieldEnabled && playfieldScoreMode)) changeAtClock(); player1Color = missile1Color = palette[i]; if (playfieldScoreMode) playfieldRightColor = player1Color; } return;
            case 0x0C: if (REFP1 !== ((i >> 3) & 1)) { REFP1 = (i >> 3) & 1; player1UpdateSprite(0); } return;
            case 0x11: hitRESP1(); return;
            case 0x1C: player1SetSprite(i); return;
            case 0x26: if (VDELP1 !== (i  & 1)) { VDELP1 = i & 1; if (GRP1 !== GRP1d) player1UpdateSprite(0); } return;

            // Missile0
            case 0x12: hitRESM0(); return;
            case 0x1D: if (ENAM0 !== (i & 0x02)) { ENAM0 = i & 0x02; if (!RESMP0) { changeAtClock(); missile0SetEnabled(ENAM0); } } return;
            case 0x28: missile0SetResetToPlayer(i); return;

            // Missile1
            case 0x13: hitRESM1(); return;
            case 0x1E: if (ENAM1 !== (i & 0x02)) { ENAM1 = i & 0x02; if (!RESMP1) { changeAtClock(); missile1SetEnabled(ENAM1); } } return;
            case 0x29: missile1SetResetToPlayer(i); return;

            // HMOVE
            case 0x20: HMP0 = (i > 127 ? -16 : 0) + (i >> 4); return;
            case 0x21: HMP1 = (i > 127 ? -16 : 0) + (i >> 4); return;
            case 0x22: HMM0 = (i > 127 ? -16 : 0) + (i >> 4); return;
            case 0x23: HMM1 = (i > 127 ? -16 : 0) + (i >> 4); return;
            case 0x24: HMBL = (i > 127 ? -16 : 0) + (i >> 4); return;
            case 0x2A: hitHMOVE(); return;
            case 0x2B: HMP0 = HMP1 = HMM0 = HMM1 = HMBL = 0; return;

            // Collisions
            case 0x2C: changeAtClock(); collisions = 0; return;

            // RSYNC
            //case 0x03: clock = 0; return;

            // Audio
            case 0x15: if (AUDC0 !== i) { AUDC0 = i; audioSignal.getChannel0().setControl(i & 0x0f); } return;
            case 0x16: if (AUDC1 !== i) { AUDC1 = i; audioSignal.getChannel1().setControl(i & 0x0f); } return;
            case 0x17: if (AUDF0 !== i) { AUDF0 = i; audioSignal.getChannel0().setDivider((i & 0x1f) + 1); } return;     // Bits 0-4, Divider from 1 to 32
            case 0x18: if (AUDF1 !== i) { AUDF1 = i; audioSignal.getChannel1().setDivider((i & 0x1f) + 1); } return;
            case 0x19: if (AUDV0 !== i) { AUDV0 = i; audioSignal.getChannel0().setVolume(i & 0x0f); } return;            // Bits 0-3, Volume from 0 to 15
            case 0x1A: if (AUDV1 !== i) { AUDV1 = i; audioSignal.getChannel1().setVolume(i & 0x0f); } return;
        }
    };

    // Objects (players, missiles and ball) are emulated pixel by pixel, by their position counters and draw (scan) state,
    // following the TIA object circuits as modelled by Stella. This handles mid-line writes to NUSIZx, CTRLPF, RESPx and RESMx
    // during a scan in progress, even many times in the same line.
    // The counter of each object is derived from its position (objectPixel): it is 157 at the first pixel after the RESx point.
    // Objects must receive every pixel clock, even during VBLANK, so lines are always fully rendered.
    // caution: endClock can exceed but never wrap end of line!
    function renderLineTo(endClock) {
        var finalClock = (endClock > LINE_WIDTH ? LINE_WIDTH : endClock);
        if (renderClock >= finalClock) return;

        var blankUntil = hMoveHitBlank ? 8 : 0;
        var newCollisions = collisions;
        for (var pixel = renderClock - HBLANK_DURATION, finalPixel = finalClock - HBLANK_DURATION; pixel < finalPixel; ++pixel) {

            // Extended HBLANK. Objects receive no clocks here, they got their extra HMOVE clocks before
            if (pixel < blankUntil) {
                linePixels[pixel + HBLANK_DURATION] = vBlankOn ? vBlankColor : hBlankColor;
                continue;
            }

            // Objects signals for this pixel
            var p0 = player0.tick((pixel - player0Pixel + 317) % 160);
            var m0 = missile0.tick((pixel - missile0Pixel + 317) % 160) && missile0Enabled;
            var p1 = player1.tick((pixel - player1Pixel + 317) % 160);
            var m1 = missile1.tick((pixel - missile1Pixel + 317) % 160) && missile1Enabled;
            var bl = ball.tick((pixel - ballPixel + 317) % 160) && ballEnabled;

            // No collisions will be detected during VBLANK
            if (vBlankOn) {
                linePixels[pixel + HBLANK_DURATION] = vBlankColor;
                continue;
            }

            var pf = playfieldEnabled && ((pixel < 80 ? (playfieldPatternL >> (pixel >> 2)) : (playfieldPatternR >> ((pixel - 80) >> 2))) & 1);

            // Pixel color
            var color = 0;
            if (playfieldPriority) {
                if (pf) color = playfieldColor;     // ignore score mode
                else if (bl) color = ballColor;
            }
            if (!color) {
                if (p0) color = player0Color;
                else if (m0) color = missile0Color;
                else if (p1) color = player1Color;
                else if (m1) color = missile1Color;
                else if (!playfieldPriority) {
                    if (pf) color = pixel < 80 ? playfieldLeftColor : playfieldRightColor;
                    else if (bl) color = ballColor;
                }
            }

            // Set pixel color, or background
            linePixels[pixel + HBLANK_DURATION] = color || playfieldBackground;

            // Update collision latches
            var collis = 0xfffe;
            if (!p0) collis &= P0C;
            if (!m0) collis &= M0C;
            if (!p1) collis &= P1C;
            if (!m1) collis &= M1C;
            if (!pf) collis &= PFC;
            if (!bl) collis &= BLC;
            newCollisions |= collis;
        }
        if (!debugNoCollisions) collisions = newCollisions;
    }

    function changeAt(atClock) {
        if (atClock > renderClock) {
            renderLineTo(atClock);
            renderClock = atClock;
        }
    }

    function changeAtClock() {
        changeAt(clock);
    }

    function changeAtClockPlus(add) {
        changeAt(clock + add);                      // Renders "add" pixels forward, for changes that are only effective after "add" clocks
    }

    function changePlayfieldAtClock() {
        if (debug) debugPixel(DEBUG_PF_GR_COLOR);
        // PF changes are only effective after 2 clocks. Additionally, once a playfield pixel (4 clocks wide) has started,
        // it will remain the same until the end. So we will perceive this change accordingly
        if (clock < renderClock - 1) return changeAtClock();         // Does not matter
        var ip = clock & 0x03;
        if (ip < 3) changeAtClockPlus(4 - ip);      // Perceive change only at the next PF pixel
        else changeAtClockPlus(5);                  // Perceive change only 2 PF pixels later
    }

    function changeVBlankAtClockPlus1() {
        changeAt(clock + 1);
    }

    function updateToClock() {
        changeAt(clock);
    }

    var finishLine = function() {
        // Render remaining part of current line
        renderLineTo(LINE_WIDTH);
        renderClock = LINE_WIDTH;

        // Handle Paddles capacitor charging, only if paddles are connected (position >= 0)
        if (paddle0Position >= 0 && !paddleCapacitorsGrounded) {
            if (INPT0 < 0x80 && ++paddle0CapacitorCharge >= paddle0Position) INPT0 |= 0x80;
            if (INPT1 < 0x80 && ++paddle1CapacitorCharge >= paddle1Position) INPT1 |= 0x80;
        }

        // Inject debugging information in the line if needed
        if (debugLevel >= 1) processDebugPixelsInLine();
    };

    var playfieldSetShape = function(i) {
        if (CTRLPF === i) return;

        var v = i & 0x07;
        if (v !== (CTRLPF & 0x07)) {
            if (playfieldEnabled) changeAtClock();

            v = (i & 0x01) !== 0;
            if (playfieldReflected !== v) {
                playfieldReflected = v;
                playfieldUpdateSpriteR();
            }

            v = (i & 0x02) !== 0;
            if (playfieldScoreMode !== v) {
                playfieldScoreMode = v;
                if (!debug) {
                    if (v) { playfieldLeftColor = player0Color; playfieldRightColor = player1Color }
                    else playfieldColor = playfieldLeftColor = playfieldRightColor = ballColor;
                }
            }

            playfieldPriority = (i & 0x04) !== 0;
        }

        v = i & 0x30;
        if (v !== (CTRLPF & 0x30)) {
            changeAtClock();
            ball.width = OBJECT_WIDTHS[v >> 4];
        }

        CTRLPF = i;
    };

    function playfieldUpdateSprite() {
        playfieldPatternL = (PF2 << 12) | (jt.Util.reverseInt8(PF1) << 4) | ((PF0 & 0xf0) >> 4);
        playfieldUpdateSpriteR();
    }

    function playfieldUpdateSpriteR() {
        playfieldPatternR = playfieldReflected ? (jt.Util.reverseInt8(PF0) << 16) | (PF1 << 8) | jt.Util.reverseInt8(PF2) : playfieldPatternL;
        if (playfieldPatternL !== 0 || playfieldPatternR !== 0) {
            playfieldEnabled = true;
        } else {
            playfieldEnabled = false;
        }
    }

    function ballSetEnabled(boo) {
        ballEnabled = !!boo;
    }

    // Counter value of an object for the next pixel clock it will receive
    function objectCounterAtRenderClock(objectPixel) {
        var x = renderClock - HBLANK_DURATION;
        if (hMoveHitBlank && x < 8) x = 8;
        return (x - objectPixel + 317) % 160;
    }

    function isInHBLANK() {
        return clock < HBLANK_DURATION + (hMoveHitBlank ? 8 : 0);
    }

    // Counter value set by RESPx, RESMx and RESBL
    function resxCounter(r) {
        return r >= 0 ? 157 : (clock >= 73 ? 158 : 159);
    }

    function player0SetShape(i) {
        if (NUSIZ0 === i) return;
        changeAtClock();
        NUSIZ0 = i;
        player0.nusiz(i, isInHBLANK(), objectCounterAtRenderClock(player0Pixel));
        missile0.nusiz(i);
    }

    function player0SetSprite(i) {
        if (debug) debugPixel(DEBUG_P0_GR_COLOR);
        if (GRP0d !== i) {
            GRP0d = i;
            if (!VDELP0) player0UpdateSprite(1);
        }
        if (GRP1 !== GRP1d) {
            GRP1 = GRP1d;
            if (VDELP1) player1UpdateSprite(1);
        }
    }

    function player0UpdateSprite(clockPlus) {
        var sprite = VDELP0 ? GRP0 : GRP0d;
        var pattern = REFP0 ? sprite : jt.Util.reverseInt8(sprite);
        if (player0.pattern !== pattern) {
            changeAtClockPlus(clockPlus);
            player0.pattern = pattern;
        }
        player0Enabled = sprite !== 0;
    }

    function player1SetShape(i) {
        if (NUSIZ1 === i) return;
        changeAtClock();
        NUSIZ1 = i;
        player1.nusiz(i, isInHBLANK(), objectCounterAtRenderClock(player1Pixel));
        missile1.nusiz(i);
    }

    function player1SetSprite(i) {
        if (debug) debugPixel(DEBUG_P1_GR_COLOR);
        if (GRP1d !== i) {
            GRP1d = i;
            if (!VDELP1) player1UpdateSprite(1);
        }
        if (GRP0 !== GRP0d) {
            GRP0 = GRP0d;
            if (VDELP0) player0UpdateSprite(1);
        }
        if (ENABL !== ENABLd) {
            ENABL = ENABLd;
            if (VDELBL) changeAtClockPlus(1);
            ballSetEnabled(ENABL);
        }
    }

    function player1UpdateSprite(clockPlus) {
        var sprite = VDELP1 ? GRP1 : GRP1d;
        var pattern = REFP1 ? sprite : jt.Util.reverseInt8(sprite);
        if (player1.pattern !== pattern) {
            changeAtClockPlus(clockPlus);
            player1.pattern = pattern;
        }
        player1Enabled = sprite !== 0;
    }

    function missile0SetEnabled(boo) {
        missile0Enabled = !!boo;
    }

    function missile0SetResetToPlayer(i) {
        if (RESMP0 === (i & 0x02)) return;

        changeAtClock();
        RESMP0 = i & 0x02;
        missile0.resmp = RESMP0 !== 0;
        missile0SetEnabled(ENAM0 && !RESMP0);

        if (!RESMP0) {
            missile0Pixel = player0Pixel + missileCenterOffsetsPerPlayerSize[NUSIZ0 & 0x07]; if (missile0Pixel >= 160) missile0Pixel -= 160;
        }
    }

    function missile1SetEnabled(boo) {
        missile1Enabled = !!boo;
    }

    function missile1SetResetToPlayer(i) {
        if (RESMP1 === (i & 0x02)) return;

        changeAtClock();
        RESMP1 = i & 0x02;
        missile1.resmp = RESMP1 !== 0;
        missile1SetEnabled(ENAM1 && !RESMP1);

        if (!RESMP1) {
            missile1Pixel = player1Pixel + missileCenterOffsetsPerPlayerSize[NUSIZ1 & 0x07]; if (missile1Pixel >= 160) missile1Pixel -= 160;
        }
    }

    var hitRESP0 = function() {
        if (debug) debugPixel(DEBUG_P0_RES_COLOR);

        var r = getRESxPixel();
        changeAtClock();
        player0Pixel = r >= 0 ? r : -r;
        player0.resp(resxCounter(r));
    };

    var hitRESP1 = function() {
        if (debug) debugPixel(DEBUG_P1_RES_COLOR);

        var r = getRESxPixel();
        changeAtClock();
        player1Pixel = r >= 0 ? r : -r;
        player1.resp(resxCounter(r));
    };

    var hitRESM0 = function() {
        if (debug) debugPixel(DEBUG_M0_COLOR);

        var r = getRESxPixel();
        changeAtClock();
        missile0Pixel = r >= 0 ? r : -r;
        missile0.resm(resxCounter(r), isInHBLANK());
    };

    var hitRESM1 = function() {
        if (debug) debugPixel(DEBUG_M1_COLOR);

        var r = getRESxPixel();
        changeAtClock();
        missile1Pixel = r >= 0 ? r : -r;
        missile1.resm(resxCounter(r), isInHBLANK());
    };

    var hitRESBL = function() {
        if (debug) debugPixel(DEBUG_BL_COLOR);

        var r = getRESxPixel();
        changeAtClock();
        ballPixel = r >= 0 ? r : -r;
        ball.resbl(resxCounter(r));
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
            // debugInfo("Unsupported HMOVE hit");
            return;
        }
        // Late HMOVE: Clocks [219-224] hide HMOVE blank next line, clocks [225, 0] produce normal behavior next line
        // debugInfo("Late HMOVE hit");
        hMoveHitClock = 160 - clock;
        hMoveLateHit = true;
        hMoveLateHitBlank = clock >= 225;
    };

    // Can only be called during HBLANK!
    var performHMOVE = function() {
        // Each object receives HMx + 8 extra clocks. They are perceived as a position change of HMx when the extended HBLANK
        // takes away 8 normal clocks, or HMx + 8 otherwise (late HMOVE)
        var plus = hMoveHitBlank ? 0 : 8;
        player0Pixel = moveObject(player0, player0Pixel, HMP0, plus);
        player1Pixel = moveObject(player1, player1Pixel, HMP1, plus);
        missile0Pixel = moveObject(missile0, missile0Pixel, HMM0, plus);
        missile1Pixel = moveObject(missile1, missile1Pixel, HMM1, plus);
        ballPixel = moveObject(ball, ballPixel, HMBL, plus);
    };

    function moveObject(object, objectPixel, hm, plus) {
        var counter = (0 - objectPixel + 317) % 160;
        for (var c = hm + 8; c > 0; --c) {
            object.tick(counter);
            if (++counter >= 160) counter = 0;
        }
        var pixel = objectPixel - (hm + plus);
        if (pixel >= 160) pixel -= 160; else if (pixel < 0) pixel += 160;
        return pixel;
    }

    // Negative values mean hit during HBLANK. Invert negative values to get object position, then Alt must be defined considering starting from pixel 0
    function getRESxPixel() {
        // Hit after complete HBLANK or last pixel of Extended HBLANK
        if (clock >= HBLANK_DURATION + (hMoveHitBlank ? 8 - 1 : 0)) {
            return clock - HBLANK_DURATION;
        } else {
            // Hit during HBLANK
            if (hMoveHitBlank) {
                if (clock >= HBLANK_DURATION) {
                    return -6;
                } else {
                    var d = (clock - hMoveHitClock - 4) >> 2;   // Shift right proportionally to distance from HMOVE, up to 8 pixels
                    if (d > 8) return -6;
                    else if (d > 1) return -(d - 2);
                    else return -(158 + d);
                }
            } else
                return -158;
        }
    }

    function checkLateHMOVE() {
        if (hMoveLateHit) {
            hMoveLateHit = false;
            hMoveHitBlank = hMoveLateHitBlank;
            performHMOVE();
        } else
            hMoveHitBlank = false;
    }


    function vSyncSet(i) {
        if (debug) {
            debugPixel(VSYNC_COLOR);
            changeAtClock();
            vSyncOn = (i & 0x02) !== 0;
            vBlankColor = vSyncOn ? VSYNC_COLOR : DEBUG_VBLANK_COLOR;
        } else
            vSyncOn = (i & 0x02) !== 0;
    }

    var vBlankSet = function(blank) {
        var v = (blank & 0x02) !== 0;
        if (vBlankOn !== v) {
            changeVBlankAtClockPlus1();
            //changeAtClockPlus(1);
            vBlankOn = v;
        }

        if ((blank & 0x40) !== 0) {
            controlsButtonsLatched = true;			// Enable Joystick Button latches
        } else {
            controlsButtonsLatched = false;			// Disable latches and update registers with the current button state
            if (controlsJOY0ButtonPressed) INPT4 &= 0x7f; else INPT4 |= 0x80;
            if (controlsJOY1ButtonPressed) INPT5 &= 0x7f; else INPT5 |= 0x80;
        }

        if ((blank & 0x80) !== 0) {					// Ground paddle capacitors
            paddleCapacitorsGrounded = true;
            paddle0CapacitorCharge = paddle1CapacitorCharge = 0;
            INPT0 &= 0x7f; INPT1 &= 0x7f; INPT2 &= 0x7f; INPT3 &= 0x7f;
        }
        else
            paddleCapacitorsGrounded = false;
    };

    var initLatchesAtPowerOn = function() {
        collisions = 0;
        INPT0 = INPT1 = INPT2 = INPT3 = 0;
        INPT4 = INPT5 = 0x80;
    };

    var debugPixel = function(color) {
        debugPixels[clock] = color;
    };

    var processDebugPixelsInLine = function() {
        jt.Util.arrayFillSegment(linePixels, 0, HBLANK_DURATION + (hMoveHitBlank ? 8 : 0), hBlankColor);
        // Marks
        if (debugLevel >= 3 && videoSignal.monitor.currentLine() % 10 == 0) {
            for (var i = 0; i < LINE_WIDTH; i++) {
                if (debugPixels[i]) continue;
                if (i < HBLANK_DURATION) {
                    if (i % 6 == 0 || i == 66 || i == 63)
                        debugPixels[i] = DEBUG_MARKS_COLOR;
                } else {
                    if ((i - HBLANK_DURATION - 1) % 6 == 0)
                        debugPixels[i] = DEBUG_MARKS_COLOR;
                }
            }
        }
        // Debug Pixels
        if (debugLevel >= 2) {
            for (i = 0; i < LINE_WIDTH; i++) {
                if (debugPixels[i]) {
                    linePixels[i] = debugPixels[i];
                    debugPixels[i] = 0;
                }
            }
        }
    };

    var debugSetColors = function() {
        player0Color = DEBUG_P0_COLOR;
        player1Color = DEBUG_P1_COLOR;
        missile0Color = DEBUG_M0_COLOR;
        missile1Color = DEBUG_M1_COLOR;
        ballColor = DEBUG_BL_COLOR;
        playfieldColor = playfieldLeftColor = playfieldRightColor = DEBUG_PF_COLOR;
        playfieldBackground = DEBUG_BK_COLOR;
        hBlankColor = debugLevel >= 1 ? DEBUG_HBLANK_COLOR : HBLANK_COLOR;
        vBlankColor = debugLevel >= 1 ? DEBUG_VBLANK_COLOR : VBLANK_COLOR;
    };

    var debugRestoreColors = function() {
        hBlankColor = HBLANK_COLOR;
        vBlankColor = VBLANK_COLOR;
        playfieldBackground = palette[0];
        jt.Util.arrayFill(linePixels, hBlankColor);
        changeAtClock();
    };

    var info = function(str) {
        console.error("Line: " + videoSignal.monitor.currentLine() +", Pixel: " + clock + ". " + str);
    };

    var debugInfo = function(str) {
        if (debug) console.error("Line: " + videoSignal.monitor.currentLine() +", Pixel: " + clock + ". " + str);
    };



    // Controls interface  -----------------------------------

    var controls = jt.ConsoleControls;

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
                self.debug(debugLevel + 1);
                self.showDebugMessage();
                return;
            case controls.SHOW_INFO:
                videoSignal.toggleShowInfo(); return;
            case controls.NO_COLLISIONS:
                self.debugNoCollisions(!debugNoCollisions);
                videoSignal.showOSD(debugNoCollisions ? "No Collisions: ON" : "No Collisions: OFF", true);
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


    // Savestate  ------------------------------------------------

    this.saveState = function(extended) {
        var s = {
            lpx: jt.Util.storeInt32BitArrayToStringBase64(linePixels),

            vs: vSyncOn,
            vb: vBlankOn,

            pfe: playfieldEnabled,
            pfl: playfieldPatternL,
            pfr: playfieldPatternR,
            pfc: playfieldColor,
            pflc: playfieldLeftColor,
            pfrc: playfieldRightColor,
            pfb: playfieldBackground,
            pfrl: playfieldReflected,
            pfsc: playfieldScoreMode,
            pfp: playfieldPriority,

            be: ballEnabled,
            bx: ballPixel,
            bos: ball.saveState(),
            bc: ballColor,

            p0e: player0Enabled,
            p0x: player0Pixel,
            p0os: player0.saveState(),
            p0c: player0Color,

            p1e: player1Enabled,
            p1x: player1Pixel,
            p1os: player1.saveState(),
            p1c: player1Color,

            m0e: missile0Enabled,
            m0x: missile0Pixel,
            m0os: missile0.saveState(),
            m0c: missile0Color,

            m1e: missile1Enabled,
            m1x: missile1Pixel,
            m1os: missile1.saveState(),
            m1c: missile1Color,

            hmh: hMoveHitBlank,
            hmc: hMoveHitClock,
            hmlh: hMoveLateHit,
            hmlb: hMoveLateHitBlank,

            co: collisions,
            cod: debugNoCollisions,

            cbl: controlsButtonsLatched,
            j0p: controlsJOY0ButtonPressed,
            j1p: controlsJOY1ButtonPressed,

            pcg: paddleCapacitorsGrounded,
            pd0: paddle0Position,
            pd0c: paddle0CapacitorCharge,
            pd1: paddle1Position,
            pd1c: paddle1CapacitorCharge,

            CTRLPF: CTRLPF,
            COLUPF: COLUPF,
            COLUBK: COLUBK,
            PF0: PF0,
            PF1: PF1,
            PF2: PF2,
            ENABL: ENABL,
            ENABLd: ENABLd,
            VDELBL: VDELBL,
            NUSIZ0: NUSIZ0,
            COLUP0: COLUP0,
            REFP0: REFP0,
            GRP0: GRP0,
            GRP0d: GRP0d,
            VDELP0: VDELP0,
            NUSIZ1: NUSIZ1,
            COLUP1: COLUP1,
            REFP1: REFP1,
            GRP1: GRP1,
            GRP1d: GRP1d,
            VDELP1: VDELP1,
            ENAM0: ENAM0,
            RESMP0: RESMP0,
            ENAM1: ENAM1,
            RESMP1: RESMP1,
            HMP0: HMP0,
            HMP1: HMP1,
            HMM0: HMM0,
            HMM1: HMM1,
            HMBL: HMBL,
            AUDC0: AUDC0,
            AUDC1: AUDC1,
            AUDF0: AUDF0,
            AUDF1: AUDF1,
            AUDV0: AUDV0,
            AUDV1: AUDV1
        };
        if (extended) s.dl = debugLevel;
        return s;
    };

    this.loadState = function(s) {
        jt.Util.restoreStringBase64ToInt32BitArray(s.lpx, linePixels);

        vSyncOn = s.vs;
        vBlankOn = s.vb;

        playfieldEnabled = s.pfe;
        playfieldPatternL = s.pfl | 0;
        playfieldPatternR = s.pfr | 0;
        playfieldColor = s.pfc | 0;
        playfieldLeftColor = s.pflc | 0;
        playfieldRightColor = s.pfrc | 0;
        playfieldBackground = s.pfb | 0;
        playfieldReflected = s.pfrl;
        playfieldScoreMode = s.pfsc;
        playfieldPriority = s.pfp;

        ballEnabled = s.be;
        ballPixel = s.bx | 0;
        ballColor = s.bc | 0;

        player0Enabled = s.p0e;
        player0Pixel = s.p0x | 0;
        player0Color = s.p0c | 0;

        player1Enabled = s.p1e;
        player1Pixel = s.p1x | 0;
        player1Color = s.p1c | 0;

        missile0Enabled = s.m0e;
        missile0Pixel = s.m0x | 0;
        missile0Color = s.m0c | 0;

        missile1Enabled = s.m1e;
        missile1Pixel = s.m1x | 0;
        missile1Color = s.m1c | 0;

        hMoveHitBlank = s.hmh;
        hMoveHitClock = s.hmc | 0;
        hMoveLateHit = s.hmlh;
        hMoveLateHitBlank = s.hmlb;

        collisions = s.co | 0;
        if (s.cod !== undefined) debugNoCollisions = s.cod;

        if (s.cbl !== undefined) {                          // backward compatibility
            controlsButtonsLatched = s.cbl;
            controlsJOY0ButtonPressed = s.j0p;
            controlsJOY1ButtonPressed = s.j1p;

            paddleCapacitorsGrounded = s.pcg;
            paddle0Position = s.pd0;
            paddle0CapacitorCharge = s.pd0c;
            paddle1Position = s.pd1;
            paddle1CapacitorCharge = s.pd1c;
        }

        CTRLPF = s.CTRLPF | 0;
        COLUPF = s.COLUPF | 0;
        COLUBK = s.COLUBK | 0;
        PF0 = s.PF0 | 0;
        PF1 = s.PF1 | 0;
        PF2 = s.PF2 | 0;
        ENABL = s.ENABL | 0;
        ENABLd = s.ENABLd | 0;
        VDELBL = s.VDELBL | 0;
        NUSIZ0 = s.NUSIZ0 | 0;
        COLUP0 = s.COLUP0 | 0;
        REFP0 = s.REFP0 | 0;
        GRP0 = s.GRP0 | 0;
        GRP0d = s.GRP0d | 0;
        VDELP0 = s.VDELP0 | 0;
        NUSIZ1 = s.NUSIZ1 | 0;
        COLUP1 = s.COLUP1 | 0;
        REFP1 = s.REFP1 | 0;
        GRP1 = s.GRP1 | 0;
        GRP1d = s.GRP1d | 0;
        VDELP1 = s.VDELP1 | 0;
        ENAM0 = s.ENAM0 | 0;
        RESMP0 = s.RESMP0 | 0;
        ENAM1 = s.ENAM1 | 0;
        RESMP1 = s.RESMP1 | 0;
        HMP0 = s.HMP0 | 0;
        HMP1 = s.HMP1 | 0;
        HMM0 = s.HMM0 | 0;
        HMM1 = s.HMM1 | 0;
        HMBL = s.HMBL | 0;
        AUDC0 = s.AUDC0 | 0; audioSignal.getChannel0().setControl(AUDC0 & 0x0f);		// Also update the Audio Generator
        AUDC1 = s.AUDC1 | 0; audioSignal.getChannel1().setControl(AUDC1 & 0x0f);
        AUDF0 = s.AUDF0 | 0; audioSignal.getChannel0().setDivider((AUDF0 & 0x1f) + 1);
        AUDF1 = s.AUDF1 | 0; audioSignal.getChannel1().setDivider((AUDF1 & 0x1f) + 1);
        AUDV0 = s.AUDV0 | 0; audioSignal.getChannel0().setVolume(AUDV0 & 0x0f);
        AUDV1 = s.AUDV1 | 0; audioSignal.getChannel1().setVolume(AUDV1 & 0x0f);

        // Objects draw state
        player0.loadState(s.p0os, NUSIZ0);
        player1.loadState(s.p1os, NUSIZ1);
        player0.pattern = REFP0 ? (VDELP0 ? GRP0 : GRP0d) : jt.Util.reverseInt8(VDELP0 ? GRP0 : GRP0d);
        player1.pattern = REFP1 ? (VDELP1 ? GRP1 : GRP1d) : jt.Util.reverseInt8(VDELP1 ? GRP1 : GRP1d);
        missile0.loadState(s.m0os, NUSIZ0, RESMP0);
        missile1.loadState(s.m1os, NUSIZ1, RESMP1);
        ball.loadState(s.bos, CTRLPF);

        if (s.dl !== undefined) this.debug(s.dl);
        else if (debug) debugSetColors();
    };


    // Constants  ------------------------------------------------

    var HBLANK_DURATION = 68;
    var LINE_WIDTH = 228;

    var VBLANK_COLOR = 0xff000000;		// CHECK: Full transparency needed for CRT emulation modes
    var HBLANK_COLOR = 0xfe000000;      // Alpha of 0xfe used to detect extended HBLANK (alpha is unnoticeable)
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
    var DEBUG_ALT_COLOR    = 0xffaaaa00;

    var READ_ADDRESS_MASK  = 0x000f;
    var WRITE_ADDRESS_MASK = 0x003f;

    // Collision bit patterns:   P0P1, P0M0, P0M1, P0PF,   P0BL, P1M0, P1M1, P1PF,   P1BL, M0M1, M0PF, M0BL,   M1PF, M1BL, PFBL, none

    var P0C = ~0xf800;   //  1111 1000 0000 0000
    var P1C = ~0x8780;   //  1000 0111 1000 0000
    var M0C = ~0x4470;   //  0100 0100 0111 0000
    var M1C = ~0x224c;   //  0010 0010 0100 1100
    var PFC = ~0x112a;   //  0001 0001 0010 1010
    var BLC = ~0x0896;   //  0000 1000 1001 0110


    // Variables  ---------------------------------------------------

    var cpu = pCpu;
    var pia = pPia;
    var bus;

    var powerOn = false;

    var clock, renderClock;
    var linePixels = new Uint32Array(LINE_WIDTH);

    var vSyncOn = false;
    var vBlankOn = false;
    var vBlankColor = VBLANK_COLOR;
    var hBlankColor = HBLANK_COLOR;

    var playfieldEnabled = false, playfieldPatternL = 0, playfieldPatternR = 0;
    var playfieldColor = 0xff000000, playfieldLeftColor = 0xff000000, playfieldRightColor = 0xff000000;
    var playfieldBackground = 0xff000000;
    var playfieldReflected = false;
    var playfieldScoreMode = false;
    var playfieldPriority = false;

    var ballEnabled = false, ballPixel = 0;
    var ballColor = 0xff000000;

    var player0Enabled = false, player0Pixel = 0;
    var player0Color = 0xff000000;

    var player1Enabled = false, player1Pixel = 0;
    var player1Color = 0xff000000;

    var missile0Enabled = false, missile0Pixel = 0;
    var missile0Color = 0xff000000;

    var missile1Enabled = false, missile1Pixel = 0;
    var missile1Color = 0xff000000;

    var hMoveHitBlank = false;
    var hMoveHitClock = 0;
    var hMoveLateHit = false;
    var hMoveLateHitBlank = false;

    var collisions = 0;

    var controlsButtonsLatched = false;
    var controlsJOY0ButtonPressed = false;
    var controlsJOY1ButtonPressed = false;

    var paddleCapacitorsGrounded = false;
    var paddle0Position = -1;			                                    // 380 = Left, 190 = Middle, 0 = Right. -1 = disconnected, won't charge POTs
    var paddle0CapacitorCharge = 0;
    var paddle1Position = -1;
    var paddle1CapacitorCharge = 0;


    var debug = false;
    var debugLevel = 0;
    var debugNoCollisions = false;
    var debugPixels = new Uint32Array(LINE_WIDTH);


    // Objects draw state  ------------------------------------------

    // Counter values that start a copy, per NUSIZ number setting. Values are the copy number (1 = main copy)
    var OBJECT_DECODES = (function() {
        var d0 = new Uint8Array(160), d1 = new Uint8Array(160), d2 = new Uint8Array(160), d3 = new Uint8Array(160), d4 = new Uint8Array(160), d6 = new Uint8Array(160);
        d0[156] = d1[156] = d2[156] = d3[156] = d4[156] = d6[156] = 1;
        d1[12] = 2;                     // 2 copies close
        d2[28] = 2;                     // 2 copies medium
        d3[12] = 2; d3[28] = 3;         // 3 copies close
        d4[60] = 2;                     // 2 copies wide
        d6[28] = 2; d6[60] = 3;         // 3 copies medium
        return [d0, d1, d2, d3, d4, d0, d6, d0];
    })();

    var OBJECT_WIDTHS = [1, 2, 4, 8];

    function PlayerObject() {
        this.rendering = false;
        this.renderCounter = 0;
        this.sampleCounter = 0;
        this.divider = 1;
        this.dividerPending = 1;
        this.dividerChangeCounter = -1;
        this.tripPoint = 0;
        this.shape = 0;
        this.decodes = OBJECT_DECODES[0];
        this.pattern = 0;           // already mirrored as needed, bit 0 is the first pixel drawn
    }

    PlayerObject.prototype.setDivider = function(divider) {
        this.divider = divider;
        this.tripPoint = divider === 1 ? 0 : 1;
    };

    // Returns the signal for the current pixel, then advances one clock
    PlayerObject.prototype.tick = function(counter) {
        var signal = this.rendering && this.renderCounter >= this.tripPoint && ((this.pattern >> this.sampleCounter) & 1);

        if (this.decodes[counter]) {
            this.rendering = true;
            this.sampleCounter = 0;
            this.renderCounter = -5;
        } else if (this.rendering) {
            ++this.renderCounter;
            if (this.divider === 1) {
                if (this.renderCounter > 0) ++this.sampleCounter;
                if (this.renderCounter >= 0 && this.dividerChangeCounter >= 0 && this.dividerChangeCounter-- === 0) this.setDivider(this.dividerPending);
            } else {
                if (this.renderCounter > 1 && ((this.renderCounter - 1) & (this.divider - 1)) === 0) ++this.sampleCounter;
                if (this.renderCounter > 0 && this.dividerChangeCounter >= 0 && this.dividerChangeCounter-- === 0) this.setDivider(this.dividerPending);
            }
            if (this.sampleCounter > 7) this.rendering = false;
        }

        return signal;
    };

    // NUSIZ write. counter is the value for the next clock
    PlayerObject.prototype.nusiz = function(value, hblank, counter) {
        var shape = value & 0x07;
        this.shape = shape;
        this.dividerPending = shape === 5 ? 2 : shape === 7 ? 4 : 1;

        var oldDecodes = this.decodes;
        this.decodes = OBJECT_DECODES[shape];

        // Changing NUSIZ can trigger a decode in the same cycle
        if (!this.rendering && this.decodes[(counter + 159) % 160]) {
            this.rendering = true;
            this.sampleCounter = 0;
            this.renderCounter = -5;
        }

        // A copy that is about to start is cancelled if its decode is not present in the new setting
        if (this.decodes !== oldDecodes && this.rendering && (this.renderCounter + 5) < 2 &&
            !this.decodes[(((counter - this.renderCounter - 5 + 159) % 160) + 160) % 160]) {
            this.rendering = false;
        }

        if (this.dividerPending === this.divider) return;

        // Effects of a size change during decode and draw
        if (this.rendering) {
            var delta = this.renderCounter + 5;
            switch ((this.divider << 4) | this.dividerPending) {
                case 0x12:
                case 0x14:
                    if (hblank) {
                        if (delta < 4) this.setDivider(this.dividerPending);
                        else this.dividerChangeCounter = (delta < 5 ? 1 : 0);
                    } else {
                        if (delta < 3) this.setDivider(this.dividerPending);
                        else this.dividerChangeCounter = 1;
                    }
                    break;
                case 0x21:
                case 0x41:
                    if (delta < (hblank ? 4 : 3)) {
                        this.setDivider(this.dividerPending);
                    } else if (delta < (hblank ? 6 : 5)) {
                        this.setDivider(this.dividerPending);
                        --this.renderCounter;
                    } else {
                        this.dividerChangeCounter = (hblank ? 0 : 1);
                    }
                    break;
                case 0x42:
                case 0x24:
                    if (this.renderCounter < 1 || (hblank && (this.renderCounter % this.divider === 1)))
                        this.setDivider(this.dividerPending);
                    else
                        this.dividerChangeCounter = (this.divider - (this.renderCounter - 1) % this.divider);
                    break;
                default:
                    this.setDivider(this.dividerPending);
            }
        } else
            this.setDivider(this.dividerPending);
    };

    // RESPx during the start of a copy
    PlayerObject.prototype.resp = function(counter) {
        if (this.rendering && (this.renderCounter + 5) < 4)
            this.renderCounter = -5 + (counter - 157);
    };

    PlayerObject.prototype.saveState = function() {
        return [this.rendering ? 1 : 0, this.renderCounter, this.sampleCounter, this.divider, this.dividerPending, this.dividerChangeCounter, this.shape];
    };

    PlayerObject.prototype.loadState = function(s, nusiz) {
        this.shape = nusiz & 0x07;
        this.decodes = OBJECT_DECODES[this.shape];
        this.dividerPending = this.shape === 5 ? 2 : this.shape === 7 ? 4 : 1;
        this.setDivider(this.dividerPending);
        this.rendering = false; this.renderCounter = 0; this.sampleCounter = 0; this.dividerChangeCounter = -1;
        if (s) {
            this.rendering = !!s[0]; this.renderCounter = s[1] | 0; this.sampleCounter = s[2] | 0;
            this.setDivider(s[3] | 0 || 1); this.dividerPending = s[4] | 0 || 1; this.dividerChangeCounter = s[5] | 0;
        }
    };

    function MissileObject() {
        this.rendering = false;
        this.renderCounter = 0;
        this.width = 1;
        this.decodes = OBJECT_DECODES[0];
        this.resmp = false;
    }

    MissileObject.prototype.tick = function(counter) {
        var signal = this.rendering && this.renderCounter >= 0;

        if (this.decodes[counter] && !this.resmp) {
            this.rendering = true;
            this.renderCounter = -4;
        } else if (this.rendering && ++this.renderCounter >= this.width)
            this.rendering = false;

        return signal;
    };

    MissileObject.prototype.nusiz = function(value) {
        this.width = OBJECT_WIDTHS[(value & 0x30) >> 4];
        this.decodes = OBJECT_DECODES[value & 0x07];
        if (this.rendering && this.renderCounter >= this.width) this.rendering = false;
    };

    // RESMx during a copy in progress
    MissileObject.prototype.resm = function(counter, hblank) {
        if (!this.rendering) return;
        if (this.renderCounter < 0) {
            this.renderCounter = -4 + (counter - 157);
        } else {
            switch (this.width) {
                case 8:
                    this.renderCounter = (counter - 157) + ((this.renderCounter >= 4) ? 4 : 0);
                    break;
                case 4:
                    this.renderCounter = (counter - 157);
                    break;
                case 2:
                    if (hblank) this.rendering = this.renderCounter > 1;
                    else if (this.renderCounter === 0) ++this.renderCounter;
                    break;
                default:
                    if (hblank) this.rendering = this.renderCounter > 0;
            }
        }
    };

    MissileObject.prototype.saveState = function() {
        return [this.rendering ? 1 : 0, this.renderCounter];
    };

    MissileObject.prototype.loadState = function(s, nusiz, resmp) {
        this.nusiz(nusiz);
        this.resmp = !!resmp;
        this.rendering = s ? !!s[0] : false;
        this.renderCounter = s ? s[1] | 0 : 0;
    };

    function BallObject() {
        this.rendering = false;
        this.renderCounter = 0;
        this.width = 1;
    }

    BallObject.prototype.tick = function(counter) {
        var signal = this.rendering && this.renderCounter >= 0;

        if (counter === 156) {
            this.rendering = true;
            this.renderCounter = -4;
        } else if (this.rendering && ++this.renderCounter >= this.width)
            this.rendering = false;

        return signal;
    };

    // RESBL starts drawing right away
    BallObject.prototype.resbl = function(counter) {
        this.rendering = true;
        this.renderCounter = -4 + (counter - 157);
    };

    BallObject.prototype.saveState = function() {
        return [this.rendering ? 1 : 0, this.renderCounter];
    };

    BallObject.prototype.loadState = function(s, ctrlpf) {
        this.width = OBJECT_WIDTHS[(ctrlpf & 0x30) >> 4];
        this.rendering = s ? !!s[0] : false;
        this.renderCounter = s ? s[1] | 0 : 0;
    };

    var player0 = new PlayerObject(), player1 = new PlayerObject();
    var missile0 = new MissileObject(), missile1 = new MissileObject();
    var ball = new BallObject();

    var missileCenterOffsetsPerPlayerSize = new Uint8Array([ 5, 5, 5, 5, 5, 10, 5, 18 ]);

    var videoSignal = new jt.VideoSignal();
    var palette;

    var audioSignal = new jt.TiaAudio(audioSocket);


    // Read registers -------------------------------------------

    var INPT0 =  0;     // Paddle0 Left pot port
    var INPT1 =  0;     // Paddle0 Right pot port
    var INPT2 =  0;     // Paddle1 Left pot port
    var INPT3 =  0;     // Paddle1 Right pot port
    var INPT4 =  0;     // input (Joy0 button)
    var INPT5 =  0;     // input (Joy1 button)


    // Write registers  ------------------------------------------

    var CTRLPF = 0;     // ..11.111  control playfield ball size & collisions
    var COLUPF = 0;     // 11111111  playfield and ball color
    var COLUBK = 0;     // 11111111  playfield background color
    var PF0 = 0;		// 1111....  playfield register byte 0
    var PF1 = 0;		// 11111111  playfield register byte 1
    var PF2 = 0;		// 11111111  playfield register byte 2
    var ENABL = 0;      // ......1.  graphics (enable) ball
    var ENABLd = 0;     // ......1.  graphics (enable) ball
    var VDELBL = 0;     // .......1  vertical delay ball

    var NUSIZ0 = 0;     // ..111111  number-size player-missile 0
    var COLUP0 = 0;     // 11111111  color-lum player 0 and missile 0
    var REFP0 = 0;      // ....1...  reflect player 0 (>> 3)
    var GRP0 = 0;       // 11111111  graphics player 0
    var GRP0d = 0;      // 11111111  graphics player 0 (delayed)
    var VDELP0 = 0;     // .......1  vertical delay player 0

    var NUSIZ1 = 0;     // ..111111  number-size player-missile 1
    var COLUP1 = 0;     // 11111111  color-lum player 1 and missile 1
    var REFP1 = 0;      // ....1...  reflect player 1 (>> 3)
    var GRP1 = 0;       // 11111111  graphics player 1
    var GRP1d = 0;      // 11111111  graphics player 1 (delayed)
    var VDELP1 = 0;     // .......1  vertical delay player 1

    var ENAM0 = 0;      // ......1.  graphics (enable) missile 0
    var RESMP0 = 0;     // ......1.  reset missile 0 to player 0

    var ENAM1 = 0;      // ......1.  graphics (enable) missile 1
    var RESMP1 = 0;     // ......1.  reset missile 1 to player 1

    var HMP0 = 0;		// 1111....  horizontal motion player 0
    var HMP1 = 0;		// 1111....  horizontal motion player 1
    var HMM0 = 0;		// 1111....  horizontal motion missile 0
    var HMM1 = 0;		// 1111....  horizontal motion missile 1
    var HMBL = 0;		// 1111....  horizontal motion ball

    var AUDC0 = 0;		// ....1111  audio control 0
    var AUDC1 = 0;		// ....1111  audio control 1
    var AUDF0 = 0;		// ...11111  audio frequency 0
    var AUDF1 = 0;		// ...11111  audio frequency 1
    var AUDV0 = 0;		// ....1111  audio volume 0
    var AUDV1 = 0;		// ....1111  audio volume 1

    init();

    self.eval = function(code) {
        return eval(code);
    }

};
