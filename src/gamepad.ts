import { emit, type Direction } from "./input";

const STICK_PRESS = 0.4;
const STICK_RELEASE = 0.2;
const REPEAT_DELAY_MS = 400;
const REPEAT_INTERVAL_MS = 140;

const BUTTON_BOTTOM = 0;
const BUTTON_RIGHT = 1;
const STANDARD_DPAD: [Direction, number][] = [
  ["up", 12],
  ["down", 13],
  ["left", 14],
  ["right", 15],
];
const STANDARD_STICK_X = 0;
const STANDARD_STICK_Y = 1;
const NONSTANDARD_HAT_AXIS = 9;
const NONSTANDARD_STICK_X = 4;

const HAT_STEPS = 8;
const HAT_DIRECTIONS: Direction[][] = [["up"], ["up", "right"], ["right"], ["down", "right"], ["down"], ["down", "left"], ["left"], ["up", "left"]];

type Control = Direction | "confirm" | "back";

interface PadState {
  held: Set<Control>;
  repeatAt: Map<Direction, number>;
}

const pads = new Map<number, PadState>();

function isDirection(control: Control): control is Direction {
  return control !== "confirm" && control !== "back";
}

function hatDirections(value: number | undefined): Direction[] {
  if (value === undefined || value > 1.1 || value < -1.1) return [];
  return HAT_DIRECTIONS[Math.round(((value + 1) / 2) * (HAT_STEPS - 1))] ?? [];
}

function stickDirection(value: number | undefined, wasHeld: boolean, negative: Direction, positive: Direction): Direction | null {
  if (value === undefined) return null;
  const threshold = wasHeld ? STICK_RELEASE : STICK_PRESS;
  if (value <= -threshold) return negative;
  if (value >= threshold) return positive;
  return null;
}

function readControls(pad: Gamepad, previous: Set<Control>): Set<Control> {
  const controls = new Set<Control>();
  const pressed = (index: number) => pad.buttons[index]?.pressed === true;
  const add = (control: Control | null) => {
    if (control) controls.add(control);
  };
  const heldX = previous.has("left") || previous.has("right");
  const heldY = previous.has("up") || previous.has("down");
  if (pressed(BUTTON_RIGHT)) controls.add("confirm");
  if (pressed(BUTTON_BOTTOM)) controls.add("back");
  if (pad.mapping === "standard") {
    for (const [direction, index] of STANDARD_DPAD) if (pressed(index)) controls.add(direction);
    add(stickDirection(pad.axes[STANDARD_STICK_X], heldX, "left", "right"));
    add(stickDirection(pad.axes[STANDARD_STICK_Y], heldY, "up", "down"));
  } else {
    for (const direction of hatDirections(pad.axes[NONSTANDARD_HAT_AXIS])) controls.add(direction);
    add(stickDirection(pad.axes[NONSTANDARD_STICK_X], heldX, "left", "right"));
  }
  return controls;
}

function poll(now: number): void {
  for (const pad of navigator.getGamepads()) {
    if (!pad) continue;
    const state = pads.get(pad.index) ?? { held: new Set<Control>(), repeatAt: new Map<Direction, number>() };
    const controls = readControls(pad, state.held);
    for (const control of controls) {
      if (state.held.has(control)) continue;
      emit({ kind: control });
      if (isDirection(control)) state.repeatAt.set(control, now + REPEAT_DELAY_MS);
    }
    for (const [direction, at] of state.repeatAt) {
      if (!controls.has(direction)) state.repeatAt.delete(direction);
      else if (now >= at) {
        emit({ kind: direction });
        state.repeatAt.set(direction, now + REPEAT_INTERVAL_MS);
      }
    }
    state.held = controls;
    pads.set(pad.index, state);
  }
  requestAnimationFrame(poll);
}

export function watchGamepads(): void {
  window.addEventListener("gamepaddisconnected", (event) => pads.delete(event.gamepad.index));
  requestAnimationFrame(poll);
}
