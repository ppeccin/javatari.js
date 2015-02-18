/**
 * Created by ppeccin on 30/11/2014.
 */

function TiaAudioChannel() {

    this.nextSample = function() {				// Range 0 - 1
        if (--dividerCountdown <= 0) {
            dividerCountdown += divider;
            currentSample = nextSampleForControl();
        }

        return currentSample === 1 ? volume : 0;
    };

    this.setVolume = function(newVolume) {
        volume = newVolume / MAX_VOLUME;
    };

    this.setDivider = function(newDivider) {
        if (divider === newDivider) return;

        dividerCountdown = (dividerCountdown / divider) * newDivider;
        divider = newDivider;
    };

    this.setControl = function(newControl) {
        if (control === newControl) return;

        control = newControl;

        if (newControl === 0x00 || newControl === 0x0b)
            nextSampleForControl = nextSilence;						// Silence  ("set to 1" per specification)
        else if (newControl === 0x01)
            nextSampleForControl = nextPoly4;						// 4 bit poly
        else if (newControl === 0x02)
            nextSampleForControl = nextDiv15Poly4;	                // div 15 > 4 bit poly
        else if (newControl === 0x03)
            nextSampleForControl = nextPoly5Poly4;                   // 5 bit poly > 4 bit poly
        else if (newControl === 0x04 || newControl === 0x05)
            nextSampleForControl = nextTone2;						// div 2 pure tone
        else if (newControl === 0x06 || newControl === 0x0a)
            nextSampleForControl = nextTone31;						// div 31 pure tone (18 high, 13 low)
        else if (newControl === 0x07 || newControl === 0x09)
            nextSampleForControl = nextPoly5;						// 5 bit poly
        else if (newControl === 0x08)
            nextSampleForControl = nextPoly9;						// 9 bit poly
        else if (newControl === 0x0c || newControl === 0x0d)
            nextSampleForControl = nextTone6;						// div 6 pure tone (3 high, 3 low)
        else if (newControl === 0x0e)
            nextSampleForControl = nextDiv93;                        // div 93 pure tone	(31 tone each 3)
        else if (newControl === 0x0f)
            nextSampleForControl = nextPoly5Div6;				    // 5 bit poly div 6 (poly 5 each 3)
        else
            nextSampleForControl = nextSilence;						// default
    };

    var nextSilence = function() {
        return 1;
    };

    var currentPoly4 = function() {
        return poly4 & 0x01;
    };

    var nextPoly4 = function() {
        var carry = poly4 & 0x01;					// bit 0
        var push = ((poly4 >> 1) ^ carry) & 0x01;	// bit 1 XOR bit 0
        poly4 = poly4 >>> 1;						// shift right
        if (push === 0)								// set bit 3 = push
            poly4 &= 0x07;
        else
            poly4 |= 0x08;
        return carry;
    };

    var nextPoly5 = function() {
        var carry = poly5 & 0x01;					// bit 0
        var push = ((poly5 >> 2) ^ carry) & 0x01;	// bit 2 XOR bit 0
        poly5 = poly5 >>> 1;						// shift right
        if (push === 0)								// set bit 4 = push
            poly5 &= 0x0f;
        else
            poly5 |= 0x10;
        return carry;
    };

    var nextPoly9 = function() {
        var carry = poly9 & 0x01;					// bit 0
        var push = ((poly9 >> 4) ^ carry) & 0x01;	// bit 4 XOR bit 0
        poly9 = poly9 >>> 1;						// shift right
        if (push === 0)								// set bit 8 = push
            poly9 &= 0x0ff;
        else
            poly9 |= 0x100;
        return carry;
    };

    var nextTone2 = function() {
        if (divider === 1)                          // Divider 1 and Tone2 should never produce sound
            return 1;
        else
            return tone2 = tone2 ? 0 : 1;
    };

    var currentTone6 = function() {
        return tone6;
    };

    var nextTone6 = function() {
        if (--tone6Countdown === 0) {
            tone6Countdown = 3;
            tone6 = tone6 === 0 ? 1 : 0;
        }
        return tone6;
    };

    var currentTone31 = function() {
        return TONE31_STREAM[tone31Count];
    };

    var nextTone31 = function() {
        if (++tone31Count === 31)
            tone31Count = 0;
        return TONE31_STREAM[tone31Count];
    };

    var nextDiv15Poly4 = function() {
        return currentTone31() !== nextTone31() ? nextPoly4() : currentPoly4();
    };

    var nextPoly5Poly4 = function() {
        return nextPoly5() === 1 ? nextPoly4() : currentPoly4();
    };

    var nextDiv93 = function() {
        return currentTone31() != nextTone31() ? nextTone6() : currentTone6();
    };

    var nextPoly5Div6 = function() {
        return nextPoly5() === 1 ? nextTone6() : currentTone6();
    };

    var nextSampleForControl = nextSilence;


    var volume = 0;					// 0 - 1
    var control = 0;				// 0-f
    var divider = 1;				// Changes to dividers will only be reflected at the next countdown cycle
    var dividerCountdown = 1;

    var currentSample = 0;

    var poly4 = 0x0f;
    var poly5 = 0x1f;
    var poly9 = 0x1ff;

    var tone2 = 1;

    var tone6 = 1;
    var tone6Countdown = 3;

    var tone31Count = 30;
    var TONE31_STREAM = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];


    var MAX_VOLUME = 15;

}
