/**
 * Created by ppeccin on 20/11/2014.
 */

/**
 * Implements the simple bank switching method by masked address range access (within Cart area)
 * Supports SuperChip extra RAM (ON/OFF/AUTO).
 * Used by several n * 4K bank formats with varying extra RAM sizes
 */
function CartridgeBankedByMaskedRange(rom, format, baseBankSwitchAddress, superChip, extraRAMSize) {

    function init(self) {
        self.rom = rom;
        self.format = format;

        bytes = rom.content;        // uses the content of the ROM directly
        var numBanks = bytes.length / BANK_SIZE;
        topBankSwitchAddress = baseBankSwitchAddress + numBanks - 1;
        // SuperChip mode. null = automatic mode
        if (superChip == null || superChip == undefined) {
            superChipMode = false;
            superChipAutoDetect = true;
        } else {
            superChipMode = !!superChip;
            superChipAutoDetect = false;
        }
        extraRAM = (superChip || superChip == null || superChip == undefined) ? bytes.slice(0, extraRAMSize) : null;
    }

    this.read = function(address) {
        var maskedAddress = maskAddress(address);
        // Check for SuperChip Extra RAM reads
        if (superChipMode && (maskedAddress >= extraRAMSize) && (maskedAddress < extraRAMSize * 2))
            return extraRAM[maskedAddress - extraRAMSize];
        else
        // Always add the correct offset to access bank selected
            return bytes[bankAddressOffset + maskedAddress];
    };

    this.write = function(address, b) {
        var maskedAddress = maskAddress(address);
        // Check for Extra RAM writes and then turn superChip mode on
        if (maskedAddress < extraRAMSize && (superChipMode || superChipAutoDetect)) {
            if (!superChipMode) superChipMode = true;
            extraRAM[maskedAddress] = b;
        }
    };

    var maskAddress = function(address) {
        var maskedAddress = address & ADDRESS_MASK;
        // Check and perform bank-switch as necessary
        if (maskedAddress >= baseBankSwitchAddress && maskedAddress <= topBankSwitchAddress)
            bankAddressOffset = BANK_SIZE * (maskedAddress - baseBankSwitchAddress);
        return maskedAddress;
    };


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            format: this.format.name,
            rom: this.rom.saveState(),
            bytes: bytes.slice(0),
            baseBankSwitchAddress: baseBankSwitchAddress,
            extraRAMSize: extraRAMSize,
            bankAddressOffset: bankAddressOffset,
            topBankSwitchAddress: topBankSwitchAddress,
            superChipMode: superChipMode,
            superChipAutoDetect: superChipAutoDetect,
            extraRAM: extraRAM && extraRAM.slice(0)
        };
    };

    this.loadState = function(state) {
        this.format = CartridgeFormats[state.format];
        this.rom = ROM.loadState(state.rom);
        bytes = state.bytes;
        bankAddressOffset =  state.bankAddressOffset;
        baseBankSwitchAddress = state.baseBankSwitchAddress;
        extraRAMSize = state.extraRAMSize;
        topBankSwitchAddress =  state.topBankSwitchAddress;
        superChipMode =  state.superChipMode;
        superChipAutoDetect =  state.superChipAutoDetect;
        extraRAM = state.extraRAM;
    };


    var bytes;

    var bankAddressOffset = 0;
    var topBankSwitchAddress;

    var superChipMode = false;
    var superChipAutoDetect;
    var extraRAM;


    var ADDRESS_MASK = 0x0fff;
    var BANK_SIZE = 4096;


    if (rom) init(this);

}

CartridgeBankedByMaskedRange.prototype = new Cartridge();

CartridgeBankedByMaskedRange.createFromSaveState = function(state) {
    var cart = new CartridgeBankedByMaskedRange();
    cart.loadState(state);
    return cart;
};
