// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Implements the 64K "X07" AtariAge format

jt.Cartridge64K_X07 = function(rom, format) {
"use strict";

    function init(self) {
        self.rom = rom;
        self.format = format;
        bytes = rom.content;        // uses the content of the ROM directly
        self.bytes = bytes;
    }

    this.read = function(address) {
        // Always add the correct offset to access bank selected
        return bytes[bankAddressOffset + (address & ADDRESS_MASK)];
    };

    this.performBankSwitchOnMonitoredAccess = function(address) {
        if ((address & 0x180f) === 0x080d)		                                            // Method 1
            bankAddressOffset = ((address & 0x00f0) >> 4) * BANK_SIZE;	                    // Pick bank from bits 7-4
        else if (bankAddressOffset >= BANK_14_ADDRESS && (address & 0x1880) === 0x0000) 	// Method 2, only if at bank 14 or 15
            bankAddressOffset = ((address & 0x0040) === 0 ? 14 : 15) * BANK_SIZE;	        // Pick bank 14 or 15 from bit 6
    };


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: jt.Util.compressInt8BitArrayToStringBase64(bytes),
            bo: bankAddressOffset
        };
    };

    this.loadState = function(state) {
        this.format = jt.CartridgeFormats[state.f];
        this.rom = jt.ROM.loadState(state.r);
        bytes = jt.Util.uncompressStringBase64ToInt8BitArray(state.b, bytes);
        this.bytes = bytes;
        bankAddressOffset = state.bo;
    };


    var bytes;
    var bankAddressOffset = 0;

    var ADDRESS_MASK = 0x0fff;
    var BANK_SIZE = 4096;
    var BANK_14_ADDRESS = 14 * BANK_SIZE;


    if (rom) init(this);

};

jt.Cartridge64K_X07.prototype = jt.CartridgeBankedByBusMonitoring.base;

jt.Cartridge64K_X07.recreateFromSaveState = function(state, prevCart) {
    var cart = prevCart || new jt.Cartridge64K_X07();
    cart.loadState(state);
    return cart;
};



