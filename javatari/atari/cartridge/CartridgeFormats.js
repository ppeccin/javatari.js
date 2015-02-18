/**
 * Created by ppeccin on 15/01/2015.
 */

CartridgeFormats = {

    "4K": {
        name: "4K",
        desc: "4K Atari",
        priority: 101,
        tryFormat: function (rom) {
            if (rom.content.length >= 8 && rom.content.length <= 4096 && 4096 % rom.content.length === 0) return this;
        },
        createCartridgeFromRom: function (rom) {
            return new Cartridge4K(rom, this);
        },
        createCartridgeFromSaveState: function (state) {
            return Cartridge4K.createFromSaveState(state);
        }
    },

    "F8": {
        name: "F8",
        desc: "8K Atari (+RAM)",
        priority: 101,
        tryFormat: function(rom) {
            if (rom.content.length === 8192) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new CartridgeBankedByMaskedRange(rom, this, 0x0ff8, null, 128);
        },
        createCartridgeFromSaveState: function(state) {
            return CartridgeBankedByMaskedRange.createFromSaveState(state);
        }
    },

    "F6": {
        name: "F6",
        desc: "16K Atari (+RAM)",
        priority: 101,
        tryFormat: function(rom) {
            if (rom.content.length === 16384) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new CartridgeBankedByMaskedRange(rom, this, 0x0ff6, null, 128);
        },
        createCartridgeFromSaveState: function(state) {
            return CartridgeBankedByMaskedRange.createFromSaveState(state);
        }
    },

    "F4": {
        name: "F4",
        desc: "32K Atari (+RAM)",
        priority: 101,
        tryFormat: function(rom) {
            if (rom.content.length === 32768) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new CartridgeBankedByMaskedRange(rom, this, 0x0ff4, null, 128);
        },
        createCartridgeFromSaveState: function(state) {
            return CartridgeBankedByMaskedRange.createFromSaveState(state);
        }
    }

};
