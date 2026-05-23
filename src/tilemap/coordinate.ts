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
