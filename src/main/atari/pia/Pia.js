// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.Pia = function() {
"use strict";

    this.powerOn = function() {
    };

    this.powerOff = function() {
    };

    this.clockPulse = function() {
        if (--timerCount <= 0)
            decrementTimer();
    };

    this.connectBus = function(aBus) {
        bus = aBus;
    };

    this.read = function(address) {
        var reg = address & ADDRESS_MASK;

        if (reg === 0x04 || reg === 0x06) { readFromINTIM(); return INTIM; }
        if (reg === 0x00) return SWCHA;
        if (reg === 0x02) return SWCHB;
        if (reg === 0x01) return SWACNT;
        if (reg === 0x03) return SWBCNT;
        if (reg === 0x05 || reg === 0x07) return INSTAT;						// Undocumented

        // debugInfo(String.format("Invalid PIA read register address: %04x", address));
        return 0;
    };

    this.write = function(address, i) {
        var reg = address & ADDRESS_MASK;

        if (reg === 0x04) { TIM1T  = i; setTimerInterval(i, 1); return; }
        if (reg === 0x05) { TIM8T  = i; setTimerInterval(i, 8); return; }
        if (reg === 0x06) { TIM64T = i; setTimerInterval(i, 64); return; }
        if (reg === 0x07) { T1024T = i; setTimerInterval(i, 1024); return; }
        if (reg === 0x02) { swchbWrite(i); return; }
        if (reg === 0x03) { SWBCNT = i; debugInfo(">>>> Ineffective Write to PIA SWBCNT: " + i); return; }
        if (reg === 0x00) { debugInfo(">>>> Unsupported Write to PIA SWCHA: " + i); return; }	// Output to controllers not supported
        if (reg === 0x01) { debugInfo(">>>> Unsupported Write to PIA SWACNT " + i); return; }	// SWACNT configuration not supported

        // debugInfo(String.format("Invalid PIA write register address: %04x value %d", address, b));
        return 0;
    };

    var decrementTimer = function() {	// TODO There might be an accuracy problem here
        // Also check for overflow
        if (--INTIM < 0) {
            INSTAT |= 0xc0;								// Set bit 7 and 6 (Overflow since last INTIM read and since last TIMxx write)
            INTIM = 0xff;								// Wrap timer
            timerCount = currentTimerInterval = 1;		// If timer underflows, return to 1 cycle interval per specification
        } else
            timerCount = currentTimerInterval;
    };

    var setTimerInterval = function(value, interval) {
        INTIM = value;
        INSTAT &= 0x3f;				// Reset bit 7 and 6 (Overflow since last INTIM read and since last TIMxx write)
        timerCount = currentTimerInterval = lastSetTimerInterval = interval;
        decrementTimer();			// Timer immediately decrements after setting per specification
    };

    var readFromINTIM = function() {
        INSTAT &= 0xbf;									// Resets bit 6 (Overflow since last INTIM read)
        // If fastDecrement was active (currentTimerInterval == 1), interval always returns to set value after read per specification
        if (currentTimerInterval === 1)
            timerCount = currentTimerInterval = lastSetTimerInterval;
    };

    var swchbWrite = function(val) {
        // Only bits 2, 4 and 5 can be written
        SWCHB = (SWCHB & 0xcb) | (val & 34);
    };

    var debugInfo = function(str) {
        if (self.debug)
            jt.Util.log(str);
    };


    // Controls interface  -----------------------------------------

    var controls = jt.ConsoleControls;

    this.controlStateChanged = function(control, state) {
        switch (control) {
            case controls.JOY0_UP:        if (state) SWCHA &= 0xef; else SWCHA |= 0x10; return;	//  0 = Pressed
            case controls.JOY0_DOWN:      if (state) SWCHA &= 0xdf; else SWCHA |= 0x20; return;
            case controls.PADDLE1_BUTTON:
            case controls.JOY0_LEFT:      if (state) SWCHA &= 0xbf; else SWCHA |= 0x40; return;
            case controls.PADDLE0_BUTTON:
            case controls.JOY0_RIGHT:     if (state) SWCHA &= 0x7f; else SWCHA |= 0x80; return;
            case controls.JOY1_UP:        if (state) SWCHA &= 0xfe; else SWCHA |= 0x01; return;
            case controls.JOY1_DOWN:      if (state) SWCHA &= 0xfd; else SWCHA |= 0x02; return;
            case controls.JOY1_LEFT:      if (state) SWCHA &= 0xfb; else SWCHA |= 0x04; return;
            case controls.JOY1_RIGHT:     if (state) SWCHA &= 0xf7; else SWCHA |= 0x08; return;
            case controls.RESET:          if (state) SWCHB &= 0xfe; else SWCHB |= 0x01; return;
            case controls.SELECT:         if (state) SWCHB &= 0xfd; else SWCHB |= 0x02; return;
        }
        // Toggles
        if (!state) return;
        switch (control) {
            case controls.BLACK_WHITE: if ((SWCHB & 0x08) == 0) SWCHB |= 0x08; else SWCHB &= 0xf7;		//	0 = B/W, 1 = Color
                bus.getTia().getVideoOutput().showOSD((SWCHB & 0x08) != 0 ? "COLOR" : "B/W", true); return;
            case controls.DIFFICULTY0: if ((SWCHB & 0x40) == 0) SWCHB |= 0x40; else SWCHB &= 0xbf; 		//  0 = Beginner, 1 = Advanced
                bus.getTia().getVideoOutput().showOSD((SWCHB & 0x40) != 0 ? "P1 Expert" : "P1 Novice", true); return;
            case controls.DIFFICULTY1: if ((SWCHB & 0x80) == 0) SWCHB |= 0x80; else SWCHB &= 0x7f;		//  0 = Beginner, 1 = Advanced
                bus.getTia().getVideoOutput().showOSD((SWCHB & 0x80) != 0 ? "P2 Expert" : "P2 Novice", true); return;
        }
    };

    this.controlsStateReport = function(report) {
        //  Only Panel Controls are visible from outside
        report[controls.BLACK_WHITE] = (SWCHB & 0x08) === 0;
        report[controls.DIFFICULTY0] = (SWCHB & 0x40) !== 0;
        report[controls.DIFFICULTY1] = (SWCHB & 0x80) !== 0;
        report[controls.SELECT]      = (SWCHB & 0x02) === 0;
        report[controls.RESET]       = (SWCHB & 0x01) === 0;
    };


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            t:          timerCount,
            c:          currentTimerInterval,
            l:          lastSetTimerInterval,
            SA:         SWCHA,
            SAC:        SWACNT,
            SB:         SWCHB,
            SBC:        SWBCNT,
            IT:         INTIM,
            IS:         INSTAT,
            T1:         TIM1T,
            T8:         TIM8T,
            T6:         TIM64T,
            T2:         T1024T
        };
    };

    this.loadState = function(state) {
        timerCount           = state.t;
        currentTimerInterval = state.c;
        lastSetTimerInterval = state.l;
        // SWCHA           	 = state.SA;			// Do not load controls state
        SWACNT               = state.SAC;
        SWCHB                = state.SB;
        SWBCNT               = state.SBC;
        INTIM                = state.IT;
        INSTAT               = state.IS;
        TIM1T                = state.T1;
        TIM8T                = state.T8;
        TIM64T               = state.T6;
        T1024T               = state.T2;
    };


    // State Variables ----------------------------------------------

    this.debug = false;

    var bus;

    var timerCount = 1024;				// Start with the largest timer interval
    var currentTimerInterval = 1024;
    var lastSetTimerInterval = 1024;


    // Registers ----------------------------------------------------

    var SWCHA=      					// 11111111  Port A; input or output  (read or write)
        0xff;						    // All directions of both controllers OFF
    var SWACNT = 0;						// 11111111  Port A DDR, 0=input, 1=output
    var SWCHB = 						// 11..1.11  Port B; console switches (should be read only but unused bits can be written and read)
        0x0b;  						    // Reset OFF; Select OFF; B/W OFF; Difficult A/B OFF (Amateur)
    var SWBCNT = 0; 					// 11111111  Port B DDR (hard wired as input)
    var INTIM =   						// 11111111  Timer output (read only)
        (Math.random() * 256) | 0 ;     // Some random value. Games use this at startup to seed random number generation
    var INSTAT = 0;     	            // 11......  Timer Status (read only, undocumented)
    var TIM1T  = 0;  	    			// 11111111  set 1 clock interval (838 nsec/interval)
    var TIM8T  = 0;  					// 11111111  set 8 clock interval (6.7 usec/interval)
    var TIM64T = 0; 					// 11111111  set 64 clock interval (53.6 usec/interval)
    var T1024T = 0; 					// 11111111  set 1024 clock interval (858.2 usec/interval)


    // Constants  ----------------------------------------------------

    var ADDRESS_MASK = 0x0007;

};