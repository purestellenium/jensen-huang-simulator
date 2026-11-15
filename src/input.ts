export type Direction = "left" | "right" | "up" | "down";

export type Action = { kind: Direction } | { kind: "confirm" } | { kind: "back" } | { kind: "pick"; index: number };

export type ActionHandler = (action: Action) => boolean;

const handlers: ActionHandler[] = [];

const KEY_ACTIONS: Record<string, Action> = {
  ArrowLeft: { kind: "left" },
  ArrowRight: { kind: "right" },
  ArrowUp: { kind: "up" },
  ArrowDown: { kind: "down" },
  " ": { kind: "confirm" },
  Enter: { kind: "confirm" },
  Backspace: { kind: "back" },
  Escape: { kind: "back" },
};

const swallowedKeys = new Set<string>();

export function onAction(handler: ActionHandler): () => void {
  handlers.push(handler);
  return () => {
    const index = handlers.lastIndexOf(handler);
    if (index !== -1) handlers.splice(index, 1);
  };
}

export function emit(action: Action): boolean {
  for (let index = handlers.length - 1; index >= 0; index -= 1) {
    if (handlers[index]!(action)) return true;
  }
  return false;
}

function isDirection(action: Action): boolean {
  return action.kind === "left" || action.kind === "right" || action.kind === "up" || action.kind === "down";
}

function actionForKey(event: KeyboardEvent): Action | null {
  if (event.metaKey || event.ctrlKey || event.altKey) return null;
  const mapped = KEY_ACTIONS[event.key];
  if (mapped) return mapped;
  const number = Number(event.key);
  if (Number.isInteger(number) && number >= 1 && number <= 9) return { kind: "pick", index: number - 1 };
  return null;
}

export function watchKeyboard(): void {
  window.addEventListener(
    "keydown",
    (event) => {
      const action = actionForKey(event);
      if (!action) return;
      event.preventDefault();
      swallowedKeys.add(event.code);
      if (event.repeat && !isDirection(action)) return;
      emit(action);
    },
    { capture: true },
  );
  window.addEventListener(
    "keyup",
    (event) => {
      if (!swallowedKeys.delete(event.code)) return;
      event.preventDefault();
    },
    { capture: true },
  );
  window.addEventListener("blur", () => swallowedKeys.clear());
}
