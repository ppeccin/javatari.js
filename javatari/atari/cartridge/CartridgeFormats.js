/**
 * Created by ppeccin on 15/01/2015.
 */

CartridgeFormats = {

    "4K": {
        name: "4K",
        desc: "4K Atari",
        priority: 101,
        tryFormat: function(rom) {
            if (rom.content.length < 8 || rom.content.length > 4096 || 4096 % rom.content.length != 0) return null;
            return this;
        },
        createCartridgeFromRom: function(rom) {
            return new Cartridge4K(rom, this);
        },
        createCartridgeFromSaveState: function(state) {
            var cart = new Cartridge4K(null, this);
            cart.loadState(state);
            return cart;
        }
    },

    "F8": {
        name: "F8",
        desc: "8K Atari (+RAM)",
        priority: 101,
        tryFormat: function(rom) {
            if (rom.content.length != 8192) return null;
            return this;
        },
        createCartridgeFromRom: function(rom) {
            return new CartridgeBankedByMaskedRange(rom, this, 0x0ff8, null, 128);
        },
        createCartridgeFromSaveState: function(state) {
            var cart = new CartridgeBankedByMaskedRange(null, this);
            cart.loadState(state);
            return cart;
        }
    },

    "F6": {
        name: "F6",
        desc: "16K Atari (+RAM)",
        priority: 101,
        tryFormat: function(rom) {
            if (rom.content.length != 16384) return null;
            return this;
        },
        createCartridgeFromRom: function(rom) {
            return new CartridgeBankedByMaskedRange(rom, this, 0x0ff6, null, 128);
        },
        createCartridgeFromSaveState: function(state) {
            var cart = new CartridgeBankedByMaskedRange(null, this);
            cart.loadState(state);
            return cart;
        }
    },

    "F4": {
        name: "F4",
        desc: "32K Atari (+RAM)",
        priority: 101,
        tryFormat: function(rom) {
            if (rom.content.length != 32768) return null;
            return this;
        },
        createCartridgeFromRom: function(rom) {
            return new CartridgeBankedByMaskedRange(rom, this, 0x0ff4, null, 128);
        },
        createCartridgeFromSaveState: function(state) {
            var cart = new CartridgeBankedByMaskedRange(null, this);
            cart.loadState(state);
            return cart;
        }
    }

};
