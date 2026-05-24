import { Tileset } from "./tileset";
import { Direction } from "../utility/math";

describe("Tileset", () => {
    
    describe("constructor (bit packing)", () => {
        it("stores connections with correct directions", () => {
            const tileset = new Tileset([
                { id: 1, connections: [Direction.Right, Direction.Up] },
            ]);
            const tile = tileset.getTileDef(1);
            expect(tile.connections).toContain(Direction.Right);
            expect(tile.connections).toContain(Direction.Up);
            expect(tile.connections).not.toContain(Direction.Down);
            expect(tile.connections).not.toContain(Direction.Left);
        });
    });

    describe("getTileDef (bit unpacking)", () => {
        it("reconstructs all four directions correctly from bitmask", () => {
            const tileset = new Tileset([
                { id: 2, connections: [Direction.Right, Direction.Down, Direction.Left, Direction.Up] },
            ]);
            const tile = tileset.getTileDef(2);
            expect(tile.connections).toContain(Direction.Right);
            expect(tile.connections).toContain(Direction.Down);
            expect(tile.connections).toContain(Direction.Left);
            expect(tile.connections).toContain(Direction.Up);
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
