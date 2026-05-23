import { Map, Set } from "immutable";
import { Direction, TileID } from "./tileset";
import { Coordinate, Offset } from "./coordinate";

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
            this.tiles.mapKeys((coord) => coord.added(offset))
        );
    }

    rotated(amount: number, about = new Coordinate()): ITilemap {
        return new Tilemap(
            this.tiles.mapEntries(
                ([coord, { id, orientation }]) => {
                    const no = (orientation + amount) % 4 as Direction;
                    return [coord.rotated(amount, about), { id, orientation: no }];
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
