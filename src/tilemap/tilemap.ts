import { Map, Record } from "immutable";
import type { RecordOf } from "immutable";

export type TileID = number;
type CoordinateProps = { x: number; y: number };
export const Coordinate = Record<CoordinateProps>({ x: 0, y: 0 });
export type Coordinate = RecordOf<CoordinateProps>;
export type Offset = Coordinate;
export type Orientation = 0 | 1 | 2 | 3;

export interface ITile {
    id: TileID;
    orientation: Orientation;
}

export interface ITilemap {
    transposed(offset: Offset): ITilemap;
    rotated(amount: number, about?: Coordinate): ITilemap;
    readonly tiles: Map<Coordinate, ITile>;
}

export class Tilemap implements ITilemap {

    tiles: Map<Coordinate, ITile>;

    constructor(tiles: Iterable<[Coordinate, ITile]>) {
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
                    const no = (orientation + o) % 4 as Orientation;
                    return [Coordinate({ x: dx + about.x, y: dy + about.y }), { id, orientation: no }];
                }
            )
        );
    }

}
