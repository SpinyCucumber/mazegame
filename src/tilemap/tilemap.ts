import { Map, Set as FixedSet } from "immutable";
import { ITileset, TileID } from "./tileset";
import { Direction, rotateDirection, Coordinate, Offset, Edge } from "../utility/math";

namespace ValidationStates {
    export const Unchecked = { type: "unchecked" } as const;
    export const Invalid = { type: "invalid" } as const;
    export interface UncheckedMerge {
        type: "uncheckedMerge";
        mergedOpenings: FixedSet<Edge>[];
    }
    export interface Valid {
        type: "valid";
        openings: FixedSet<Edge>;
    }
}

type ValidationState = typeof ValidationStates.Unchecked | ValidationStates.UncheckedMerge | ValidationStates.Valid | typeof ValidationStates.Invalid;

export interface IPlacedTile {
    id: TileID;
    orientation: Direction;
}

function getUnmergedOpenings(validationState: ValidationState): FixedSet<Edge>[] {
    switch (validationState.type) {
        case "uncheckedMerge":
            return validationState.mergedOpenings;
        case "valid":
            return [validationState.openings];
        default:
            return [];
    }
}

export class Tilemap {

    tiles: Map<Coordinate, IPlacedTile>;
    private _validationState: ValidationState;
    private _tileset: ITileset;

    private constructor(tileset: ITileset, tiles: Iterable<[Coordinate, IPlacedTile]>, validationState: ValidationState) {
        this._tileset = tileset;
        this.tiles = Map(tiles);
        this._validationState = validationState;
    }

    static fromTiles(tileset: ITileset, tiles: Iterable<[Coordinate, IPlacedTile]>): Tilemap {
        return new Tilemap(tileset, tiles, ValidationStates.Unchecked);
    }

    transposed(offset: Offset): Tilemap {
        return new Tilemap(
            this._tileset,
            this.tiles.mapKeys((coord) => coord.added(offset)),
            (() => {
                switch (this._validationState.type) {
                    case "unchecked":
                    case "invalid":
                        return this._validationState;
                    case "uncheckedMerge":
                        return {
                            type: "uncheckedMerge",
                            mergedOpenings: this._validationState.mergedOpenings.map((o) =>
                                o.map((edge) => edge.set("coordinate", edge.coordinate.added(offset)))
                            ),
                        };
                    case "valid":
                        return {
                            type: "valid",
                            openings: this._validationState.openings.map((edge) => edge.set("coordinate", edge.coordinate.added(offset))),
                        };
                }
            })()
        );
    }

    rotated(amount: number, about = new Coordinate()): Tilemap {
        return new Tilemap(
            this._tileset,
            this.tiles.mapEntries(
                ([coord, { id, orientation }]) => {
                    const no = rotateDirection(orientation, amount);
                    return [coord.rotated(amount, about), { id, orientation: no }];
                }
            ),
            (() => {
                switch (this._validationState.type) {
                    case "unchecked":
                    case "invalid":
                        return this._validationState;
                    case "uncheckedMerge":
                        return {
                            type: "uncheckedMerge",
                            mergedOpenings: this._validationState.mergedOpenings.map((o) =>
                                o.map((edge) => edge.merge({ coordinate: edge.coordinate.rotated(amount, about), direction: rotateDirection(edge.direction, amount) }))
                            ),
                        };
                    case "valid":
                        return {
                            type: "valid",
                            openings: this._validationState.openings.map((edge) =>
                                edge.merge({ coordinate: edge.coordinate.rotated(amount, about), direction: rotateDirection(edge.direction, amount) })
                            ),
                        };
                }
            })()
        );
    }

    isOverlapping(other: Tilemap): boolean {
        const ownCoords = FixedSet(this.tiles.keys());
        const otherCoords = FixedSet(other.tiles.keys());
        return ownCoords.intersect(otherCoords).size > 0;
    }

    merge(other: Tilemap): Tilemap {
        if (this._tileset !== other._tileset) {
            throw new Error("Cannot merge tilemaps with different tilesets");
        }
        if (this.isOverlapping(other)) {
            throw new Error("Cannot merge overlapping tilemaps");
        }
        return new Tilemap(
            this._tileset,
            this.tiles.concat(other.tiles),
            (() => {
                if (this._validationState.type === "invalid" || other._validationState.type === "invalid")
                    return ValidationStates.Invalid;
                if (this._validationState.type === "unchecked" || other._validationState.type === "unchecked")
                    return ValidationStates.Unchecked;
                return {
                    type: "uncheckedMerge",
                    mergedOpenings: [...getUnmergedOpenings(this._validationState), ...getUnmergedOpenings(other._validationState)],
                };
            })()
        );      
    }

    private validate(): ValidationState {
        switch (this._validationState.type) {
            case "valid":
            case "invalid":
                return this._validationState;
            case "unchecked":
            case "uncheckedMerge": {
                let openings: FixedSet<Edge>;
                if (this._validationState.type === "unchecked") {
                    // If no previous merges, must perform full validation
                    // For each connection, if the set of openings already contains the _opposite_ edge, remote and skip it.
                    openings = FixedSet<Edge>();
                    for (const [coordinate, { id, orientation }] of this.tiles) {
                        const tileDef = this._tileset.getTileDef(id);
                        for (const dir of tileDef.connections) {
                            const edge = new Edge({ coordinate, direction: rotateDirection(dir, orientation) });
                            const opposite = edge.getOpposite();
                            if (openings.has(opposite)) {
                                openings = openings.delete(opposite);
                            } else {
                                openings = openings.add(edge);
                            }
                        }
                    }
                }
                else {
                    // If we have previous merges, we can get a bit clever and only check for corresponding openings
                    // between existing openings and new openings, since we know each merged tilemap is already internally valid.
                    openings = this._validationState.mergedOpenings[0];
                    for (let i = 1; i < this._validationState.mergedOpenings.length; i++) {
                        const newOpenings = this._validationState.mergedOpenings[i];
                        for (const edge of newOpenings) {
                            const opposite = edge.getOpposite();
                            if (openings.has(opposite)) {
                                openings = openings.delete(opposite);
                            } else {
                                openings = openings.add(edge);
                            }
                        }
                    }
                }
                // For remaining openings, we check if the opposite edge has a tile.
                // If it does, the tilemap is invalid.
                for (const edge of openings) {
                    const opposite = edge.getOpposite();
                    const oppositeTile = this.tiles.get(opposite.coordinate);
                    if (oppositeTile !== undefined) return ValidationStates.Invalid;
                }
                return { type: "valid", openings };
            }
        }
    }

    /**
     * Checks whether the tilemap is valid
     * 
     * A tilemap is "valid" if it meets the following condition:
     * For each tile, for each direction in which it has a connection, there is
     * A) a neighboring tile in that direction with a corresponding connection (i.e. a connection in the opposite direction), OR
     * B) no neighboring tile in that direction
     * In other words, if there are any tiles with connections that face a tile _without_ a corresponding connection,
     * the tilemap is invalid.
     */
    isValid(): boolean {
        this._validationState = this.validate();
        return this._validationState.type === "valid";
    }

}
