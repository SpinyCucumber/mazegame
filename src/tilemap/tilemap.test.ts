import { Coordinate, Tilemap } from "./tilemap";
import type { ITile } from "./tilemap";

const tile = (id: number): ITile => ({ id, orientation: 0 });

describe("Tilemap", () => {
    it("stores tiles accessible by coordinate via the tiles property", () => {
        const coord = Coordinate({ x: 1, y: 2 });
        const t = new Tilemap([[coord, tile(1)]]);
        expect(t.tiles.get(coord)).toEqual(tile(1));
    });

    it("transposed shifts all coordinates by the given offset", () => {
        const coord = Coordinate({ x: 1, y: 2 });
        const t = new Tilemap([[coord, tile(1)]]);
        const shifted = t.transposed(Coordinate({ x: 3, y: 4 }));
        expect(shifted.tiles.get(Coordinate({ x: 4, y: 6 }))).toEqual(tile(1));
    });

    it("rotated rotates all coordinates 90 degrees counter-clockwise around the origin", () => {
        // { x: 1, y: 0 } rotated 90° → { x: 0, y: 1 }; orientation increments by 1
        const coord = Coordinate({ x: 1, y: 0 });
        const t = new Tilemap([[coord, { id: 1, orientation: 0 }]]);
        const rotated = t.rotated(1);
        expect(rotated.tiles.get(Coordinate({ x: 0, y: 1 }))).toEqual({ id: 1, orientation: 1 });
    });
});
