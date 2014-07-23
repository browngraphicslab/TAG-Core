
var PolygonTileFloodFiller = {

    floodFill: function (gridWidth, gridHeight, polygon, startingTile) {
        this.cachedCrossings = {};
        if (startingTile == null) {
            if (polygon.length == 0) {
                return [];
            }

            startingTile = this.calculateStartingTile(gridWidth, gridHeight, polygon);
        }

        var tileQueue = [startingTile];
        var tilesEnqueued = new Array(gridWidth * gridHeight);
        tilesEnqueued[startingTile.y * gridWidth + startingTile.x] = true;
        
        var result = [],
            neighbors = new Array(4),
            neighbor, tile, i, len, enqueueIndex;

        while (tileQueue.length > 0) {
            tile = tileQueue.shift();
            result.push(tile);

            /* Experiment to see which is more common
            var tileCenterInPolygon = this.tileCenterInPolygon(tile, polygon);
            console.count('tileCenterInPolygon:' + tileCenterInPolygon);
            var gridCrossesPolygon = this.gridCrossesPolygon(tile, polygon);
            console.count('gridCrossesPolygon:' + gridCrossesPolygon);
            */

            // NOTE: following checks are both very expensive, but gridCrossesPolygon
            // tends to be true more often so it should go first
            if (this.gridCrossesPolygon(tile, polygon) || this.tileCenterInPolygon(tile, polygon)) {

                neighbors[0] = this.getLeftNeighbor(tile);
                neighbors[1] = this.getRightNeighbor(tile);
                neighbors[2] = this.getTopNeighbor(tile);
                neighbors[3] = this.getBottomNeighbor(tile);

                for (i = 0; i < 4; i++) {
                    neighbor = neighbors[i];
                    enqueueIndex = neighbor.y * gridWidth + neighbor.x;
                    if (!tilesEnqueued[enqueueIndex] && this.isValidTile(neighbor, gridWidth, gridHeight)) {
                        tileQueue.push(neighbor);
                        tilesEnqueued[enqueueIndex] = true;
                    }
                }
            }
        }

        this.cachedCrossings = null;

        return result;
    },

    calculateStartingTile: function (gridWidth, gridHeight, polygon) {
        var center = {x: 0, y: 0};
        for (var i = 0; i < polygon.length; i++) {
            center.x += polygon[i].x;
            center.y += polygon[i].y;
        }
        center.x /= polygon.length;
        center.y /= polygon.length;

        center.x = Math.floor(center.x);
        center.y = Math.floor(center.y);

        center.x = Math.max(0, center.x);
        center.y = Math.max(0, center.y);

        center.x = Math.min(gridWidth - 1, center.x);
        center.y = Math.min(gridHeight - 1, center.y);

        return center;
    },

    getLeftNeighbor: function (tile) {
        return {x: tile.x - 1, y: tile.y};
    },

    getRightNeighbor: function (tile) {
        return {x: tile.x + 1, y: tile.y};
    },

    getTopNeighbor: function (tile) {
        return {x: tile.x, y: tile.y - 1};
    },

    getBottomNeighbor: function (tile) {
        return {x: tile.x, y: tile.y + 1};
    },

    tileCenterInPolygon: function (tile, polygon) {
        //check center of tile
        return this.pointInPolygon(tile.x + 0.5, tile.y + 0.5, polygon);
    },

    isValidTile: function (tile, gridWidth, gridHeight) {
        if (tile.x < 0 || tile.y < 0 || tile.x >= gridWidth || tile.y >= gridHeight || isNaN(tile.x) || isNaN(tile.y) ) {
            return false;
        }
        return true;
    },

    gridCrossesPolygon: function (upperLeftPoint, polygon) {

        // origin at upper left point
        var x = upperLeftPoint.x,
            y = upperLeftPoint.y,
            rightX = x + 1,
            bottomY = y + 1;

        // upper left vs upper right
        if (this.countCrossings(x, y, polygon, false) !== this.countCrossings(rightX, y, polygon, false)) {
            return true;
        }
        // lower left vs lower right 
        else if (this.countCrossings(x, bottomY, polygon, false) !== this.countCrossings(rightX, bottomY, polygon, false)) {
            return true;
        }
        // upper left vs lower left
        else if (this.countCrossings(x, y, polygon, true) !== this.countCrossings(x, bottomY, polygon, true)) {
            return true;
        }
        // upper right vs lower right
        else if (this.countCrossings(rightX, y, polygon, true) !== this.countCrossings(rightX, bottomY, polygon, true)) {
            return true;
        }
        
        return false;
    },

    //Use crossing test.  If a ray going out from the point crosses an odd number of polygon line segments, then it's inside the polygon.  Else it's outside.
    //Logic is simple if we cast a ray to the right (positive x) direction
    //Short description: http://erich.realtimerendering.com/ptinpoly/
    //Longer description: Graphics Gems IV, Edited by Paul S Heckbert 1994, page 26
    pointInPolygon: function (x, y, polygon) {
        var crossCount = this.countCrossings(x, y, polygon, false);

        //If the ray crossed an odd number of segments, then the point is inside the polygon.
        return (crossCount % 2 === 1);
    },

    cachedCrossings: {},

    // cache temporary arrays used for adjusted points for better perf. 
    _countCrossingsAdjustedX: [],
    _countCrossingsAdjustedY: [],

    countCrossings: function (x, y, polygon, castRayDown) {
        
        // check cache first        
        var hash = x + ',' + y + ((castRayDown) ? '-D' : '-R'),
            crossCount = this.cachedCrossings[hash];
        if (crossCount !== undefined) {
            return crossCount;
        }

        crossCount = 0;
        var numPoints = polygon.length,
            adjustedX = this._countCrossingsAdjustedX,
            adjustedY = this._countCrossingsAdjustedY,
            i, j, currentPoint,
            x0, y0, x1, y1,
            ySign0, ySign1, xSign0, xSign1,
            m, b;

        if (castRayDown) {
            //just switch the x and y of the polygon, then the rest of the math works out correctly
            for (i = 0; i < numPoints; i++) {
                currentPoint = polygon[i];
                adjustedX[i] = currentPoint.y - y;
                adjustedY[i] = currentPoint.x - x;
            }
        }
        else {
            for (i = 0; i < numPoints; i++) {
                currentPoint = polygon[i];
                adjustedX[i] = currentPoint.x - x;
                adjustedY[i] = currentPoint.y - y;
            }
        }

        for (i = 0; i < numPoints; i++) {
            j = i + 1;
            if (j >= numPoints) {
                j = 0;
            }
            
            x0 = adjustedX[i];
            y0 = adjustedY[i];

            x1 = adjustedX[j];
            y1 = adjustedY[j];

            ySign0 = y0 >= 0 ? 1 : -1;
            ySign1 = y1 >= 0 ? 1 : -1;
            if (ySign0 !== ySign1) {
                //Points are on opposite sides of the ray being cast to the right, then the segment may cross.

                xSign0 = x0 >= 0 ? 1 : -1;
                xSign1 = x1 >= 0 ? 1 : -1;
                if (xSign0 === 1 && xSign1 === 1) {
                    //Points are both to the right of the point, so the segment must cross the ray.
                    crossCount++;
                }
                else if (xSign0 !== xSign1) {
                    //One point is to the right of the point and the other is to the left.  Need to actually do math to calculate if it intersects.
                    //Get line formula in format of y = mx + b, then calculate x-intercept.  Hint, it's b.
                    //If the x-intercept is positive, then the segment must cross the ray.

                    //Note, since we know x0 and x1 have different signs, we don't need to check (x0-x1) for being 0
                    m = (y0 - y1) / (x0 - x1);
                    b = y0 - (m * x0);
                    if (b >= 0) {
                        crossCount++;
                    }
                }
            }
        }

        this.cachedCrossings[hash] = crossCount;
        return crossCount;
    }
};
