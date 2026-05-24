import { Coordinate } from "./math";
import { Tilemap } from "./tilemap";
import type { IPlacedTile } from "./tilemap";
import { Tileset } from "./tileset";

const tileset = new Tileset([
    { id: 1, connections: [] },
    { id: 2, connections: [] },
    { id: 3, connections: [] },
]);

const tile = (id: number): IPlacedTile => ({ id, orientation: 0 });

describe("Tilemap", () => {
    it("stores tiles accessible by coordinate via the tiles property", () => {
        const coord = new Coordinate({ x: 1, y: 2 });
        const t = Tilemap.fromTiles(tileset, [[coord, tile(1)]]);
        expect(t.tiles.get(coord)).toEqual(tile(1));
    });

    it("transposed shifts all coordinates by the given offset", () => {
        const coord = new Coordinate({ x: 1, y: 2 });
        const t = Tilemap.fromTiles(tileset, [[coord, tile(1)]]);
        const shifted = t.transposed(new Coordinate({ x: 3, y: 4 }));
        expect(shifted.tiles.get(new Coordinate({ x: 4, y: 6 }))).toEqual(tile(1));
    });

    it("rotated rotates all coordinates 90 degrees counter-clockwise around the origin", () => {
        // { x: 1, y: 0 } rotated 90° → { x: 0, y: 1 }; orientation increments by 1
        const coord = new Coordinate({ x: 1, y: 0 });
        const t = Tilemap.fromTiles(tileset, [[coord, { id: 1, orientation: 0 }]]);
        const rotated = t.rotated(1);
        expect(rotated.tiles.get(new Coordinate({ x: 0, y: 1 }))).toEqual({ id: 1, orientation: 1 });
    });

    it("should detect overlapping tilemaps", () => {
        const t1 = Tilemap.fromTiles(tileset, [[new Coordinate({ x: 1, y: 2 }), tile(1)]]);
        const t2 = Tilemap.fromTiles(tileset, [[new Coordinate({ x: 1, y: 2 }), tile(2)]]);
        const t3 = Tilemap.fromTiles(tileset, [[new Coordinate({ x: 3, y: 4 }), tile(3)]]);
        expect(t1.isOverlapping(t2)).toBe(true);
        expect(t1.isOverlapping(t3)).toBe(false);
    });

    it("merge throws when the tilemaps overlap", () => {
        const t1 = Tilemap.fromTiles(tileset, [[new Coordinate({ x: 1, y: 2 }), tile(1)]]);
        const t2 = Tilemap.fromTiles(tileset, [[new Coordinate({ x: 1, y: 2 }), tile(2)]]);
        expect(() => t1.merge(t2)).toThrow("Cannot merge overlapping tilemaps");
    });

    it("merge combines the tiles of two tilemaps", () => {
        const t1 = Tilemap.fromTiles(tileset, [[new Coordinate({ x: 1, y: 2 }), tile(1)]]);
        const t2 = Tilemap.fromTiles(tileset, [[new Coordinate({ x: 3, y: 4 }), tile(2)]]);
        const merged = t1.merge(t2);
        expect(merged.tiles.get(new Coordinate({ x: 1, y: 2 }))).toEqual(tile(1));
        expect(merged.tiles.get(new Coordinate({ x: 3, y: 4 }))).toEqual(tile(2));
    });
});
