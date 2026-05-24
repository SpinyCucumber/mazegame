import { Tileset } from "./tileset";
import { Direction } from "./math";

describe("Tileset", () => {
    
    describe("constructor (bit packing)", () => {
        it("stores connections as bitmask with correct bits set", () => {
            const tileset = new Tileset([
                { id: 1, connections: [Direction.Right, Direction.Up] },
            ]);
            const tile = tileset.getTileDef(1);
            expect(tile.hasConnection(Direction.Right)).toBe(true);
            expect(tile.hasConnection(Direction.Up)).toBe(true);
            expect(tile.hasConnection(Direction.Down)).toBe(false);
            expect(tile.hasConnection(Direction.Left)).toBe(false);
        });
    });

    describe("getTileDef (bit unpacking)", () => {
        it("reconstructs all four directions correctly from bitmask", () => {
            const tileset = new Tileset([
                { id: 2, connections: [Direction.Right, Direction.Down, Direction.Left, Direction.Up] },
            ]);
            const tile = tileset.getTileDef(2);
            expect(tile.hasConnection(Direction.Right)).toBe(true);
            expect(tile.hasConnection(Direction.Down)).toBe(true);
            expect(tile.hasConnection(Direction.Left)).toBe(true);
            expect(tile.hasConnection(Direction.Up)).toBe(true);
        });

        it("throws when tile ID is not in the tileset", () => {
            const tileset = new Tileset([]);
            expect(() => tileset.getTileDef(99)).toThrow("Tile ID 99 not found in tileset");
        });
    });

    describe("getTileDefs", () => {
        it("returns all tile definitions stored in the tileset", () => {
            const tileset = new Tileset([
                { id: 1, connections: [Direction.Right] },
                { id: 2, connections: [Direction.Left] },
            ]);
            const defs = [...tileset.getTileDefs()];
            expect(defs).toHaveLength(2);
            expect(defs.map((d) => d.id).sort()).toEqual([1, 2]);
        });
    });
});
