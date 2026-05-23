import { Coordinate } from "./coordinate";
import { Tilemap } from "./tilemap";
import type { IPlacedTile } from "./tilemap";

const tile = (id: number): IPlacedTile => ({ id, orientation: 0 });

describe("Tilemap", () => {
    it("stores tiles accessible by coordinate via the tiles property", () => {
        const coord = new Coordinate({ x: 1, y: 2 });
        const t = new Tilemap([[coord, tile(1)]]);
        expect(t.tiles.get(coord)).toEqual(tile(1));
    });

    it("transposed shifts all coordinates by the given offset", () => {
        const coord = new Coordinate({ x: 1, y: 2 });
        const t = new Tilemap([[coord, tile(1)]]);
        const shifted = t.transposed(new Coordinate({ x: 3, y: 4 }));
        expect(shifted.tiles.get(new Coordinate({ x: 4, y: 6 }))).toEqual(tile(1));
    });

    it("rotated rotates all coordinates 90 degrees counter-clockwise around the origin", () => {
        // { x: 1, y: 0 } rotated 90° → { x: 0, y: 1 }; orientation increments by 1
        const coord = new Coordinate({ x: 1, y: 0 });
        const t = new Tilemap([[coord, { id: 1, orientation: 0 }]]);
        const rotated = t.rotated(1);
        expect(rotated.tiles.get(new Coordinate({ x: 0, y: 1 }))).toEqual({ id: 1, orientation: 1 });
    });

    it("should detect overlapping tilemaps", () => {
        const t1 = new Tilemap([[new Coordinate({ x: 1, y: 2 }), tile(1)]]);
        const t2 = new Tilemap([[new Coordinate({ x: 1, y: 2 }), tile(2)]]);
        const t3 = new Tilemap([[new Coordinate({ x: 3, y: 4 }), tile(3)]]);
        expect(t1.isOverlapping(t2)).toBe(true);
        expect(t1.isOverlapping(t3)).toBe(false);
    });

    it("union combines the tiles of two tilemaps", () => {
        const t1 = new Tilemap([[new Coordinate({ x: 1, y: 2 }), tile(1)]]);
        const t2 = new Tilemap([[new Coordinate({ x: 3, y: 4 }), tile(2)]]);
        const union = t1.union(t2);
        expect(union.tiles.get(new Coordinate({ x: 1, y: 2 }))).toEqual(tile(1));
        expect(union.tiles.get(new Coordinate({ x: 3, y: 4 }))).toEqual(tile(2));
    });
});
