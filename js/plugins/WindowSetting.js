(function () {

    Window_Base.prototype.makeFontBigger = function() {
        if (this.contents.fontSize <= 90) {
            this.contents.fontSize += 10;
        }
    };
    
    Window_Base.prototype.makeFontSmaller = function() {
        if (this.contents.fontSize >= 20) {
            this.contents.fontSize -= 10;
        }
    };

    Window_Message.prototype.numVisibleRows = function () {
        return 3;
    };
    Window_Message.prototype.standardFontSize = function () {
        return 20;
    };
    Window_Message.prototype.windowWidth = function () {
        return 720;
    };
    Window_Message.prototype.windowHeight = function () {
        return 120
    };

    Window_Message.prototype.refreshDimmerBitmap = function() {
        if (this._dimmerSprite) {
            var bitmap = this._dimmerSprite.bitmap;
            var w = 800;
            var h = this.height;
            var m = this.padding;
            var c1 = this.dimColor1();
            var c2 = this.dimColor2();
            bitmap.resize(w, h);
            bitmap.gradientFillRect(0, 0, w, m, c2, c1, true);
            bitmap.fillRect(0, m, w, h - m * 2, c1);
            bitmap.gradientFillRect(0, h - m, w, m, c1, c2, true);
            this._dimmerSprite.setFrame(0, 0, w, h);
            this._dimmerSprite.move(-40,0);
        }
    };
    Window.prototype._refreshBack = function () {
        var m = this._margin;
        var w = this._width - m * 2;
        var h = this._height - m * 2;
        var bitmap = new Bitmap(w, h);

        this._windowBackSprite.bitmap = bitmap;
        this._windowBackSprite.setFrame(0, 0, w, h);
        this._windowBackSprite.move(m, m);

        if (w > 0 && h > 0 && this._windowskin) {
            var p = 96;
            bitmap.blt(this._windowskin, 0, 0, p, p, 0, 0, w, h);
            for (var y = 0; y < h; y += p) {
                for (var x = 0; x < w; x += p) {
                    bitmap.blt(this._windowskin, 0, p, p, p, x, y, p, p);
                }
            }
            var tone = this._colorTone;
            bitmap.adjustTone(tone[0], tone[1], tone[2]);
        }
        bitmap.clearRect(0, 0, 10, 10);
        bitmap.clearRect(w - 10, 0, 10, 10);
        bitmap.clearRect(0, h - 10, 10, 10);
        bitmap.clearRect(w - 10, h - 10, 10, 10);
    };

    Window_Options.prototype.volumeOffset = function () {
        return 10;
    };


})();
