import { Map, Set } from "immutable";
import { TileID } from "./tileset";
import { Direction, rotateDirection, Coordinate, Offset } from "./math";

type Openings = Map<Coordinate, Set<Direction>>;

namespace ValidationStates {
    export const Unchecked = { type: "unchecked" } as const;
    export const Invalid = { type: "invalid" } as const;
    export interface UncheckedMerge {
        type: "uncheckedMerge";
        mergedOpenings: Openings[];
    }
    export interface Valid {
        type: "valid";
        openings: Openings;
    }
}

type ValidationState = typeof ValidationStates.Unchecked | ValidationStates.UncheckedMerge | ValidationStates.Valid | typeof ValidationStates.Invalid;

export interface IPlacedTile {
    id: TileID;
    orientation: Direction;
}

function getUnmergedOpenings(validationState: ValidationState): Openings[] {
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

    private constructor(tiles: Iterable<[Coordinate, IPlacedTile]>, validationState: ValidationState) {
        this.tiles = Map(tiles);
        this._validationState = validationState;
    }

    static fromTiles(tiles: Iterable<[Coordinate, IPlacedTile]>): Tilemap {
        return new Tilemap(tiles, ValidationStates.Unchecked);
    }

    transposed(offset: Offset): Tilemap {
        return new Tilemap(
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
                                Map(o.mapKeys((coord) => coord.added(offset)))
                            ),
                        };
                    case "valid":
                        return {
                            type: "valid",
                            openings: Map(this._validationState.openings.mapKeys((coord) => coord.added(offset))),
                        };
                }
            })()
        );
    }

    rotated(amount: number, about = new Coordinate()): Tilemap {
        return new Tilemap(
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
                                Map(o.mapEntries(([coord, dirs]) => [coord.rotated(amount, about), dirs.map((d) => rotateDirection(d, amount))]))
                            ),
                        };
                    case "valid":
                        return {
                            type: "valid",
                            openings: Map(this._validationState.openings.mapEntries(
                                ([coord, dirs]) => [coord.rotated(amount, about), dirs.map((d) => rotateDirection(d, amount))])
                            ),
                        };
                }
            })()
        );
    }

    isOverlapping(other: Tilemap): boolean {
        const ownCoords = Set(this.tiles.keys());
        const otherCoords = Set(other.tiles.keys());
        return ownCoords.intersect(otherCoords).size > 0;
    }

    merge(other: Tilemap): Tilemap {
        return new Tilemap(
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

    private validate() {
        // TODO
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
        this.validate();
        return this._validationState.type === "valid";
    }

}
