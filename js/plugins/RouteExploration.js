//=============================================================================
// RouteExploration.js
// ----------------------------------------------------------------------------
// (C) 2021 Shun / inazuma_soft
// ----------------------------------------------------------------------------

/*:ja
 * @plugindesc A*アルゴリズムの実装練習
 * @author Shun / inazumasoft
 *
 * @help 
 * A*アルゴリズムの理解を深めるために
 * 既存の下記メソッドを再実装したプラグイン
 * CharacterBase.prototype.findDirectionTo
 * 
 * 
 *
 * 参考URL
 * https://yttm-work.jp/algorithm/algorithm_0015.html
 */

(function () {

    class ExplorationNode {
        constructor(mapId, x, y) {
            this._x = parseInt(x);
            this._y = parseInt(y);
            /**
             * @type {ExplorationNode}
             */
            this._parent = null;
            this._heuristicCost = 0;
            this._moveCost = $globalMap.map(mapId).regionId(this._x, this._y) || Infinity;
            this._costToStart = 0;
        }
        get x() {
            return this._x;
        }
        get y() {
            return this._y;
        }
        get parent() {
            return this._parent;
        }
        set parent(value) {
            this._parent = value;
        }
        get totalCost() {
            return this._heuristicCost + this._costToStart;
        }
        get heuristicCost() {
            return this._heuristicCost;
        }
        get moveCost() {
            return this._moveCost;
        }
        get costToStart() {
            return this._costToStart;
        }
        set costToStart(value) {
            this._costToStart += value;
        }
        /**
         * @param {ExplorationNode} node 
         */
        equal(node) {
            return this._x === node.x && this._y === node.y;
        }
        setGoal(node) {
            this._heuristicCost = this.distance(this._x, this._y, node.x, node.y);
        }
        closer(node) {
            return this._heuristicCost < node.heuristicCost ? this : node;
        }
        //ループ非対応
        distance(x1, y1, x2, y2) {
            return Math.abs(x1 - x2) + Math.abs(y1 - y2);
        };

    }

    class RouteExploration {
        constructor(mapId) {
            this._mapId = mapId;
            /**
             * @type {Array<ExplorationNode>}
             */
            this._openList = [];
            /**
             * @type {Array<ExplorationNode>}
             */
            this._closedList = [];
            /**
            * @type {Array<ExplorationNode>}
            */
            this._route = [];
            /**
             * @type {ExplorationNode}
             */
            this._startNode = null;
            this._goalNode = null;
        }

        node(x, y) {
            if (x < 0) {
                return;
            }
            if (y < 0) {
                return;
            }
            const newNode = new ExplorationNode(this._mapId, x, y);
            newNode.setGoal(this._goalNode);
            return newNode;
        }

        adjacentNodes(node) {
            const adjNodes = [];
            const adjPos = [
                { x: node.x, y: node.y + 1 },
                { x: node.x - 1, y: node.y },
                { x: node.x + 1, y: node.y },
                { x: node.x, y: node.y - 1 }
            ]
            for (let i = 0; i < 4; i++) {
                const adjNode = this.node(adjPos[i].x, adjPos[i].y);
                adjNodes.push(adjNode);
            }
            return adjNodes.filter(n => n);
        }

        nextNode() {
            return this._route[0];
        }

        shift() {
            return this._route.shift();
        }

        /**
         * 
         * @param {ExplorationNode} startNode 
         * @param {ExplorationNode} goalNode 
         */
        start(start, goal) {
            this._startNode = start;
            this._goalNode = goal;

            this._openList.push(this._startNode);

            let closerNode = this._startNode;

            while (this._openList.length > 0) {
                const currentNode = this.minimumCostNode();

                if (this._goalNode.equal(currentNode)) {
                    break;
                }

                closerNode = closerNode.closer(currentNode);
                this.addAdjacentNodeToOpenList(currentNode);
            }

            if (this.isNotFound()) {
                this._route.unshift(closerNode);
            }
            else {
                this._route.unshift(this._closedList.pop());
            }

            if (this._route[0].equal(this._startNode)) {
                return;
            }

            while (!this._route[0].parent.equal(this._startNode)) {
                this._route.unshift(this._route[0].parent);
            }
        }

        /**
         * @param {ExplorationNode} newNode 
         */
        minimumCostNode() {
            const minNode = this._openList.shift();
            this._closedList.push(minNode);
            return minNode;
        }

        /**
         * @param {ExplorationNode} newNode 
         */
        updateCloseList(newNode) {
            const oldNode = this._closedList.find(
                node => node.equal(newNode)
            );
            if (newNode.totalCost < oldNode.totalCost) {
                const index = this._closedList.indexOf(oldNode);
                this._closedList.splice(index, 1);
                this.addNodeToOpenList(newNode);
            }
        }

        /**
         * @param {ExplorationNode} newNode 
         */
        updateOpenList(newNode) {
            const oldNode = this._openList.find(
                node => node.equal(newNode)
            );
            if (newNode.totalCost < oldNode.totalCost) {
                const index = this._openList.indexOf(oldNode);
                this._openList.splice(index, 1);
                this.addNodeToOpenList(newNode);
            }
        }

        //オープンリストの最適な位置へ挿入する
        addNodeToOpenList(node) {
            let i;
            for (i = 0; i < this._openList.length; i++) {
                if (node.totalCost <= this._openList[i].totalCost) {
                    break;
                }
            }
            this._openList.splice(i, 0, node);
        }

        //未探査の隣接ノードをオープンリストに追加する
        /**
         * @param {ExplorationNode} curNode 
         */
        addAdjacentNodeToOpenList(curNode) {
            const adjNodes = this.adjacentNodes(curNode);
            for (let i = 0; i < adjNodes.length; i++) {
                adjNodes[i].costToStart = adjNodes[i].moveCost + curNode.costToStart;
                if (adjNodes[i].totalCost === Infinity) {
                    continue;
                }
                adjNodes[i].parent = curNode;
                if (this.isInCloseList(adjNodes[i])) {
                    this.updateCloseList(adjNodes[i]);
                    continue;
                }
                if (this.isInOpenList(adjNodes[i])) {
                    this.updateOpenList(adjNodes[i]);
                    continue;
                }
                this.addNodeToOpenList(adjNodes[i]);
            }
        }

        isInCloseList(node) {
            return !!this._closedList.find(closed => closed.equal(node));
        }

        isInOpenList(node) {
            return !!this._openList.find(closed => closed.equal(node));
        }

        isNotFound() {
            return this._openList.length === 0;
        }

    }

    ClassRegister(ExplorationNode)
    ClassRegister(RouteExploration);

})();