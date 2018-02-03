// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// TODO NUSIZ during scan with HMOVE not correct. For now kill the scan in progress
// TODO Starfield Effect not implemented
// TODO AUTO Video Standard Detection too aggressive?
// TODO Vsynch lines count affects vertical position!

jt.Tia = function(pCpu, pPia, audioSocket) {
    "use strict";

    var self = this;

    function init() {
        generateObjectsLineSprites();
        generateObjectsCopiesOffsets();
    }

    this.powerOn = function() {
        jt.Util.arrayFill(linePixels, VBLANK_COLOR);
        jt.Util.arrayFill(debugPixels, 0);
        audioSignal.getChannel0().setVolume(0);
        audioSignal.getChannel1().setVolume(0);
        initLatchesAtPowerOn();
        hMoveLateHit = false;
        changeClock = changeClockPrevLine = -1;
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
            changeClock = -1;
            renderClock = HBLANK_DURATION;

            if (debug) {
                if (debugLevel >= 4) jt.Util.arrayFill(linePixels, 0xff000000);     // clear line
                else if (debugLevel >= 2 && debugLevel < 4) changeClock = 0;        // force entire line render
            }

            checkLateHMOVE();
            // Send the first clock/3 pulse to the CPU and PIA, perceived by TIA at clock 0 before releasing halt, then release halt
            bus.clockPulse();
            cpu.setRDY(true);
            for (var x = 0; x < 22; ++x) { clock += 3; bus.clockPulse(); }      // TIA 3..66     CPU 1..22
            updateExtendedHBLANK();
            for (var y = 0; y < 27; ++y) { clock += 3; bus.clockPulse(); }      // TIA 69..147   CPU 23..49
            audioSignal.audioClockPulse();
            endObjectsAltStatusMidLine();
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

    // caution: endClock can exceed but never wrap end of line!
    function renderLineTo(endClock) {
        var p, finalClock = (endClock > LINE_WIDTH ? LINE_WIDTH : endClock);

        if (vBlankOn) {
            // No collisions will be detected during VBLANK
            for (var bPixel = renderClock; bPixel < finalClock; ++bPixel) linePixels[bPixel] = vBlankColor;
            return;
        }

        var newCollisions = collisions;
        for (var pixel = renderClock - HBLANK_DURATION, finalPixel = finalClock - HBLANK_DURATION; pixel < finalPixel; ++pixel) {

            // Pixel color and Flags for Collision latches
            var color = 0, collis = collisionsPossible;

            if (playfieldPriority) {
                // Playfield
                if (playfieldEnabled) {
                    if ((pixel < 80 ? (playfieldPatternL >> (pixel >> 2)) : (playfieldPatternR >> ((pixel - 80) >> 2))) & 1) {
                        color = playfieldColor;     // ignore score mode
                    } else collis &= PFC;
                }
                // Ball
                if (ballEnabled) {
                    p = pixel - ballPixel; if (p < 0) p += 160;
                    if ((missileBallLineSprites[ballLineSpritePointer + (p >> 3)] >> (p & 0x07)) & 1) {
                        if (!color) color = ballColor;
                    } else collis &= BLC;
                }
            }

            // Player0
            if (player0Enabled) {
                p = pixel - player0Pixel; if (p < 0) p += 160;
                if ((playerLineSprites[player0LineSpritePointer + (p >> 3)] >> (p & 0x07)) & 1) {
                    if (!color) color = player0Color;
                } else collis &= P0C;
            }

            // Missile0
            if (missile0Enabled) {
                p = pixel - missile0Pixel; if (p < 0) p += 160;
                if ((missileBallLineSprites[missile0LineSpritePointer + (p >> 3)] >> (p & 0x07)) & 1) {
                    if (!color) color = missile0Color;
                } else collis &= M0C;
            }

            // Player1
            if (player1Enabled) {
                p = pixel - player1Pixel; if (p < 0) p += 160;
                if ((playerLineSprites[player1LineSpritePointer + (p >> 3)] >> (p & 0x07)) & 1) {
                    if (!color) color = player1Color;
                } else collis &= P1C;
            }

            // Missile1
            if (missile1Enabled) {
                p = pixel - missile1Pixel; if (p < 0) p += 160;
                if ((missileBallLineSprites[missile1LineSpritePointer + (p >> 3)] >> (p & 0x07)) & 1) {
                    if (!color) color = missile1Color;
                } else collis &= M1C;
            }

            if (!playfieldPriority) {
                // Playfield
                if (playfieldEnabled) {
                    if (pixel < 80) {
                        if ((playfieldPatternL >> (pixel >> 2)) & 1) {
                            if (!color) color = playfieldLeftColor;
                        } else collis &= PFC;
                    } else {
                        if ((playfieldPatternR >> ((pixel - 80) >> 2)) & 1) {
                            if (!color) color = playfieldRightColor;
                        } else collis &= PFC;
                    }
                }
                // Ball
                if (ballEnabled) {
                    p = pixel - ballPixel; if (p < 0) p += 160;
                    if ((missileBallLineSprites[ballLineSpritePointer + (p >> 3)] >> (p & 0x07)) & 1) {
                        if (!color) color = ballColor;
                    } else collis &= BLC;
                }
            }

            // Set pixel color, or background
            linePixels[pixel + HBLANK_DURATION] = color || playfieldBackground;

            // Update collision latches
            newCollisions |= collis;
        }
        if (!debugNoCollisions) collisions = newCollisions;
    }

    function changeAt(atClock) {
        if (vBlankOn) return;

        if (atClock > renderClock) {
            if (changeClock >= 0 || changeClockPrevLine >= 0) renderLineTo(atClock);
            renderClock = atClock;
        }
        changeClock = renderClock;
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
        var atClock = clock + 1;
        if (atClock > renderClock) {
            if (changeClock >= 0 || changeClockPrevLine >= 0) renderLineTo(atClock);
            renderClock = atClock;
        }
        changeClock = renderClock;
    }

    function updateToClock() {    // does not trigger change
        if (vBlankOn) return;

        if (clock > renderClock) {
            if (changeClock >= 0 || changeClockPrevLine >= 0) renderLineTo(clock);
            renderClock = clock;
        }
    }

    var finishLine = function() {
        // Render remaining part of current line if needed
        if (changeClock >= 0) {
            renderLineTo(LINE_WIDTH);
            changeClockPrevLine = changeClock;
        } else {
            if (changeClockPrevLine >= 0) {
                renderLineTo(changeClockPrevLine);
                changeClockPrevLine = -1;
            }
        }
        // Disabled repeat mode
        //renderLineTo(LINE_WIDTH);
        //changeClockPrevLine = 0;

        endObjectsAltStatusEndOfLine();

        // Handle Paddles capacitor charging, only if paddles are connected (position >= 0)
        if (paddle0Position >= 0 && !paddleCapacitorsGrounded) {
            if (INPT0 < 0x80 && ++paddle0CapacitorCharge >= paddle0Position) INPT0 |= 0x80;
            if (INPT1 < 0x80 && ++paddle1CapacitorCharge >= paddle1Position) INPT1 |= 0x80;
        }

        // Inject debugging information in the line if needed
        if (debugLevel >= 1) processDebugPixelsInLine();
    };

    function augmentCollisionsPossible() {
        collisionsPossible = 0xfffe;
        if (!player0Enabled) collisionsPossible &= P0C;
        if (!player1Enabled) collisionsPossible &= P1C;
        if (!missile0Enabled) collisionsPossible &= M0C;
        if (!missile1Enabled) collisionsPossible &= M1C;
        if (!playfieldEnabled) collisionsPossible &= PFC;
        if (!ballEnabled) collisionsPossible &= BLC;
    }

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
            if (ballEnabled) changeAtClock();
            ballLineSpritePointer = (v >> 1) << 6;
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
            playfieldEnabled = true; augmentCollisionsPossible();
        } else {
            playfieldEnabled = false; collisionsPossible &= PFC;
        }
    }

    function ballSetEnabled(boo) {
        if (boo) {
            ballEnabled = true; augmentCollisionsPossible();
        } else {
            ballEnabled = false; collisionsPossible &= BLC;
        }
    }

    function player0SetShape(i) {
        if (NUSIZ0 === i) return;

        var dif = NUSIZ0 ^ i;
        var oldNUSIZ0 = NUSIZ0;
        NUSIZ0 = i;
        var newShape = (i & 7);
        var c = clock < HBLANK_DURATION ? 2 : clock - HBLANK_DURATION + 2;

        //if (debug) debugPixel(DEBUG_ALT_COLOR);

        if (dif & 0x07) {
            // Enter Alt mode?
            if (!player0Alt) {
                var into = c - player0Pixel; if (into < 0) into += 160; else if (into >= 160) into -= 160;
                var oldScan = playerScanOffsetsShape[(oldNUSIZ0 & 7) * 160 + into];
                var newScan = playerScanOffsetsShape[newShape * 160 + into];
                if (newScan !== oldScan) {
                    if (player0Enabled) changeAtClockPlus(2);
                    player0Alt = player0Pixel >= 80 ? 1 : 2; player0LineSpritePointer += 20;
                    player0AltFrom = into;
                    player0AltLength = playerCopyLengthPerShape[newShape];
                    if (oldScan & 0xc0)
                        player0AltCopyOffset = oldScan & 0xbf;              // Scan about to start or in empty area
                    else if (clock < HBLANK_DURATION && hMoveHitBlank)
                        player0AltCopyOffset = 0x80;                        // Middle of scan during HBLANK, kill scan
                    else {
                        var pixelSize = playerPixelSizePerShape[newShape];
                        player0AltCopyOffset = playerScanStartPerShape[newShape] + oldScan * pixelSize + (into & 1);
                        player0AltLength -= (newScan & 0xc0 ? 0 : newScan) * pixelSize;
                    }

                    //if (debug && videoSignal.monitor.currentLine() === 150) debugInfo("oldScan: " + oldScan.toString(16) + ", newScan: " + newScan.toString(16) + ", len: " + player0AltLength);
                }
            }
            player0UpdateSprite(2);
        }

        if (dif & 0x37) {
            // Enter Alt mode?
            if (!missile0Alt) {
                into = c - missile0Pixel; if (into < 0) into += 160; else if (into >= 160) into -= 160;
                oldScan = missileScanOffsetsShape[(((oldNUSIZ0 & 0x30) >> 1) | (oldNUSIZ0 & 7)) * 160 + into];
                newScan = missileScanOffsetsShape[(((i & 0x30) >> 1) | newShape) * 160 + into];
                if (newScan !== oldScan) {
                    if (missile0Enabled) changeAtClockPlus(2);
                    missile0Alt = missile0Pixel >= 80 ? 1 : 2; missile0LineSpritePointer += 20;
                    missile0AltFrom = into;
                    var size = (i & 0x30) >> 4;
                    missile0AltLength = 4 + (1 << size);
                    if (oldScan & 0xc0)
                        missile0AltCopyOffset = oldScan & 0xbf;              // Scan about to start or in empty area
                    else if (clock < HBLANK_DURATION && hMoveHitBlank)
                        missile0AltCopyOffset = 0x80;                        // Middle of scan during HBLANK, kill scan
                    else {
                        missile0AltCopyOffset = 4 + (oldScan << size) + (into & 1);
                        missile0AltLength -= (newScan & 0xc0 ? 0 : newScan) << size;
                    }
                }
            }
            missile0UpdateSprite(2);
        }
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
        if (sprite) {
            var p = (((REFP0 << 11) | (sprite << 3) | (NUSIZ0 & 7)) << 6) + (player0Alt ? 20 : 0);
            if (!player0Enabled || player0LineSpritePointer !== p) {
                changeAtClockPlus(clockPlus);
                player0LineSpritePointer = p;
                if (player0Alt) player0DefineAlt();
            }
            if (!player0Enabled) {
                player0Enabled = true; augmentCollisionsPossible();
            }
        } else {
            if (player0Enabled) {
                changeAtClockPlus(clockPlus);
                player0Enabled = false; collisionsPossible &= P0C;
            }
        }
    }

    function player1SetShape(i) {
        if (NUSIZ1 === i) return;

        var dif = NUSIZ1 ^ i;
        var oldNUSIZ1 = NUSIZ1;
        NUSIZ1 = i;
        var newShape = (i & 7);
        var c = clock < HBLANK_DURATION ? 2 : clock - HBLANK_DURATION + 2;

        if (dif & 0x07) {
            // Enter Alt mode?
            if (!player1Alt) {
                var into = c - player1Pixel; if (into < 0) into += 160; else if (into >= 160) into -= 160;
                var oldScan = playerScanOffsetsShape[(oldNUSIZ1 & 7) * 160 + into];
                var newScan = playerScanOffsetsShape[newShape * 160 + into];
                if (newScan !== oldScan) {
                    if (player1Enabled) changeAtClockPlus(2);
                    player1Alt = player1Pixel >= 80 ? 1 : 2; player1LineSpritePointer += 40;
                    player1AltFrom = into;
                    player1AltLength = playerCopyLengthPerShape[newShape];
                    if (oldScan & 0xc0)
                        player1AltCopyOffset = oldScan & 0xbf;              // Scan about to start or in empty area
                    else if (clock < HBLANK_DURATION && hMoveHitBlank)
                        player1AltCopyOffset = 0x80;                        // Middle of scan during HBLANK, kill scan
                    else {
                        player1AltCopyOffset = playerScanStartPerShape[newShape] + oldScan * playerPixelSizePerShape[newShape] + (into & 1);
                        player1AltLength -= (newScan & 0xc0 ? 0 : newScan) * playerPixelSizePerShape[newShape];
                    }
                }
            }
            player1UpdateSprite(2);
        }

        if (dif & 0x37) {
            // Enter Alt mode?
            if (!missile1Alt) {
                into = c - missile1Pixel; if (into < 0) into += 160; else if (into >= 160) into -= 160;
                oldScan = missileScanOffsetsShape[(((oldNUSIZ1 & 0x30) >> 1) | (oldNUSIZ1 & 7)) * 160 + into];
                newScan = missileScanOffsetsShape[(((i & 0x30) >> 1) | newShape) * 160 + into];
                if (newScan !== oldScan) {
                    if (missile1Enabled) changeAtClockPlus(2);
                    missile1Alt = missile1Pixel >= 80 ? 1 : 2; missile1LineSpritePointer += 40;
                    missile1AltFrom = into;
                    var size = (i & 0x30) >> 4;
                    missile1AltLength = 4 + (1 << size);
                    if (oldScan & 0xc0)
                        missile1AltCopyOffset = oldScan & 0xbf;              // Scan about to start or in empty area
                    else if (clock < HBLANK_DURATION && hMoveHitBlank)
                        missile1AltCopyOffset = 0x80;                        // Middle of scan during HBLANK, kill scan
                    else {
                        missile1AltCopyOffset = 4 + (oldScan << size) + (into & 1);
                        missile1AltLength -= (newScan & 0xc0 ? 0 : newScan) << size;
                    }
                }
            }
            missile1UpdateSprite(2);
        }
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
        if (sprite) {
            var p = (((REFP1 << 11) | (sprite << 3) | (NUSIZ1 & 7)) << 6) + (player1Alt ? 40 : 0);
            if (!player1Enabled || player1LineSpritePointer !== p) {
                changeAtClockPlus(clockPlus);
                player1LineSpritePointer = p;
                if (player1Alt) player1DefineAlt();
            }
            if (!player1Enabled) {
                player1Enabled = true; augmentCollisionsPossible();
            }
        } else {
            if (player1Enabled) {
                changeAtClockPlus(clockPlus);
                player1Enabled = false; collisionsPossible &= P1C;
            }
        }
    }

    function missile0UpdateSprite(clockPlus) {
        var p = ((((NUSIZ0 & 0x30) >> 1) | (NUSIZ0 & 7)) << 6) + (missile0Alt ? 20 : 0);
        if (missile0LineSpritePointer !== p) {
            if (missile0Enabled) {
                changeAtClockPlus(clockPlus);
                missile0LineSpritePointer = p;
                if (missile0Alt) missile0DefineAlt();
            } else
                missile0LineSpritePointer = p;
        }
    }

    function missile0SetEnabled(boo) {
        if (boo) {
            missile0Enabled = true; augmentCollisionsPossible();
            if (missile0Alt) missile0DefineAlt();
        } else {
            missile0Enabled = false; collisionsPossible &= M0C;
        }
    }

    function missile0SetResetToPlayer(i) {
        if (RESMP0 === (i & 0x02)) return;

        if (ENAM0) {
            changeAtClock();
            missile0SetEnabled(!(RESMP0 = i & 0x02));
        } else
            RESMP0 = i & 0x02;

        if (!RESMP0) {
            missile0Pixel = player0Pixel + missileCenterOffsetsPerPlayerSize[NUSIZ0 & 0x07]; if (missile0Pixel >= 160) missile0Pixel -= 160;
        }
    }

    function missile1UpdateSprite(clockPlus) {
        var p = ((((NUSIZ1 & 0x30) >> 1) | (NUSIZ1 & 7)) << 6) + (missile1Alt ? 40 : 0);
        if (missile1LineSpritePointer !== p) {
            if (missile1Enabled) {
                changeAtClockPlus(clockPlus);
                missile1LineSpritePointer = p;
                if (missile1Alt) missile1DefineAlt();
            } else
                missile1LineSpritePointer = p;
        }
    }

    function missile1SetEnabled(boo) {
        if (boo) {
            missile1Enabled = true; augmentCollisionsPossible();
            if (missile1Alt) missile1DefineAlt();
        } else {
            missile1Enabled = false; collisionsPossible &= M1C;
        }
    }

    function missile1SetResetToPlayer(i) {
        if (RESMP1 === (i & 0x02)) return;

        if (ENAM1) {
            changeAtClock();
            missile1SetEnabled(!(RESMP1 = i & 0x02));
        } else
            RESMP1 = i & 0x02;

        if (!RESMP1) {
            missile1Pixel = player1Pixel + missileCenterOffsetsPerPlayerSize[NUSIZ1 & 0x07]; if (missile1Pixel >= 160) missile1Pixel -= 160;
        }
    }

    var hitRESP0 = function() {
        if (debug) debugPixel(DEBUG_P0_RES_COLOR);

        var r = getRESxPixel();
        var p = r >= 0 ? r : -r;
        if (player0Pixel !== p) {
            if (player0Enabled) changeAtClock();
            var pStart = (r >= 0 ? p : 0);
            var into = pStart - player0Pixel; if (into < 0) into += 160;
            player0Pixel = p;
            var nusiz = NUSIZ0 & 7;

            if (player0Alt) {
                if (into <= playerCopyLengthPerShape[nusiz]) return;                  // Keep current Alt def if still in first copy
            } else
                player0LineSpritePointer += 20;

            var delta = pStart - p; if (delta < -100) delta += 160;
            player0Alt = p >= 80 ? 1 : 2;
            player0AltFrom = delta >= 0 ? delta : 160 + delta;
            player0AltLength = playerCopyLengthPerShape[nusiz] - delta;
            player0AltCopyOffset = playerCopyOffsetsReset[nusiz * 160 + into];
            if (player0Enabled) player0DefineAlt();

            //if (debug && videoSignal.monitor.currentLine() === 80) debugInfo("player0Pixel: " + player0Pixel + ", into: " + into + ", delta: " + delta + ", from: " + player0AltFrom + ", len: " + player0AltLength + ", off: " + player0AltCopyOffset);
        }
    };

    function player0DefineAlt() {
        var control = (player0AltFrom << 16) | (player0AltLength << 8) | player0AltCopyOffset;
        var controlPointer = (player0LineSpritePointer - 20) >> 6;
        if (player0AltControl[controlPointer] === control) return;

        var basePointer = player0LineSpritePointer - 20;
        for (var b = 0; b < 20; ++b) playerLineSprites[player0LineSpritePointer + b] = playerLineSprites[basePointer + b];

        var p = player0AltFrom;
        if (player0AltCopyOffset & 0x80) {
            // Just clear bits
            for (var c = 0; c < player0AltLength; ++c) {
                playerLineSprites[player0LineSpritePointer + (p >> 3)] &= ~(1 << (p & 0x07));
                if (++p >= 160) p -= 160;
            }
        } else {
            // Copy bits from base
            basePointer -= objectsLineSpritePointerDeltaToSingleCopy[(NUSIZ0 & 7)];
            for (var pBase = player0AltCopyOffset, to = player0AltCopyOffset + player0AltLength; pBase < to; ++pBase) {
                if ((playerLineSprites[basePointer + (pBase >> 3)] >> (pBase & 0x07)) & 1)
                    playerLineSprites[player0LineSpritePointer + (p >> 3)] |= (1 << (p & 0x07));
                else
                    playerLineSprites[player0LineSpritePointer + (p >> 3)] &= ~(1 << (p & 0x07));
                if (++p >= 160) p -= 160;
            }
        }

        player0AltControl[controlPointer] = control;
    }

    var hitRESP1 = function() {
        if (debug) debugPixel(DEBUG_P1_RES_COLOR);

        var r = getRESxPixel();
        var p = r >= 0 ? r : -r;
        if (player1Pixel !== p) {
            if (player1Enabled) changeAtClock();
            var pStart = (r >= 0 ? p : 0);
            var into = pStart - player1Pixel; if (into < 0) into += 160;
            player1Pixel = p;
            var nusiz = NUSIZ1 & 7;

            if (player1Alt) {
                if (into <= playerCopyLengthPerShape[nusiz]) return;                  // Keep current Alt def if still in first copy
            } else
                player1LineSpritePointer += 40;

            var delta = pStart - p; if (delta < -100) delta += 160;
            player1Alt = p >= 80 ? 1 : 2;
            player1AltFrom = delta >= 0 ? delta : 160 + delta;
            player1AltLength = playerCopyLengthPerShape[nusiz] - delta;
            player1AltCopyOffset = playerCopyOffsetsReset[nusiz * 160 + into];
            if (player1Enabled) player1DefineAlt();
        }
    };

    function player1DefineAlt() {
        var control = (player1AltFrom << 16) | (player1AltLength << 8) | player1AltCopyOffset;
        var controlPointer = (player1LineSpritePointer - 40) >> 6;
        if (player1AltControl[controlPointer] === control) return;

        var basePointer = player1LineSpritePointer - 40;
        for (var b = 0; b < 20; ++b) playerLineSprites[player1LineSpritePointer + b] = playerLineSprites[basePointer + b];

        var p = player1AltFrom;
        if (player1AltCopyOffset & 0x80) {
            // Just clear bits
            for (var c = 0; c < player1AltLength; ++c) {
                playerLineSprites[player1LineSpritePointer + (p >> 3)] &= ~(1 << (p & 0x07));
                if (++p >= 160) p -= 160;
            }
        } else {
            // Copy bits from base
            basePointer -= objectsLineSpritePointerDeltaToSingleCopy[(NUSIZ1 & 7)];
            for (var pBase = player1AltCopyOffset, to = player1AltCopyOffset + player1AltLength; pBase < to; ++pBase) {
                if ((playerLineSprites[basePointer + (pBase >> 3)] >> (pBase & 0x07)) & 1)
                    playerLineSprites[player1LineSpritePointer + (p >> 3)] |= (1 << (p & 0x07));
                else
                    playerLineSprites[player1LineSpritePointer + (p >> 3)] &= ~(1 << (p & 0x07));
                if (++p >= 160) p -= 160;
            }
        }

        player1AltControl[controlPointer] = control;
    }

    var hitRESM0 = function() {
        if (debug) debugPixel(DEBUG_M0_COLOR);

        var r = getRESxPixel();
        var p = r >= 0 ? r : -r;
        if (missile0Pixel !== p) {
            if (missile0Enabled) changeAtClock();
            var pStart = (r >= 0 ? p : 0);
            var into = pStart - missile0Pixel; if (into < 0) into += 160;
            missile0Pixel = p;

            if (missile0Alt) {
                if (into <= 4 + (1 << ((NUSIZ0 & 0x30) >> 4))) return;                // Keep current Alt def if still in first copy
            } else
                missile0LineSpritePointer += 20;

            var delta = pStart - p; if (delta < -100) delta += 160;
            missile0Alt = p >= 80 ? 1 : 2;
            missile0AltFrom = delta >= 0 ? delta : 160 + delta;
            missile0AltLength = 4 + (1 << ((NUSIZ0 & 0x30) >> 4)) - delta;
            missile0AltCopyOffset = missileCopyOffsetsReset[(((NUSIZ0 & 0x30) >> 1) | (NUSIZ0 & 7)) * 160 + into];
            if (missile0Enabled) missile0DefineAlt();
        }
    };

    function missile0DefineAlt() {
        var control = (missile0AltFrom << 16) | (missile0AltLength << 8) | missile0AltCopyOffset;
        var controlPointer = (missile0LineSpritePointer - 20) >> 6;
        if (missile0AltControl[controlPointer] === control) return;

        var basePointer = missile0LineSpritePointer - 20;
        for (var b = 0; b < 20; ++b) missileBallLineSprites[missile0LineSpritePointer + b] = missileBallLineSprites[basePointer + b];

        var p = missile0AltFrom;
        if (missile0AltCopyOffset & 0x80) {
            // Just clear bits
            for (var c = 0; c < missile0AltLength; ++c) {
                missileBallLineSprites[missile0LineSpritePointer + (p >> 3)] &= ~(1 << (p & 0x07));
                if (++p >= 160) p -= 160;
            }
        } else {
            // Copy bits from base
            basePointer -= objectsLineSpritePointerDeltaToSingleCopy[(NUSIZ0 & 7)];
            for (var pBase = missile0AltCopyOffset, to = missile0AltCopyOffset + missile0AltLength; pBase < to; ++pBase) {
                if ((missileBallLineSprites[basePointer + (pBase >> 3)] >> (pBase & 0x07)) & 1)
                    missileBallLineSprites[missile0LineSpritePointer + (p >> 3)] |= (1 << (p & 0x07));
                else
                    missileBallLineSprites[missile0LineSpritePointer + (p >> 3)] &= ~(1 << (p & 0x07));
                if (++p >= 160) p -= 160;
            }
        }

        missile0AltControl[controlPointer] = control;
    }

    var hitRESM1 = function() {
        if (debug) debugPixel(DEBUG_M1_COLOR);

        var r = getRESxPixel();
        var p = r >= 1 ? r : -r;
        if (missile1Pixel !== p) {
            if (missile1Enabled) changeAtClock();
            var pStart = (r >= 0 ? p : 0);
            var into = pStart - missile1Pixel; if (into < 0) into += 160;
            missile1Pixel = p;

            if (missile1Alt) {
                if (into <= 4 + (1 << ((NUSIZ1 & 0x30) >> 4))) return;                // Keep current Alt def if still in first copy
            } else
                missile1LineSpritePointer += 40;

            var delta = pStart - p; if (delta < -100) delta += 160;
            missile1Alt = p >= 80 ? 1 : 2;
            missile1AltFrom = delta >= 0 ? delta : 160 + delta;
            missile1AltLength = 4 + (1 << ((NUSIZ1 & 0x30) >> 4)) - delta;
            missile1AltCopyOffset = missileCopyOffsetsReset[(((NUSIZ1 & 0x30) >> 1) | (NUSIZ1 & 7)) * 160 + into];
            if (missile1Enabled) missile1DefineAlt();
        }
    };

    function missile1DefineAlt() {
        var control = (missile1AltFrom << 16) | (missile1AltLength << 8) | missile1AltCopyOffset;
        var controlPointer = (missile1LineSpritePointer - 40) >> 6;
        if (missile1AltControl[controlPointer] === control) return;

        var basePointer = missile1LineSpritePointer - 40;
        for (var b = 0; b < 20; ++b) missileBallLineSprites[missile1LineSpritePointer + b] = missileBallLineSprites[basePointer + b];

        var p = missile1AltFrom;
        if (missile1AltCopyOffset & 0x80) {
            // Just clear bits
            for (var c = 0; c < missile1AltLength; ++c) {
                missileBallLineSprites[missile1LineSpritePointer + (p >> 3)] &= ~(1 << (p & 0x07));
                if (++p >= 160) p -= 160;
            }
        } else {
            // Copy bits from base
            basePointer -= objectsLineSpritePointerDeltaToSingleCopy[(NUSIZ1 & 7)];
            for (var pBase = missile1AltCopyOffset, to = missile1AltCopyOffset + missile1AltLength; pBase < to; ++pBase) {
                if ((missileBallLineSprites[basePointer + (pBase >> 3)] >> (pBase & 0x07)) & 1)
                    missileBallLineSprites[missile1LineSpritePointer + (p >> 3)] |= (1 << (p & 0x07));
                else
                    missileBallLineSprites[missile1LineSpritePointer + (p >> 3)] &= ~(1 << (p & 0x07));
                if (++p >= 160) p -= 160;
            }
        }

        missile1AltControl[controlPointer] = control;
    }

    var hitRESBL = function() {
        if (debug) debugPixel(DEBUG_BL_COLOR);

        var r = getRESxPixel();
        var p = r >= 0 ? r : -r;
        if (ballPixel !== p) {
            if (ballEnabled) changeAtClock();
            ballPixel = p;
        }
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
        // Change objects position
        var add;
        var changed = false;
        add = (hMoveHitBlank ? HMP0 : HMP0 + 8); if (add !== 0) {
            player0Pixel -= add; if (player0Pixel >= 160) player0Pixel -= 160; else if (player0Pixel < 0) player0Pixel += 160;
            if (player0Enabled) changed = true;
        }
        add = (hMoveHitBlank ? HMP1 : HMP1 + 8); if (add !== 0) {
            player1Pixel -= add; if (player1Pixel >= 160) player1Pixel -= 160; else if (player1Pixel < 0) player1Pixel += 160;
            if (player1Enabled) changed = true;
        }
        add = (hMoveHitBlank ? HMM0 : HMM0 + 8); if (add !== 0) {
            missile0Pixel -= add; if (missile0Pixel >= 160) missile0Pixel -= 160; else if (missile0Pixel < 0) missile0Pixel += 160;
            if (missile0Enabled) changed = true;
        }
        add = (hMoveHitBlank ? HMM1 : HMM1 + 8); if (add !== 0) {
            missile1Pixel -= add; if (missile1Pixel >= 160) missile1Pixel -= 160; else if (missile1Pixel < 0) missile1Pixel += 160;
            if (missile1Enabled) changed = true;
        }
        add = (hMoveHitBlank ? HMBL : HMBL + 8); if (add !== 0) {
            ballPixel -= add; if (ballPixel >= 160) ballPixel -= 160; else if (ballPixel < 0) ballPixel += 160;
            if (ballEnabled) changed = true;
        }

        if (changed) changeClock = hMoveHitBlank ? HBLANK_DURATION + 8 : HBLANK_DURATION;
    };

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

    function updateExtendedHBLANK() {
        // Detect change in the extended HBLANK filling
        if (hMoveHitBlank !== (linePixels[HBLANK_DURATION] === hBlankColor)) {
            if (hMoveHitBlank) {
                // Fills the extended HBLANK portion of the current line
                linePixels[HBLANK_DURATION] = linePixels[HBLANK_DURATION + 1] = linePixels[HBLANK_DURATION + 2] = linePixels[HBLANK_DURATION + 3] =
                    linePixels[HBLANK_DURATION + 4] = linePixels[HBLANK_DURATION + 5] = linePixels[HBLANK_DURATION + 6] = linePixels[HBLANK_DURATION + 7] =
                        hBlankColor;    // This is faster than a fill
            } else
                changeClock = HBLANK_DURATION;
        }
        if (hMoveHitBlank) renderClock = HBLANK_DURATION + 8;
    }

    function endObjectsAltStatusMidLine() {
        if (player0Alt === 1)  { if (player0Enabled)  changeAtClock(); player0Alt = 0;  player0LineSpritePointer -= 20; }
        if (player1Alt === 1)  { if (player1Enabled)  changeAtClock(); player1Alt = 0;  player1LineSpritePointer -= 40; }
        if (missile0Alt === 1) { if (missile0Enabled) changeAtClock(); missile0Alt = 0; missile0LineSpritePointer -= 20; }
        if (missile1Alt === 1) { if (missile1Enabled) changeAtClock(); missile1Alt = 0; missile1LineSpritePointer -= 40; }
    }

    function endObjectsAltStatusEndOfLine() {
        if (player0Alt === 2)  { player0Alt = 0;  player0LineSpritePointer -= 20; }
        if (player1Alt === 2)  { player1Alt = 0;  player1LineSpritePointer -= 40; }
        if (missile0Alt === 2) { missile0Alt = 0; missile0LineSpritePointer -= 20; }
        if (missile1Alt === 2) { missile1Alt = 0; missile1LineSpritePointer -= 40; }
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

    // All possible entire line pixels for players, for all 8 bit patterns (sprites), including all variations (copies) and mirrors
    function generateObjectsLineSprites() {
        // Players
        var line = new Uint8Array(160);
        for (var mirror = 0; mirror <= 1; ++mirror) {
            for (var pattern = 0; pattern < 256; ++pattern) {
                var sprite = !mirror ? jt.Util.reverseInt8(pattern) : pattern;
                // 1 copy
                paintSprite(line, sprite, 4 + 1); addPlayerSprite(mirror, pattern, 0, 0, line);                   // 4 + 1 means player is delayed 4 + 1 pixels
                // 2 copies close
                paintSprite(line, sprite, 4 + 16 + 1); addPlayerSprite(mirror, pattern, 1, 0, line);
                // 3 copies close
                paintSprite(line, sprite, 4 + 32 + 1); addPlayerSprite(mirror, pattern, 3, 0, line);
                // 2 copies medium
                paintSprite(line, 0, 4 + 16 + 1); addPlayerSprite(mirror, pattern, 2, 0, line);                   // erase close copy
                // 3 copies medium
                paintSprite(line, sprite, 4 + 64 + 1); addPlayerSprite(mirror, pattern, 6, 0, line);
                // 2 copies wide
                paintSprite(line, 0, 4 + 32 + 1); addPlayerSprite(mirror, pattern, 4, 0, line);                   // erase medium copy
                // 1 copy double
                paintSprite(line, 0, 4 + 64 + 1); line[4 + 1] = 0;                                                // erase wide copy and first pixel
                paintSpriteDouble(line, sprite, 4 + 1 + 1); addPlayerSprite(mirror, pattern, 5, 0, line);         // 4 + 1 + 1 means Double and Quad are delayed 1 extra pixel
                // 1 copy quad
                paintSpriteQuad(line, sprite, 4 + 1 + 1); addPlayerSprite(mirror, pattern, 7, 0, line);
                // empty line
                paintSpriteQuad(line, 0, 4 + 1 + 1);
            }
        }

        // Missiles & Ball
        jt.Util.arrayFill(line, 0);
        for (var size = 0; size < 4; ++size) {
            sprite = (1 << (1 << size)) - 1;
            // 1 copy
            paintSprite(line, sprite, 4);                                                                         // 4 means missile/ball is delayed 4 pixels
            addMissileBallSprite(size, 0, 0, line);
            addMissileBallSprite(size, 5, 0, line);
            addMissileBallSprite(size, 7, 0, line);
            // 2 copies close
            paintSprite(line, sprite, 4 + 16); addMissileBallSprite(size, 1, 0, line);
            // 3 copies close
            paintSprite(line, sprite, 4 + 32); addMissileBallSprite(size, 3, 0, line);
            // 2 copies medium
            paintSprite(line, 0, 4 + 16); addMissileBallSprite(size, 2, 0, line);                                 // erase close copy
            // 3 copies medium
            paintSprite(line, sprite, 4 + 64); addMissileBallSprite(size, 6, 0, line);
            // 2 copies wide
            paintSprite(line, 0, 4 + 32); addMissileBallSprite(size, 4, 0, line);                                 // erase medium copy
            paintSprite(line, 0, 4);                                                                              // clean line: erase first and wide copy
            paintSprite(line, 0, 4 + 64);
        }

        function paintSprite(line, pat, pos) {
            for (var b = 0; b < 8; ++b) line[pos + b] = (pat >> b) & 1;
        }
        function paintSpriteDouble(line, pat, pos) {
            for (var b = 0; b < 8; ++b) line[pos + b*2] = line[pos + b*2 + 1] = (pat >> b) & 1;
        }
        function paintSpriteQuad(line, pat, pos) {
            for (var b = 0; b < 8; ++b) line[pos + b*4] = line[pos + b*4 + 1] = line[pos + b*4 + 2] = line[pos + b*4 + 3] = (pat >> b) & 1;
        }
        function addPlayerSprite(mirror, pattern, vari, alt, line) {
            var pos = (((mirror << 11) | (pattern << 3) | vari) << 6) + alt * 20;
            for (var i = 0; i < 20; ++i)
                for (var b = 0; b < 8; ++b)
                    if (line[i * 8 + b]) playerLineSprites[pos + i] |= 1 << b;

        }
        function addMissileBallSprite(size, vari, alt, line) {
            var pos = (((size << 3) | vari) << 6) + alt * 20;
            for (var i = 0; i < 20; ++i)
                for (var b = 0; b < 8; ++b)
                    if (line[i * 8 + b]) missileBallLineSprites[pos + i] |= 1 << b;

        }
    }

    function generateObjectsCopiesOffsets() {
        var delays = new Uint8Array(40);
        delays[0] = 0; delays[1] = 1; delays[2] = 2; delays[3] = 3;

        // Players
        jt.Util.arrayFill(playerCopyOffsetsReset, 0x80);
        jt.Util.arrayFill(playerScanOffsetsShape, 0x80);
        // Normal Variations
        for (var p = 0; p < 13; ++p) {
            // Apply delays for Reset start signal
            var v = p - delays[p];
            playerCopyOffsetsReset[0*160 + p] = v;
            playerCopyOffsetsReset[1*160 + p] = v;  playerCopyOffsetsReset[1*160 + p + 16] = v;
            playerCopyOffsetsReset[2*160 + p] = v;  playerCopyOffsetsReset[2*160 + p + 32] = v;
            playerCopyOffsetsReset[3*160 + p] = v;  playerCopyOffsetsReset[3*160 + p + 16] = v; playerCopyOffsetsReset[3*160 + p + 32] = v;
            playerCopyOffsetsReset[4*160 + p] = v;  playerCopyOffsetsReset[4*160 + p + 64] = v;
            playerCopyOffsetsReset[6*160 + p] = v;  playerCopyOffsetsReset[6*160 + p + 32] = v; playerCopyOffsetsReset[6*160 + p + 64] = v;
            // Start signal and pixel scan info
            v = p < 5 ? p | 0x40 : p - 5;
            playerScanOffsetsShape[0*160 + p] = v;
            playerScanOffsetsShape[1*160 + p] = v;  playerScanOffsetsShape[1*160 + p + 16] = v;
            playerScanOffsetsShape[2*160 + p] = v;  playerScanOffsetsShape[2*160 + p + 32] = v;
            playerScanOffsetsShape[3*160 + p] = v;  playerScanOffsetsShape[3*160 + p + 16] = v; playerScanOffsetsShape[3*160 + p + 32] = v;
            playerScanOffsetsShape[4*160 + p] = v;  playerScanOffsetsShape[4*160 + p + 64] = v;
            playerScanOffsetsShape[6*160 + p] = v;  playerScanOffsetsShape[6*160 + p + 32] = v; playerScanOffsetsShape[6*160 + p + 64] = v;
        }

        // Double Variation
        for (p = 0; p < 22; p++) {
            v = p - delays[p];
            playerCopyOffsetsReset[5 * 160 + p] = v;
            v = p < 6 ? p | 0x40 : (p - 6) >> 1;
            playerScanOffsetsShape[5 * 160 + p] = v;
        }
        // Quad Variation
        for (p = 0; p < 38; p++) {
            v = p - delays[p];
            playerCopyOffsetsReset[7 * 160 + p] = v;
            v = p < 6 ? p | 0x40 : (p - 6) >> 2;
            playerScanOffsetsShape[7 * 160 + p] = v;
        }

        // Missiles
        jt.Util.arrayFill(missileCopyOffsetsReset, 0x80);
        jt.Util.arrayFill(missileScanOffsetsShape, 0x80);
        // All Size * Variations
        for (var s = 0; s <= 3; ++s) {
            var d = 4 + (1 << s);
            for (p = 0; p < d; ++p) {
                v = p - delays[p];
                missileCopyOffsetsReset[s*8*160 + 0*160 + p] = v;
                missileCopyOffsetsReset[s*8*160 + 1*160 + p] = v;  missileCopyOffsetsReset[s*8 + 1*160 + p + 16] = v;
                missileCopyOffsetsReset[s*8*160 + 2*160 + p] = v;  missileCopyOffsetsReset[s*8 + 2*160 + p + 32] = v;
                missileCopyOffsetsReset[s*8*160 + 3*160 + p] = v;  missileCopyOffsetsReset[s*8 + 3*160 + p + 16] = v; missileCopyOffsetsReset[s*8*160 + 3*160 + p + 32] = v;
                missileCopyOffsetsReset[s*8*160 + 4*160 + p] = v;  missileCopyOffsetsReset[s*8 + 4*160 + p + 64] = v;
                missileCopyOffsetsReset[s*8*160 + 5*160 + p] = v;
                missileCopyOffsetsReset[s*8*160 + 6*160 + p] = v;  missileCopyOffsetsReset[s*8 + 6*160 + p + 32] = v; missileCopyOffsetsReset[s*8*160 + 6*160 + p + 64] = v;
                missileCopyOffsetsReset[s*8*160 + 7*160 + p] = v;
                v = p < 4 ? p | 0x40 : (p - 4) >> s;
                missileScanOffsetsShape[s*8*160 + 0*160 + p] = v;
                missileScanOffsetsShape[s*8*160 + 1*160 + p] = v;  missileScanOffsetsShape[s*8 + 1*160 + p + 16] = v;
                missileScanOffsetsShape[s*8*160 + 2*160 + p] = v;  missileScanOffsetsShape[s*8 + 2*160 + p + 32] = v;
                missileScanOffsetsShape[s*8*160 + 3*160 + p] = v;  missileScanOffsetsShape[s*8 + 3*160 + p + 16] = v; missileScanOffsetsShape[s*8*160 + 3*160 + p + 32] = v;
                missileScanOffsetsShape[s*8*160 + 4*160 + p] = v;  missileScanOffsetsShape[s*8 + 4*160 + p + 64] = v;
                missileScanOffsetsShape[s*8*160 + 5*160 + p] = v;
                missileScanOffsetsShape[s*8*160 + 6*160 + p] = v;  missileScanOffsetsShape[s*8 + 6*160 + p + 32] = v; missileScanOffsetsShape[s*8*160 + 6*160 + p + 64] = v;
                missileScanOffsetsShape[s*8*160 + 7*160 + p] = v;
            }
        }
    }


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
            ccp: changeClockPrevLine,
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
            blp: ballLineSpritePointer,
            bc: ballColor,

            p0e: player0Enabled,
            p0x: player0Pixel,
            p0lp: player0LineSpritePointer,
            p0a: player0Alt,
            p0af: player0AltFrom,
            p0al: player0AltLength,
            p0ao: player0AltCopyOffset,
            p0c: player0Color,

            p1e: player1Enabled,
            p1x: player1Pixel,
            p1lp: player1LineSpritePointer,
            p1a: player1Alt,
            p1af: player1AltFrom,
            p1al: player1AltLength,
            p1ao: player1AltCopyOffset,
            p1c: player1Color,

            m0e: missile0Enabled,
            m0x: missile0Pixel,
            m0lp: missile0LineSpritePointer,
            m0a: missile0Alt,
            m0af: missile0AltFrom,
            m0al: missile0AltLength,
            m0ao: missile0AltCopyOffset,
            m0c: missile0Color,

            m1e: missile1Enabled,
            m1x: missile1Pixel,
            m1lp: missile1LineSpritePointer,
            m1a: missile1Alt,
            m1af: missile1AltFrom,
            m1al: missile1AltLength,
            m1ao: missile1AltCopyOffset,
            m1c: missile1Color,

            hmh: hMoveHitBlank,
            hmc: hMoveHitClock,
            hmlh: hMoveLateHit,
            hmlb: hMoveLateHitBlank,

            co: collisions,
            cop: collisionsPossible,
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
        changeClockPrevLine = s.ccp;
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
        ballLineSpritePointer = s.blp | 0;
        ballColor = s.bc | 0;

        player0Enabled = s.p0e;
        player0Pixel = s.p0x | 0;
        player0LineSpritePointer = s.p0lp | 0;
        player0Alt = s.p0a | 0;
        player0AltFrom = s.p0af | 0;
        player0AltLength = s.p0al | 0;
        player0AltCopyOffset = s.p0ao | 0;
        jt.Util.arrayFill(player0AltControl, 0);
        player0Color = s.p0c | 0;

        player1Enabled = s.p1e;
        player1Pixel = s.p1x | 0;
        player1LineSpritePointer = s.p1lp | 0;
        player1Alt = s.p1a | 0;
        player1AltFrom = s.p1af | 0;
        player1AltLength = s.p1al | 0;
        player1AltCopyOffset = s.p1ao | 0;
        jt.Util.arrayFill(player1AltControl, 0);
        player1Color = s.p1c | 0;

        missile0Enabled = s.m0e;
        missile0Pixel = s.m0x | 0;
        missile0LineSpritePointer = s.m0lp | 0;
        missile0Alt = s.m0a | 0;
        missile0AltFrom = s.m0af | 0;
        missile0AltLength = s.m0al | 0;
        missile0AltCopyOffset = s.m0ao | 0;
        jt.Util.arrayFill(missile0AltControl, 0);
        missile0Color = s.m0c | 0;

        missile1Enabled = s.m1e;
        missile1Pixel = s.m1x | 0;
        missile1LineSpritePointer = s.m1lp | 0;
        missile1Alt = s.m1a | 0;
        missile1AltFrom = s.m1af | 0;
        missile1AltLength = s.m1al | 0;
        missile1AltCopyOffset = s.m1ao | 0;
        jt.Util.arrayFill(missile1AltControl, 0);
        missile1Color = s.m1c | 0;

        hMoveHitBlank = s.hmh;
        hMoveHitClock = s.hmc | 0;
        hMoveLateHit = s.hmlh;
        hMoveLateHitBlank = s.hmlb;

        collisions = s.co | 0;
        collisionsPossible = s.cop | 0;
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

    var clock, changeClock, changeClockPrevLine, renderClock;
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

    var ballEnabled = false, ballPixel = 0, ballLineSpritePointer = 0;
    var ballColor = 0xff000000;

    var player0Enabled = false, player0Pixel = 0, player0LineSpritePointer = 0;
    var player0Alt = 0, player0AltFrom = 0, player0AltLength = 0, player0AltCopyOffset = 0;
    var player0AltControl = new Uint32Array(2 * 256 * 8);
    var player0Color = 0xff000000;

    var player1Enabled = false, player1Pixel = 0, player1LineSpritePointer = 0;
    var player1Alt = 0, player1AltFrom = 0, player1AltLength = 0, player1AltCopyOffset = 0;
    var player1AltControl = new Uint32Array(2 * 256 * 8);
    var player1Color = 0xff000000;

    var missile0Enabled = false, missile0Pixel = 0, missile0LineSpritePointer = 0;
    var missile0Alt = 0, missile0AltFrom = 0, missile0AltLength = 0, missile0AltCopyOffset = 0;
    var missile0AltControl = new Uint32Array(4 * 8);
    var missile0Color = 0xff000000;

    var missile1Enabled = false, missile1Pixel = 0, missile1LineSpritePointer = 0;
    var missile1Alt = 0, missile1AltFrom = 0, missile1AltLength = 0, missile1AltCopyOffset = 0;
    var missile1AltControl = new Uint32Array(4 * 8);
    var missile1Color = 0xff000000;

    var hMoveHitBlank = false;
    var hMoveHitClock = 0;
    var hMoveLateHit = false;
    var hMoveLateHitBlank = false;

    var collisions = 0, collisionsPossible = 0;

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


    var playerLineSprites = new Uint8Array(2 * 256 * 8 * 64);               // 2 Mirrors * 256 Patterns * 8 Variations * (1 base + 2 alts) * 20 8Bits line data specifying 1bit pixels + 4 bytes spare
    var missileBallLineSprites = new Uint8Array(4 * 8 * 64);                // 4 Sizes * 8 Variations * (1 base + 2 alts) * 20 8Bits line data specifying 1bit pixels + 4 bytes spare

    var playerCopyLengthPerShape = new Uint8Array([13, 13, 13, 13, 13, 22, 13, 38]);
    var playerScanStartPerShape =  new Uint8Array([5, 5, 5, 5, 5, 6, 5, 6]);
    var playerPixelSizePerShape =  new Uint8Array([1, 1, 1, 1, 1, 2, 1, 4]);

    var playerCopyOffsetsReset = new Uint8Array(8 * 160);                   // 8 Variations * 160 1 byte data with copy pixel position
    var playerScanOffsetsShape = new Uint8Array(8 * 160);                   // 8 Variations * 160 1 byte data with copy pixel position

    var missileCopyOffsetsReset = new Uint8Array(4 * 8 * 160);              // 4 Sizes * 8 Variations * 160 1 byte data with copy pixel position
    var missileScanOffsetsShape = new Uint8Array(4 * 8 * 160);              // 4 Sizes * 8 Variations * 160 1 byte data with copy pixel position

    var objectsLineSpritePointerDeltaToSingleCopy = new Uint16Array([0 * 64, 1 * 64, 2 * 64, 3 * 64, 4 * 64, 0 * 64, 6 * 64, 0 * 64]);

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
