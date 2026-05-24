import { Coordinate, Direction, Extent } from "../utility/math";
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

// Tileset for isValid tests:
//   id 1 — no connections
//   id 2 — connects Right
//   id 3 — connects Left
//   id 4 — connects Right and Left (corridor)
const validationTileset = new Tileset([
    { id: 1, connections: [] },
    { id: 2, connections: [Direction.Right] },
    { id: 3, connections: [Direction.Left] },
    { id: 4, connections: [Direction.Right, Direction.Left] },
]);

const O  = new Coordinate({ x: 0, y: 0 });
const R1 = new Coordinate({ x: 1, y: 0 });
const R2 = new Coordinate({ x: 2, y: 0 });

const p = (id: number, orientation = 0): IPlacedTile => ({ id, orientation });

describe("Tilemap.isValid", () => {

    describe("single-tile cases", () => {
        it("a tile with no connections is valid", () => {
            const t = Tilemap.fromTiles(validationTileset, [[O, p(1)]]);
            expect(t.isValid()).toBe(true);
        });

        it("a tile with a connection facing empty space is valid", () => {
            const t = Tilemap.fromTiles(validationTileset, [[O, p(2)]]);
            expect(t.isValid()).toBe(true);
        });
    });

    describe("two adjacent tiles", () => {
        it("matching connections facing each other are valid", () => {
            // tile 2 at (0,0) connects Right; tile 3 at (1,0) connects Left
            const t = Tilemap.fromTiles(validationTileset, [[O, p(2)], [R1, p(3)]]);
            expect(t.isValid()).toBe(true);
        });

        it("neither tile connects — valid", () => {
            const t = Tilemap.fromTiles(validationTileset, [[O, p(1)], [R1, p(1)]]);
            expect(t.isValid()).toBe(true);
        });

        it("one tile connects toward a neighbor that has no reciprocal connection — invalid", () => {
            // tile 2 at (0,0) connects Right toward tile 1 at (1,0) which has no connections
            const t = Tilemap.fromTiles(validationTileset, [[O, p(2)], [R1, p(1)]]);
            expect(t.isValid()).toBe(false);
        });

        it("the neighbor connects toward a tile that has no reciprocal connection — invalid", () => {
            // tile 1 at (0,0) has no connections; tile 3 at (1,0) connects Left toward (0,0)
            const t = Tilemap.fromTiles(validationTileset, [[O, p(1)], [R1, p(3)]]);
            expect(t.isValid()).toBe(false);
        });
    });

    describe("orientation", () => {
        it("tile orientation rotates its connections — matching after rotation is valid", () => {
            // tile 2 normally connects Right; with orientation 2 it connects Left
            // (0,0) orientation 0 connects Right toward (1,0)
            // (1,0) orientation 2 connects Left toward (0,0)
            const t = Tilemap.fromTiles(validationTileset, [[O, p(2, 0)], [R1, p(2, 2)]]);
            expect(t.isValid()).toBe(true);
        });

        it("tile orientation rotates its connections — mismatch after rotation is invalid", () => {
            // tile 2 at (0,0) orientation 0 connects Right toward (1,0)
            // tile 2 at (1,0) orientation 0 also connects Right (away from (0,0)) — no reciprocal
            const t = Tilemap.fromTiles(validationTileset, [[O, p(2, 0)], [R1, p(2, 0)]]);
            expect(t.isValid()).toBe(false);
        });
    });

    describe("three-tile corridor", () => {
        it("a straight corridor with matched endpoints is valid", () => {
            // tile 2 at (0,0) — tile 4 (corridor) at (1,0) — tile 3 at (2,0)
            const t = Tilemap.fromTiles(validationTileset, [
                [O,  p(2)],
                [R1, p(4)],
                [R2, p(3)],
            ]);
            expect(t.isValid()).toBe(true);
        });

        it("a corridor tile facing a neighbor without a matching connection is invalid", () => {
            // tile 2 — tile 4 (corridor) — tile 1 (no connections): right side of corridor is unmatched
            const t = Tilemap.fromTiles(validationTileset, [
                [O,  p(2)],
                [R1, p(4)],
                [R2, p(1)],
            ]);
            expect(t.isValid()).toBe(false);
        });
    });

    describe("merge path (uncheckedMerge)", () => {
        it("merging two individually-valid tilemaps with a matching boundary is valid", () => {
            const t1 = Tilemap.fromTiles(validationTileset, [[O, p(2)]]);
            const t2 = Tilemap.fromTiles(validationTileset, [[R1, p(3)]]);
            t1.isValid();
            t2.isValid();
            expect(t1.merge(t2).isValid()).toBe(true);
        });

        it("merging two individually-valid tilemaps with an unmatched boundary is invalid", () => {
            // t1 has an open Right edge; t2 has no connection on its Left side
            const t1 = Tilemap.fromTiles(validationTileset, [[O, p(2)]]);
            const t2 = Tilemap.fromTiles(validationTileset, [[R1, p(1)]]);
            t1.isValid();
            t2.isValid();
            expect(t1.merge(t2).isValid()).toBe(false);
        });

        it("merging without prior validation falls back to full validation and still produces the correct result", () => {
            // Neither t1 nor t2 validated first → merged state is 'unchecked', not 'uncheckedMerge'
            const t1 = Tilemap.fromTiles(validationTileset, [[O, p(2)]]);
            const t2 = Tilemap.fromTiles(validationTileset, [[R1, p(3)]]);
            expect(t1.merge(t2).isValid()).toBe(true);
        });
    });
});

describe("Tilemap.getExtent", () => {
    it("throws for an empty tilemap", () => {
        const t = Tilemap.fromTiles(tileset, []);
        expect(() => t.getExtent()).toThrow("Cannot get extent of an empty tilemap");
    });

    it("returns min === max for a single tile", () => {
        const coord = new Coordinate({ x: 3, y: -2 });
        const t = Tilemap.fromTiles(tileset, [[coord, tile(1)]]);
        expect(t.getExtent()).toEqual(new Extent({ min: coord, max: coord }));
    });

    it("returns the correct bounding box for multiple tiles", () => {
        const t = Tilemap.fromTiles(tileset, [
            [new Coordinate({ x: 1, y: 4 }), tile(1)],
            [new Coordinate({ x: 3, y: 2 }), tile(2)],
            [new Coordinate({ x: -1, y: 5 }), tile(3)],
        ]);
        expect(t.getExtent()).toEqual(new Extent({
            min: new Coordinate({ x: -1, y: 2 }),
            max: new Coordinate({ x: 3, y: 5 }),
        }));
    });
});
