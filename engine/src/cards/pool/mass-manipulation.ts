import { defineCard } from "../define.js";

// EDHREC rank 6297.
// Exactly X targets, X chosen first (Curse of the Swine's `min`/`max: "x"` group). The control
// change lasts indefinitely (`untilEndOfTurn: false` — the second ruling).
//
// Rulings:
//   [2019-01-25] In a multiplayer game, if a player leaves the game, all cards that player owns
//     leave as well, and any effects that give the player control of permanents immediately end.
//   [2019-01-25] The control-change effect of Mass Manipulation lasts indefinitely. It doesn’t
//     wear off during the cleanup step.

export default defineCard({
  name: "Mass Manipulation",
  manaCost: "{X}{X}{U}{U}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Gain control of X target creatures and/or planeswalkers.",
  targets: [
    {
      kind: "any-number",
      of: { kind: "permanent", filter: { typesAnyOf: ["creature", "planeswalker"] } },
      min: "x",
      max: "x",
    },
  ],
  effect: {
    kind: "for-each-target",
    from: 0,
    effect: { kind: "gain-control", target: 0, untilEndOfTurn: false },
    simultaneous: true,
  },
});
