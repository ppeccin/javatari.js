// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.VideoStandard = {
    NTSC: {
        name: "NTSC",
        desc: "NTSC 60Hz",
        totalWidth: 228,
        totalHeight: 262,
        defaultOriginYPct: 10.8,         		// Percentage of height
        defaultHeightPct: 85.2,
        targetFPS: 60,
        pulldowns: {
            60: { // Host at 60Hz
                standard: "NTSC",
                frequency: 60,
                divider: 1,
                cadence: [ 1 ],
                steps: 1
            },
            120: { // Host at 120Hz, clock / 2
                standard: "NTSC",
                frequency: 120,
                divider: 2,
                cadence: [ 1 ],
                steps: 1
            },
            "120s": { // Host at 120Hz
                standard: "NTSC",
                frequency: 120,
                divider: 1,
                cadence: [ 0, 1 ],
                steps: 2
            },
            50: { // Host at 50Hz
                standard: "NTSC",
                frequency: 50,
                divider: 1,
                cadence: [ 1, 1, 1, 1, 2 ],
                steps: 5
            },
            100: { // Host at 100Hz, clock / 2
                standard: "NTSC",
                frequency: 100,
                divider: 2,
                cadence: [ 1, 1, 1, 1, 2 ],
                steps: 5
            },
            "100s": { // Host at 100Hz
                standard: "NTSC",
                frequency: 100,
                divider: 1,
                cadence: [ 0, 1, 0, 1, 1, 0, 1, 0, 1, 1 ],
                steps: 10
            },
            TIMER: { // Host frequency not detected or V-synch disabled, use a normal interval timer
                standard: "NTSC",
                frequency: 62.5,
                divider: 1,
                cadence: [ 1 ],
                steps: 1
            }
        }
    },
    PAL: {
        name: "PAL",
        desc: "PAL 50Hz",
        totalWidth: 228,
        totalHeight: 312,
        defaultOriginYPct: 13.5,           		// Percentage of height
        defaultHeightPct: 77.3,
        targetFPS: 50,                          // Original is 50.22364217252396, or 50.3846153846153847
        pulldowns: {
            50: { // Host at 50Hz
                standard: "PAL",
                frequency: 50,
                divider: 1,
                cadence: [ 1 ],
                steps: 1
            },
            100: { // Host at 100Hz, clock / 2
                standard: "PAL",
                frequency: 100,
                divider: 2,
                cadence: [ 1 ],
                steps: 1
            },
            "100s": { // Host at 100Hz
                standard: "PAL",
                frequency: 100,
                divider: 1,
                cadence: [ 0, 1 ],
                steps: 2
            },
            60: { // Host at 60Hz
                standard: "PAL",
                frequency: 60,
                divider: 1,
                cadence: [ 0, 1, 1, 1, 1, 1 ],
                steps: 6
            },
            120: { // Host at 120Hz, clock / 2
                standard: "PAL",
                frequency: 120,
                divider: 2,
                cadence: [ 0, 1, 1, 1, 1, 1 ],
                steps: 6
            },
            "120s": { // Host at 120Hz
                standard: "PAL",
                frequency: 120,
                divider: 1,
                cadence: [ 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1 ],
                steps: 12
            },
            TIMER: { // Host frequency not detected or V-synch disabled, use a normal interval timer
                standard: "PAL",
                frequency: 50,
                divider: 1,
                cadence: [ 1 ],
                steps: 1
            }
        }
    }
};

