const END_RUN_CODE = "pinkslip";

let armed = false;

export function watchDevCodes(): void {
  let typed = "";
  window.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.key.length !== 1) return;
    typed = (typed + event.key.toLowerCase()).slice(-END_RUN_CODE.length);
    if (typed !== END_RUN_CODE) return;
    typed = "";
    armed = true;
  });
}

export function takeDevEnd(): boolean {
  const wasArmed = armed;
  armed = false;
  return wasArmed;
}
