import { Map } from "immutable";

export type TileID = number;

export enum Direction {
    Right = 0,
    Down = 1,
    Left = 2,
    Up = 3,
}

export interface ITileDefOptions {
    id: TileID;
    connections: Direction[];
}

export interface ITileDef {
    id: TileID;
    hasConnection(dir: Direction): boolean;
}

export interface ITileset {
    getTileDef(id: TileID): ITileDef;
    getTileDefs(): Iterable<ITileDef>;
}

export class Tileset implements ITileset {

    private _connectionMap: Map<TileID, number>;

    constructor(options: Iterable<ITileDefOptions>) {
        this._connectionMap = Map([...options].map(
            ({ id, connections }) => {
                let bits = 0;
                for (const dir of connections) {
                    bits |= 1 << dir;
                }
                return [id, bits];
            }
        ));
    }

    getTileDef(id: TileID): ITileDef {
        const bits = this._connectionMap.get(id);
        if (bits === undefined) {
            throw new Error(`Tile ID ${id} not found in tileset`);
        }
        const connections = Object.values(Direction).filter(
            (dir) => typeof dir === "number"
            && (bits & (1 << dir)) !== 0
        ) as Direction[];
        return {
            id,
            hasConnection(dir: Direction): boolean {
                return connections.includes(dir);
            },
        };
    }

    getTileDefs(): Iterable<ITileDef> {
        return this._connectionMap.keySeq().map((id) => this.getTileDef(id));
    }
    
}