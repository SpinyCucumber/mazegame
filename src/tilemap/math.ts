import { Record } from "immutable";

type CoordinateOptions = { x: number; y: number };

export class Offset extends Record<CoordinateOptions>({ x: 0, y: 0 }) {}

export class Coordinate extends Record<CoordinateOptions>({ x: 0, y: 0 }) {
    added(offset: Offset): Coordinate {
        return this.merge({ x: this.x + offset.x, y: this.y + offset.y });
    }

    rotated(amount: number, about = new Coordinate()): Coordinate {
        const o = ((amount % 4) + 4) % 4;
        let dx = this.x - about.x;
        let dy = this.y - about.y;
        for (let i = 0; i < o; i++) {
            [dx, dy] = [-dy, dx];
        }
        return this.merge({ x: dx + about.x, y: dy + about.y });
    }
}

export enum Direction {
    Right = 0,
    Down = 1,
    Left = 2,
    Up = 3
}

export function rotateDirection(dir: Direction, numQuarterTurns: number) {
    const o = ((numQuarterTurns % 4) + 4) % 4;
    return (dir + o) % 4 as Direction;
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
