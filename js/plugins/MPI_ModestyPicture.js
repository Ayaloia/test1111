//===========================================================================
// MPI_ModestyPicture.js
//===========================================================================

/*:
 * @plugindesc プレイヤーと重なったピクチャを半透明表示にします。
 * @author 奏ねこま（おとぶき ねこま）
 *
 * @param 半透明にするピクチャ番号
 * @desc プレイヤーと重なったときに半透明にするピクチャの番号を指定してください。カンマ区切りで複数指定できます。
 * @default 
 *
 * @param 重なり判定-A
 * @desc 重なり判定-Aを有効にする場合は true を、無効にする場合は false を指定してください。
 * @default true
 * 
 * @param 重なり判定-B
 * @desc 重なり判定-Bを有効にする場合は true を、無効にする場合は false を指定してください。
 * @default true
 * 
 * @param 重なり判定-C
 * @desc 重なり判定-Cを有効にする場合は true を、無効にする場合は false を指定してください。
 * @default true
 * 
 * @param 判定周期
 * @desc 重なり判定を何フレーム毎に行うかを指定してください。
 * @default 4
 * 
 * @param 不透明度
 * @desc プレイヤーと重なったときの不透明度を指定してください。[0-255]
 * @default 64
 *
 * @param 変化量
 * @desc 半透明になる際の不透明度の変化量を指定してください。値が大きいほど早く半透明になります。
 * @default 16
 *
 * @help
 * [ 概要 ] ...
 *  指定した番号のピクチャがプレイヤーと重なったとき、半透明表示にします。
 *
 * [ 重なり判定 ] ...
 *  重なり判定ｰA：プレイヤー画像の四隅の座標を判定します。
 *  重なり判定ｰB：プレイヤー画像の上下左右の座標を判定します。
 *  重なり判定ｰC：プレイヤー画像の中心の座標を判定します。
 *
 *   ■重なり判定ｰA  ■重なり判定-B  ■重なり判定-C
 *   ●○○○○○●  ○○○●○○○  ○○○○○○○
 *   ○○○○○○○  ○○○○○○○  ○○○○○○○
 *   ○○○○○○○  ●○○○○○●  ○○○●○○○
 *   ○○○○○○○  ○○○○○○○  ○○○○○○○
 *   ●○○○○○●  ○○○●○○○  ○○○○○○○
 * 
 * [ プラグインコマンド ] ...
 *  プラグインコマンドはありません。
 *
 * [ 利用規約 ] ................................................................
 *  ・本プラグインの利用は、RPGツクールMV/RPGMakerMVの正規ユーザーに限られます。
 *  ・商用、非商用、有償、無償、一般向け、成人向けを問わず、利用可能です。
 *  ・利用の際、連絡や報告は必要ありません。また、製作者名の記載等も不要です。
 *  ・プラグインを導入した作品に同梱する形以外での再配布、転載はご遠慮ください。
 *  ・不具合対応以外のサポートやリクエストは、基本的に受け付けておりません。
 *  ・本プラグインにより生じたいかなる問題についても、一切の責任を負いかねます。
 * [ 改訂履歴 ] ................................................................
 *   Version 1.01  2017/01/20  処理の軽量化
 *                             重なり判定条件をプラグインパラメータ化
 *                             茂み属性のタイル上で半透明にならない問題を修正
 *   Version 1.00  2017/01/11  First edition.
 * -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-
 *  Web Site: http://makonet.sakura.ne.jp/rpg_tkool/
 *  Twitter : https://twitter.com/koma_neko
 *  Copylight (c) 2017 Nekoma Otobuki
 */

var Imported = Imported || {};
Imported.MPI_ModestyPicture = true;

var Makonet = Makonet || {};
Makonet.MPC = {};

(function(){
    'use strict';

    var MPD        = Makonet.MPC;
    MPD.product    = 'MPI_ModestyPicture';
    MPD.parameters = PluginManager.parameters(MPD.product);

    MPD.picture =  MPD.parameters['半透明にするピクチャ番号'].trim().split(/ *, */).map(function(value){ return +value });
    MPD.check1  =  MPD.parameters['重なり判定-A'].trim().toLowerCase() === 'true';
    MPD.check2  =  MPD.parameters['重なり判定-B'].trim().toLowerCase() === 'true';
    MPD.check3  =  MPD.parameters['重なり判定-C'].trim().toLowerCase() === 'true';
    MPD.cycle   = +MPD.parameters['判定周期'];
    MPD.opacity = +MPD.parameters['不透明度'];
    MPD.step    = +MPD.parameters['変化量'];

    var _ = MPD.product;

    //==============================================================================
    // Game_Player
    //==============================================================================

    Object.defineProperty(Game_Player.prototype, _, {
        get: function(){ return this[`$${_}`] = this[`$${_}`] || { left: 0, top: 0, right: 0, bottom: 0 }; },
        set: function(value) { this[`$${_}`] = value; },
        configurable: true
    });

    //==============================================================================
    // Sprite_Character
    //==============================================================================

    (function(o, p) {
        var f = o[p]; o[p] = function(){
            f.apply(this, arguments);
            if (this._character === $gamePlayer) {
                var gp = $gamePlayer[_];
                gp.left   = parseInt(this.x - this.anchor.x * this.patternWidth());
                gp.top    = parseInt(this.y - this.anchor.y * this.patternHeight());
                gp.right  = gp.left + this.patternWidth();
                gp.bottom = gp.top  + this.patternHeight();
            }
        };
    }(Sprite_Character.prototype, 'updateCharacterFrame'));

    //==============================================================================
    // Sprite_Picture
    //==============================================================================

    Object.defineProperty(Sprite_Picture.prototype, _, {
        get: function(){ return this[`$${_}`] = this[`$${_}`] || { modesty: false, opacity: 255, overlap: false }; },
        set: function(value) { this[`$${_}`] = value; },
        configurable: true
    });

    (function(o, p) {
        var f = o[p]; o[p] = function(pictureId){
            f.apply(this, arguments);
            this[_].modesty = (MPD.picture.indexOf(pictureId) >= 0);
        };
    }(Sprite_Picture.prototype, 'initialize'));

    (function(o, p) {
        var f = o[p]; o[p] = function(){
            f.apply(this, arguments);
            var this_ = this[_];
            if (this_.modesty && !!this.bitmap) {
                if (Graphics.frameCount % MPD.cycle === 0) {
                    var pl = parseInt(this.x - this.anchor.x * this._realFrame.width);
                    var pt = parseInt(this.y - this.anchor.y * this._realFrame.height);
                    var pr = pl + this._realFrame.width;
                    var pb = pt + this._realFrame.height;
                    var gp = $gamePlayer[_];
                    var bl = (gp.left   === gp.left.clamp(pl, pr));
                    var bt = (gp.top    === gp.top.clamp(pt, pb));
                    var br = (gp.right  === gp.right.clamp(pl, pr));
                    var bb = (gp.bottom === gp.bottom.clamp(pt, pb));
                    this_.overlap = false;
                    if ((bl && bt) || (bl && bb) || (br && bt) || (br && bb)) {
                        var cl = gp.left   - pl;
                        var ct = gp.top    - pt;
                        var cr = gp.right  - pl;
                        var cb = gp.bottom - pt;
                        var cx = parseInt((cl + cr) / 2);
                        var cy = parseInt((ct + cb) / 2);
                        if ((MPD.check1 && ((this.bitmap.getAlphaPixel(cl, ct) > 0) ||
                                            (this.bitmap.getAlphaPixel(cl, cb) > 0) ||
                                            (this.bitmap.getAlphaPixel(cr, ct) > 0) ||
                                            (this.bitmap.getAlphaPixel(cr, cb) > 0))) ||
                            (MPD.check2 && ((this.bitmap.getAlphaPixel(cx, ct) > 0) ||
                                            (this.bitmap.getAlphaPixel(cx, cb) > 0) ||
                                            (this.bitmap.getAlphaPixel(cl, cy) > 0) ||
                                            (this.bitmap.getAlphaPixel(cr, cy) > 0))) ||
                            (MPD.check3 &&  (this.bitmap.getAlphaPixel(cx, cy) > 0))) {
                            this_.overlap = true;
                        }
                    }
                }
                this_.opacity += (MPD.step * (this_.overlap ? -1 : 1));
                this_.opacity = this_.opacity.clamp(MPD.opacity, this.picture().opacity());
                this.opacity = this_.opacity;
            }
        };
    }(Sprite_Picture.prototype, 'updateOther'));
}());
