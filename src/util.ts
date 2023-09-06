export const IDENTIFIER = "beat-code";

export const directions = {
    up: [-1, 0],
    down: [1, 0],
    left: [0, -1],
    right: [0, 1],
};

export type Direction = keyof typeof directions;

export const directionList: Direction[] = Object.keys(directions) as any;

export function random<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

export const opposite: Record<Direction, Direction> = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
};

export function move(pos: [number, number], dir: Direction): [number, number] {
    return [pos[0] + directions[dir][0], pos[1] + directions[dir][1]];
}

export const cursorCommands: Record<Direction, string> = {
    up: "cursorUp",
    down: "cursorDown",
    left: "cursorLeft",
    right: "cursorRight",
};

export const commands = {
    activate: "",
    deactivate: "",
    up: "",
    down: "",
    left: "",
    right: "",
};

export const contexts = {
    activated: "",
};

export function joinCSS(css: Record<string, string>): string {
    return Object.entries(css)
        .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}: ${v};`)
        .join(" ");
}

function populate<K extends PropertyKey>(bundle: Record<K, string>) {
    Object.keys(bundle).forEach((k) => (bundle[k as K] = `${IDENTIFIER}.${k}`));
}
populate(commands);
populate(contexts);
