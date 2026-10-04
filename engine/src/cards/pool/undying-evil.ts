import { defineCard } from "../define.js";
import { undying } from "../helpers.js";

// EDHREC rank 4383.
// Undying granted until end of turn is the `undying()` triggered ability
// (Mikaeus's grant) put on the creature by `grant-triggered`, Undying
// Malice's shape.

export default defineCard({
  name: "Undying Evil",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target creature gains undying until end of turn. (When it dies, if it had no +1/+1 counters on it, return it to the battlefield under its owner's control with a +1/+1 counter on it.)",
  targets: ["creature"],
  effect: { kind: "grant-triggered", target: 0, duration: "end-of-turn", ability: undying() },
});
