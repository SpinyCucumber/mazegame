import { Record } from "immutable";

type CoordinateOptions = { x: number; y: number };

export class Offset extends Record<CoordinateOptions>({ x: 0, y: 0 }) {
    rotated(amount: number): Offset {
        const o = ((amount % 4) + 4) % 4;
        let { x, y } = this;
        for (let i = 0; i < o; i++) {
            [x, y] = [-y, x];
        }
        return this.merge({ x, y });
    }
}

export class Coordinate extends Record<CoordinateOptions>({ x: 0, y: 0 }) {
    added(offset: Offset): Coordinate {
        return this.merge({ x: this.x + offset.x, y: this.y + offset.y });
    }

    difference(other: Coordinate): Offset {
        return new Offset({ x: this.x - other.x, y: this.y - other.y });
    }

    rotated(amount: number, about = new Coordinate()): Coordinate {
        return about.added(this.difference(about).rotated(amount));
    }
}

export enum Direction {
    Right = 0,
    Down = 1,
    Left = 2,
    Up = 3
}

export function asOffset(dir: Direction): Offset {
    const offset = new Offset({ x: 1, y: 0 });
    return offset.rotated(dir);
}

export function rotateDirection(dir: Direction, numQuarterTurns: number) {
    const o = ((numQuarterTurns % 4) + 4) % 4;
    return (dir + o) % 4 as Direction;
}

export function getOppositeDirection(dir: Direction): Direction {
    return rotateDirection(dir, 2);
}

export function encodeAsBits(dirs: Direction[]): number {
    let bits = 0;
    for (const dir of dirs) {
        bits |= 1 << dir;
    }
    return bits;
}

export function decodeFromBits(bits: number): Direction[] {
    return Object.values(Direction).filter(
        (dir) => typeof dir === "number"
        && (bits & (1 << dir)) !== 0
    ) as Direction[];
}

export class Edge extends Record<EdgeOptions>({ coordinate: new Coordinate(), direction: Direction.Right }) { }
export type EdgeOptions = { coordinate: Coordinate; direction: Direction; };

export function getOppositeEdge(edge: Edge): Edge {
    return edge.merge({
        coordinate: edge.coordinate.added(asOffset(edge.direction)),
        direction: getOppositeDirection(edge.direction),
    });
}