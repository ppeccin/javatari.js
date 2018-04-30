// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Implements the 8K + 2K "DPCa" (Pitfall2) format, enhanced version with TIA audio updates every DPC audio clock!

jt.Cartridge10K_DPCa = function(rom, format) {
"use strict";

    function init(self) {
        self.rom = rom;
        self.format = format;
        bytes = rom.content;        // uses the content of the ROM directly
        self.bytes = bytes;
    }

    this.powerOn = function() {
        audioClockStep = AUDIO_CLOCK_DEFAULT_STEP;
        audioClockCycles = 0;
    };

    this.connectBus = function(bus) {
        dpcAudioChannel = bus.getTia().getAudioOutput().getChannel0();
    };

    this.needsAudioClock = function() {
        return true;
    };

    this.read = function(address) {
        var maskedAddress = maskAddress(address);
        // Check for DPC register read
        if (maskedAddress <= 0x03f || (maskedAddress >= 0x800 && maskedAddress <= 0x83f))
            return readDPCRegister(maskedAddress & 0x00ff);
        // Always add the correct bank offset
        return bytes[bankAddressOffset + maskedAddress];	// ROM
    };

    this.write = function(address, val) {
        var maskedAddress = maskAddress(address);
        // Check for DPC register write
        if ((maskedAddress >= 0x040 && maskedAddress <= 0x07f) ||
            (maskedAddress >= 0x840 && maskedAddress <= 0x87f))
            writeDPCRegister(maskedAddress & 0x00ff, val);
    };

    this.audioClockPulse = function() {
        if (((audioClockCycles + audioClockStep) | 0) > (audioClockCycles | 0)) {
            // Actual integer clock
            for (var f = 5; f <= 7; f++) {
                if (!audioMode[f]) continue;
                fetcherPointer[f]--;
                if ((fetcherPointer[f] & 0x00ff) == 0xff)
                    setFetcherPointer(f, fetcherPointer[f] & 0xff00 | fetcherStart[f]);
                updateFetcherMask(f);
                if (!audioChanged) audioChanged = true;
            }
        }
        audioClockCycles += audioClockStep;
        if (!audioChanged) return;
        // Send a volume update directly to TIA Audio Channel 0
        updateAudioOutput();
        dpcAudioChannel.setVolume(audioOutput);
    };

    var maskAddress = function(address) {
        var maskedAddress = address & ADDRESS_MASK;
        // Check and perform bank-switch as necessary
        if (maskedAddress === 0xff8) bankAddressOffset = 0;
        else if (maskedAddress === 0xff9) bankAddressOffset = 4096;
        return maskedAddress;
    };

    var updateAudioOutput = function() {
        audioOutput = AUDIO_MIXED_OUTPUT[
        (audioMode[5] ? fetcherMask[5] & 0x04 : 0) |
        (audioMode[6] ? fetcherMask[6] & 0x02 : 0) |
        (audioMode[7] ? fetcherMask[7] & 0x01 : 0)];
        audioChanged = false;
    };

    // TODO Fix bug when reading register as normal fetcher while in audio mode
    var readDPCRegister = function(reg) {
        var res;
        // Random number
        if (reg >= 0x00 && reg <= 0x03) {
            clockRandomNumber();
            return randomNumber;
        }
        // Audio value (MOVAMT not supported)
        if (reg >= 0x04 && reg <= 0x07) {
            if (audioChanged) updateAudioOutput();
            return audioOutput;
        }
        // Fetcher unmasked value
        if (reg >= 0x08 && reg <= 0x0f) {
            res = bytes[DPC_ROM_END - fetcherPointer[reg - 0x08]];
            clockFetcher(reg - 0x08);
            return res;
        }
        // Fetcher masked value
        if (reg >= 0x10 && reg <= 0x17) {
            res = bytes[DPC_ROM_END - fetcherPointer[reg - 0x10]] & fetcherMask[reg - 0x10];
            clockFetcher(reg - 0x10);
            return res;
        }
        // Fetcher masked value, nibbles swapped
        if (reg >= 0x18 && reg <= 0x1f) {
            res = bytes[DPC_ROM_END - fetcherPointer[reg - 0x18]] & fetcherMask[reg - 0x18];
            clockFetcher(reg - 0x18);
            res = (res & 0x0f << 4) | (res & 0xf0 >>> 4);
            return res;
        }
        // Fetcher masked value, byte reversed
        if (reg >= 0x20 && reg <= 0x27) {
            res = bytes[DPC_ROM_END - fetcherPointer[reg - 0x20]] & fetcherMask[reg - 0x20];
            clockFetcher(reg - 0x20);
            res = (res & 0x01 << 7) |  (res & 0x02 << 5) |  (res & 0x04 << 3) |  (res & 0x08 << 1) |
                  (res & 0x10 >>> 1) | (res & 0x20 >>> 3) | (res & 0x40 >>> 5) | (res & 0x80 >> 7);
            return res;
        }
        // Fetcher masked value, byte rotated right
        if (reg >= 0x28 && reg <= 0x2f) {
            res = bytes[DPC_ROM_END - fetcherPointer[reg - 0x28]] & fetcherMask[reg - 0x28];
            clockFetcher(reg - 0x28);
            res = ((res >>> 1) | (res << 7)) & 0xff;
            return res;
        }
        // Fetcher masked value, byte rotated left
        if (reg >= 0x30 && reg <= 0x37) {
            res = bytes[DPC_ROM_END - fetcherPointer[reg - 0x30]] & fetcherMask[reg - 0x30];
            clockFetcher(reg - 0x30);
            res = ((res << 1) | ((res >> 7) & 0x01)) & 0xff;
            return res;
        }
        // Fetcher mask
        if (reg >= 0x38 && reg <= 0x3f) {
            return fetcherMask[reg - 0x38];
        }
        return 0;
    };

    var writeDPCRegister = function(reg, b) {
        // Fetchers Start
        if (reg >= 0x40 && reg <= 0x47) {
            var f = reg - 0x40;
            fetcherStart[f] = b;
            if ((fetcherPointer[f] & 0xff) === fetcherStart[f]) fetcherMask[f] = 0xff;
            return;
        }
        // Fetchers End
        if (reg >= 0x48 && reg <= 0x4f) {
            fetcherEnd[reg - 0x48] = b; fetcherMask[reg - 0x48] = 0x00; return;
        }
        // Fetchers Pointers LSB
        if (reg >= 0x50 && reg <= 0x57) {
            setFetcherPointer(reg - 0x50, (fetcherPointer[reg - 0x50] & 0xff00) | (b & 0xff)); return;			// LSB
        }
        // Fetchers 0-3 Pointers MSB
        if (reg >= 0x58 && reg <= 0x5b) {
            setFetcherPointer(reg - 0x58, (fetcherPointer[reg - 0x58] & 0x00ff) | ((b & (0x07)) << 8)); return;	// MSB bits 0-2
        }
        // Fetchers 4 Pointers MSB (Draw Line enable not supported)
        if (reg == 0x5c) {
            setFetcherPointer(4, (fetcherPointer[4] & 0x00ff) | ((b & (0x07)) << 8));							// MSB bits 0-2
            return;
        }
        // Fetchers 5-7 Pointers MSB and Audio Mode enable
        if (reg >= 0x5d && reg <= 0x5f) {
            setFetcherPointer(reg - 0x58, (fetcherPointer[reg - 0x58] & 0x00ff) + ((b & (0x07)) << 8));			// MSB bits 0-2
            audioMode[reg - 0x58] = ((b & 0x10) >>> 4);
            return;
        }
        // Draw Line MOVAMT value (not supported)
        if (reg >= 0x60 && reg <= 0x67) {
            return;
        }
        // 0x68 - 0x6f Not used
        // Random Number reset
        if (reg >= 0x70 && reg <= 0x77) {
            randomNumber = 0x00;
        }
        // 0x78 - 0x7f Not used
    };

    var setFetcherPointer = function(f, pointer) {
        fetcherPointer[f] = pointer;
    };

    var clockFetcher = function(f) {
        var newPointer = fetcherPointer[f] - 1;
        if (newPointer < 0 ) newPointer = 0x07ff;
        setFetcherPointer(f, newPointer);
        updateFetcherMask(f);
    };

    var updateFetcherMask = function(f) {
        var lsb = fetcherPointer[f] & 0xff;
        if (lsb == fetcherStart[f]) fetcherMask[f] = 0xff;
        else if (lsb == fetcherEnd[f]) fetcherMask[f] = 0x00;
    };

    var clockRandomNumber = function() {
        randomNumber = ((randomNumber << 1) |
            (~((randomNumber >> 7) ^ (randomNumber >> 5) ^
            (randomNumber >> 4) ^ (randomNumber >> 3)) & 0x01)) & 0xff;
        if (randomNumber === 0xff) randomNumber = 0;
    };


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: jt.Util.compressInt8BitArrayToStringBase64(bytes),
            bo: bankAddressOffset,
            rn: randomNumber,
            fp: jt.Util.compressInt8BitArrayToStringBase64(fetcherPointer),
            fs: jt.Util.compressInt8BitArrayToStringBase64(fetcherStart),
            fe: jt.Util.compressInt8BitArrayToStringBase64(fetcherEnd),
            fm: jt.Util.compressInt8BitArrayToStringBase64(fetcherMask),
            a:  jt.Util.compressInt8BitArrayToStringBase64(audioMode)
        };
    };

    this.loadState = function(state) {
        this.format = jt.CartridgeFormats[state.f];
        this.rom = jt.ROM.loadState(state.r);
        bytes = jt.Util.uncompressStringBase64ToInt8BitArray(state.b, bytes);
        this.bytes = bytes;
        bankAddressOffset = state.bo;
        randomNumber = state.rn;
        fetcherPointer = jt.Util.uncompressStringBase64ToInt8BitArray(state.fp, fetcherPointer);
        fetcherStart = jt.Util.uncompressStringBase64ToInt8BitArray(state.fs, fetcherStart);
        fetcherEnd = jt.Util.uncompressStringBase64ToInt8BitArray(state.fe, fetcherEnd);
        fetcherMask = jt.Util.uncompressStringBase64ToInt8BitArray(state.fm, fetcherMask);
        audioMode = jt.Util.uncompressStringBase64ToInt8BitArray(state.a, audioMode);
    };


    var AUDIO_MIXED_OUTPUT = [0x0, 0x5, 0x5, 0xa, 0x5, 0xa, 0xa, 0xf];
    // var AUDIO_MIXED_OUTPUT = [0x0, 0x4, 0x5, 0x9, 0x6, 0xa, 0xb, 0xf];   // Per specification

    var ADDRESS_MASK = 0x0fff;
    var AUDIO_CLOCK_DEFAULT_STEP = 0.62;
    var DPC_ROM_END = 8192 + 2048 - 1;

    var dpcAudioChannel;

    var bytes;
    var bankAddressOffset = 0;
    var randomNumber = 0;
    var fetcherPointer = jt.Util.arrayFill(new Array(8), 0);
    var fetcherStart =   jt.Util.arrayFill(new Array(8), 0);
    var fetcherEnd =     jt.Util.arrayFill(new Array(8), 0);
    var fetcherMask =    jt.Util.arrayFill(new Array(8), 0);
    var audioMode =      jt.Util.arrayFill(new Array(8), 0);
    var audioClockStep = AUDIO_CLOCK_DEFAULT_STEP;
    var audioClockCycles = 0;
    var audioChanged = true;
    var audioOutput = 0;


    if (rom) init(this);

};

jt.Cartridge10K_DPCa.prototype = jt.Cartridge.base;

jt.Cartridge10K_DPCa.recreateFromSaveState = function(state, prevCart) {
    var cart = prevCart || new jt.Cartridge10K_DPCa();
    cart.loadState(state);
    return cart;
};
