import { Coordinate, Offset, Direction, rotateDirection, encodeAsBits, decodeFromBits } from "./math";

describe("Coordinate.added", () => {
    it("returns a new coordinate shifted by the given offset", () => {
        const coord = new Coordinate({ x: 1, y: 2 });
        const offset = new Offset({ x: 3, y: 4 });
        expect(coord.added(offset)).toEqual(new Coordinate({ x: 4, y: 6 }));
    });
});

describe("Coordinate.rotated", () => {
    it("rotates 90 degrees counter-clockwise about the origin", () => {
        // (1, 0) → (0, 1)
        expect(new Coordinate({ x: 1, y: 0 }).rotated(1)).toEqual(new Coordinate({ x: 0, y: 1 }));
    });

    it("rotates 180 degrees", () => {
        expect(new Coordinate({ x: 1, y: 2 }).rotated(2)).toEqual(new Coordinate({ x: -1, y: -2 }));
    });

    it("rotating by 4 is a no-op", () => {
        const coord = new Coordinate({ x: 3, y: 7 });
        expect(coord.rotated(4)).toEqual(coord);
    });

    it("handles negative amounts", () => {
        // -1 quarter-turn (i.e. 90° clockwise) on (0, 1) → (1, 0)
        expect(new Coordinate({ x: 0, y: 1 }).rotated(-1)).toEqual(new Coordinate({ x: 1, y: 0 }));
    });

    it("rotates about a non-origin point", () => {
        const pivot = new Coordinate({ x: 1, y: 1 });
        // (2, 1) rotated 1 turn about (1, 1) → (1, 2)
        expect(new Coordinate({ x: 2, y: 1 }).rotated(1, pivot)).toEqual(new Coordinate({ x: 1, y: 2 }));
    });
});

describe("rotateDirection", () => {
    it("rotates Right by 1 → Down", () => {
        expect(rotateDirection(Direction.Right, 1)).toBe(Direction.Down);
    });

    it("rotates by 4 returns the same direction", () => {
        expect(rotateDirection(Direction.Up, 4)).toBe(Direction.Up);
    });

    it("handles negative turns", () => {
        // Down rotated -1 (one step counter-clockwise) → Right
        expect(rotateDirection(Direction.Down, -1)).toBe(Direction.Right);
    });
});

describe("encodeAsBits", () => {
    it("encodes an empty list as 0", () => {
        expect(encodeAsBits([])).toBe(0);
    });

    it("encodes a single direction", () => {
        expect(encodeAsBits([Direction.Right])).toBe(0b0001);
        expect(encodeAsBits([Direction.Down])).toBe(0b0010);
    });

    it("encodes multiple directions", () => {
        expect(encodeAsBits([Direction.Right, Direction.Left])).toBe(0b0101);
    });
});

describe("decodeFromBits", () => {
    it("decodes 0 as empty", () => {
        expect(decodeFromBits(0)).toEqual([]);
    });

    it("decodes a single bit", () => {
        expect(decodeFromBits(0b0001)).toEqual([Direction.Right]);
        expect(decodeFromBits(0b0010)).toEqual([Direction.Down]);
    });

    it("decodes multiple bits", () => {
        expect(decodeFromBits(0b0101)).toEqual([Direction.Right, Direction.Left]);
    });

    it("round-trips with encodeAsBits", () => {
        const dirs = [Direction.Right, Direction.Up, Direction.Down];
        expect(decodeFromBits(encodeAsBits(dirs))).toEqual(expect.arrayContaining(dirs));
    });
});
