import { Map } from "immutable";
import { Direction, encodeAsBits, decodeFromBits } from "../utility/math";

export type TileID = number;

export interface ITileDefOptions {
    id: TileID;
    connections: Direction[];
}

export interface ITileDef {
    readonly id: TileID;
    readonly connections: readonly Direction[];
}

export interface ITileset {
    getTileDef(id: TileID): ITileDef;
    getTileDefs(): Iterable<ITileDef>;
}

export class Tileset implements ITileset {

    private _connectionMap: Map<TileID, number>;

    constructor(options: Iterable<ITileDefOptions>) {
        this._connectionMap = Map([...options].map(
            ({ id, connections }) => [id, encodeAsBits(connections)]
        ));
    }

    getTileDef(id: TileID): ITileDef {
        const bits = this._connectionMap.get(id);
        if (bits === undefined) {
            throw new Error(`Tile ID ${id} not found in tileset`);
        }
        const connections = decodeFromBits(bits);
        return {
            id,
            connections,
        };
    }

    getTileDefs(): Iterable<ITileDef> {
        return this._connectionMap.keySeq().map((id) => this.getTileDef(id));
    }
    
}