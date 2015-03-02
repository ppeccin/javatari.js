/**
 * Created by ppeccin on 20/11/2014.
 */

// Implements the 8K-512K "Enhanced 3F" Tigervision format

function Cartridge8K_512K_3F(rom, format) {

    function init(self) {
        self.rom = rom;
        self.format = format;
        bytes = rom.content;        // uses the content of the ROM directly
        selectableSliceMaxBank = (bytes.length - BANK_SIZE) / BANK_SIZE - 1;
        fixedSliceAddressOffset = bytes.length - BANK_SIZE * 2;
    }

    this.read = function(address) {
        var maskedAddress = maskAddress(address);
        if (maskedAddress >= FIXED_SLICE_START_ADDRESS)			// Fixed slice
            return bytes[fixedSliceAddressOffset + maskedAddress];
        else
            return bytes[bankAddressOffset + maskedAddress];	// Selectable slice
    };

    this.monitorBusBeforeWrite = function(address, data) {
        // Perform bank switching as needed
        if (address <= 0x003f) {
            var bank = data & 0xff;		// unsigned
            if (bank <= selectableSliceMaxBank)
                bankAddressOffset = bank * BANK_SIZE;
        }
    };

    var maskAddress = function(address) {
        return address & ADDRESS_MASK;
    };


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: btoa(Util.uInt8ArrayToByteString(bytes)),
            bo: bankAddressOffset,
            sm: selectableSliceMaxBank,
            fo: fixedSliceAddressOffset
        };
    };

    this.loadState = function(state) {
        this.format = CartridgeFormats[state.f];
        this.rom = ROM.loadState(state.r);
        bytes = Util.byteStringToUInt8Array(atob(state.b));
        bankAddressOffset = state.bo;
        selectableSliceMaxBank = state.sm;
        fixedSliceAddressOffset = state.fo;
    };


    var bytes;

    var bankAddressOffset = 0;
    var selectableSliceMaxBank;
    var fixedSliceAddressOffset;		    // This slice is fixed at the last bank

    var ADDRESS_MASK = 0x0fff;
    var BANK_SIZE = 2048;
    var FIXED_SLICE_START_ADDRESS = 2048;


    if (rom) init(this);

}

Cartridge8K_512K_3F.prototype = CartridgeBankedByBusMonitoring.base;

Cartridge8K_512K_3F.createFromSaveState = function(state) {
    var cart = new Cartridge8K_512K_3F();
    cart.loadState(state);
    return cart;
};
