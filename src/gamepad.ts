const STICK_PRESS = 0.4;
const STICK_RELEASE = 0.2;
const STANDARD_STICK_AXIS = 0;
const NONSTANDARD_STICK_AXIS = 4;

const BUTTON_BOTTOM = 0;
const BUTTON_RIGHT = 1;
const DPAD_LEFT = 14;
const DPAD_RIGHT = 15;
const HAT_AXIS = 9;
const HAT_DIRECTIONS = 8;
const HAT_LEFT = new Set([5, 6, 7]);
const HAT_RIGHT = new Set([1, 2, 3]);

type Control = "left" | "right" | "confirm" | "back";

const KEYS: Record<Control, { key: string; code: string }> = {
  left: { key: "ArrowLeft", code: "ArrowLeft" },
  right: { key: "ArrowRight", code: "ArrowRight" },
  confirm: { key: " ", code: "Space" },
  back: { key: "Backspace", code: "Backspace" },
};

const held = new Map<number, Set<Control>>();
const stickHeld = new Map<number, "left" | "right" | null>();

function press(control: Control): void {
  const target = document.activeElement ?? document.body;
  const { key, code } = KEYS[control];
  const handled = !target.dispatchEvent(new KeyboardEvent("keydown", { key, code, bubbles: true, cancelable: true }));
  target.dispatchEvent(new KeyboardEvent("keyup", { key, code, bubbles: true, cancelable: true }));
  if (control === "confirm" && !handled && target instanceof HTMLButtonElement) target.click();
}

function readHat(pad: Gamepad): "left" | "right" | null {
  if (pad.mapping === "standard") return null;
  const value = pad.axes[HAT_AXIS];
  if (value === undefined || value > 1.1 || value < -1.1) return null;
  const direction = Math.round(((value + 1) / 2) * (HAT_DIRECTIONS - 1));
  if (HAT_LEFT.has(direction)) return "left";
  if (HAT_RIGHT.has(direction)) return "right";
  return null;
}

function readStick(pad: Gamepad): "left" | "right" | null {
  const x = pad.axes[pad.mapping === "standard" ? STANDARD_STICK_AXIS : NONSTANDARD_STICK_AXIS] ?? 0;
  const previous = stickHeld.get(pad.index) ?? null;
  const threshold = previous ? STICK_RELEASE : STICK_PRESS;
  if (x <= -threshold) return "left";
  if (x >= threshold) return "right";
  return null;
}

function poll(): void {
  for (const pad of navigator.getGamepads()) {
    if (!pad) continue;
    const now = new Set<Control>();
    if (pad.buttons[BUTTON_RIGHT]?.pressed) now.add("confirm");
    if (pad.buttons[BUTTON_BOTTOM]?.pressed) now.add("back");
    if (pad.buttons[DPAD_LEFT]?.pressed) now.add("left");
    if (pad.buttons[DPAD_RIGHT]?.pressed) now.add("right");
    const hat = readHat(pad);
    if (hat) now.add(hat);
    const before = held.get(pad.index) ?? new Set<Control>();
    for (const control of now) if (!before.has(control)) press(control);
    held.set(pad.index, now);

    const stick = readStick(pad);
    if (stick && stick !== stickHeld.get(pad.index)) press(stick);
    stickHeld.set(pad.index, stick);
  }
  requestAnimationFrame(poll);
}

export function watchGamepads(): void {
  window.addEventListener("gamepaddisconnected", (event) => {
    held.delete(event.gamepad.index);
    stickHeld.delete(event.gamepad.index);
  });
  requestAnimationFrame(poll);
}
