//=============================================================================
// addactorparameter.js
// ----------------------------------------------------------------------------
// (C) 2020 Shun / inazuma_soft
// ----------------------------------------------------------------------------

/*:ja
 * @plugindesc メイドさんゲー用に既存パラメータを変更するプラグイン
 * @author Shun
 *
 * 
 * @help 
 * 面倒なのでソースを直接書き換えること
 * 
 * アイテムの所持上限を変更
 * 
 */

(function () {
    Game_Party.prototype.maxItems = function (item) {
        return 999;
    };

})()
