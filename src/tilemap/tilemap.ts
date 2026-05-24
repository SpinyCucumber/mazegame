import { Map, Set } from "immutable";
import { Direction, TileID } from "./tileset";
import { Coordinate, Offset } from "./coordinate";

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
                    const no = (orientation + amount) % 4 as Direction;
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
                                Map(o.mapEntries(([coord, dirs]) => [coord.rotated(amount, about), dirs.map((d) => (d + amount) % 4 as Direction)]))
                            ),
                        };
                    case "valid":
                        return {
                            type: "valid",
                            openings: Map(this._validationState.openings.mapEntries(
                                ([coord, dirs]) => [coord.rotated(amount, about), dirs.map((d) => (d + amount) % 4 as Direction)])
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

    isValid(): boolean {
        // TOOD
        return false;
    }

}
