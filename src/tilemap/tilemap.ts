import { Map, Set, Record } from "immutable";
import type { RecordOf } from "immutable";
import { Direction, TileID } from "./tileset";

type CoordinateOptions = { x: number; y: number };
export const Coordinate = Record<CoordinateOptions>({ x: 0, y: 0 });
export type Coordinate = RecordOf<CoordinateOptions>;
export type Offset = Coordinate;

export interface IPlacedTile {
    id: TileID;
    orientation: Direction;
}

export interface ITilemap {
    transposed(offset: Offset): ITilemap;
    rotated(amount: number, about?: Coordinate): ITilemap;
    isOverlapping(other: ITilemap): boolean;
    union(other: ITilemap): ITilemap;
    readonly tiles: Map<Coordinate, IPlacedTile>;
}

export class Tilemap implements ITilemap {

    tiles: Map<Coordinate, IPlacedTile>;

    constructor(tiles: Iterable<[Coordinate, IPlacedTile]>) {
        this.tiles = Map(tiles);
    }

    transposed(offset: Offset): ITilemap {
        return new Tilemap(
            this.tiles.mapKeys(
                (coord) => Coordinate({ x: coord.x + offset.x, y: coord.y + offset.y })
            )
        );
    }

    rotated(amount: number, about = Coordinate({ x: 0, y: 0 })): ITilemap {
        const o = amount % 4;
        return new Tilemap(
            this.tiles.mapEntries(
                ([coord, { id, orientation }]) => {
                    let dx = coord.x - about.x;
                    let dy = coord.y - about.y;
                    for (let i = 0; i < o; i++) {
                        [dx, dy] = [-dy, dx];
                    }
                    const no = (orientation + o) % 4 as Direction;
                    return [Coordinate({ x: dx + about.x, y: dy + about.y }), { id, orientation: no }];
                }
            )
        );
    }

    isOverlapping(other: ITilemap): boolean {
        const ownCoords = Set(this.tiles.keys());
        const otherCoords = Set(other.tiles.keys());
        return ownCoords.intersect(otherCoords).size > 0;
    }

    union(other: ITilemap): ITilemap {
        return new Tilemap(this.tiles.concat(other.tiles));
    }

}
