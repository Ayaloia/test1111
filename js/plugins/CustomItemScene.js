(function () {
    Scene_Item.prototype.create = function () {
        Scene_ItemBase.prototype.create.call(this);
        this.createHelpWindow();
        this.createItemWindow();
        this.createActorWindow();
    };

    Scene_Item.prototype.createItemWindow = function () {
        var wy = this._helpWindow.height;
        var wh = Graphics.boxHeight - wy;

        this._itemWindow = new Window_ItemList(0, wy, Graphics.boxWidth, wh);
        this._itemWindow.setHelpWindow(this._helpWindow);
        this._itemWindow.setHandler('ok', this.onItemOk.bind(this));
        this._itemWindow.setHandler('cancel', this.onItemCancel.bind(this));
        this.addWindow(this._itemWindow);
        this.activateItemWindow();
        this._itemWindow.setCategory('item');
        this._itemWindow.selectLast();

    };

    Scene_Item.prototype.onItemCancel = function () {
        this._itemWindow.deselect();
        this.popScene();
    };


    Window_ItemList.prototype.drawItem = function (index) {
        var item = this._data[index];
        if (item) {
            var numberWidth = this.numberWidth();
            var rect = this.itemRect(index);
            rect.width -= this.textPadding();
            this.changePaintOpacity(this.isEnabled(item));
            this.drawItemName(item, rect.x, rect.y, rect.width - numberWidth);
            this.drawItemNumber(item, rect.x, rect.y, rect.width);
            this.changePaintOpacity(1);
        }
    };

    Window_ItemList.prototype.drawItemNumber = function (item, x, y, width) {
        if (this.needsNumber()) {
            this.drawText(':', x, y, width - this.numberWidth(), 'right');
            this.drawText($gameParty.numItems(item), x, y, width, 'right');
        }
    };

    Window_ItemList.prototype.numberWidth = function () {
        return this.textWidth($gameParty.maxItems().toString());
    };

})();