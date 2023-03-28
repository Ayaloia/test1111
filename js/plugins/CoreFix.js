//コマンドが選択されていない時(index が -1 の時)に
//↑キーを押した場合に一番下の選択肢が選ばれるように修正
Window_Command.prototype.cursorUp = function (wrap) {
    var index = this.index();
    var maxItems = this.maxItems();
    var maxCols = this.maxCols();
    if (index >= maxCols || (wrap && maxCols === 1)) {
        if (index < 0) {
            index = 0;
        }
        this.select((index - maxCols + maxItems) % maxItems);
    }
};

//フォロワーを使用しない為アップデートを無効に
Game_Follower.prototype.update = function () {
};