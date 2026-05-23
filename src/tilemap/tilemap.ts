import { Map, List } from "immutable";

export type TileID = number;
export type Coordinate = List<number>;
export type Offset = List<number>;
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

    transposed([dx, dy]: Offset): ITilemap {
        return new Tilemap(
            this.tiles.mapKeys(
                ([x, y]) => List([x + dx, y + dy])
            )
        );
    }

    rotated(amount: number, [cx, cy] = List([0, 0])): ITilemap {
        const o = amount % 4;
        return new Tilemap(
            this.tiles.mapEntries(
                ([[x, y], { id, orientation }]) => {
                    let [dx, dy] = [x - cx, y - cy];
                    for (let i = 0; i < o; i++) {
                        [dx, dy] = [-dy, dx];
                    }
                    const no = (orientation + o) % 4 as Orientation;
                    return [List([dx + cx, dy + cy]), { id, orientation: no }];
                }
            )
        );
    }

}
