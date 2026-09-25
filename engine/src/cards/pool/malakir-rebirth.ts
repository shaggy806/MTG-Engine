import { defineCard } from "../define.js";

const RETURN_TEXT =
  "When this creature dies, return it to the battlefield tapped under its owner's control.";

/** A modal double-faced card (instant // land) — its back face, Malakir Mire,
 * is a land you play instead. */
export default defineCard({
  name: "Malakir Rebirth",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  text:
    'Choose target creature. You lose 2 life. Until end of turn, that creature gains "When this ' +
    "creature dies, return it to the battlefield tapped under its owner's control.\"",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "lose-life", amount: 2 },
      {
        kind: "grant-triggered",
        target: 0,
        duration: "end-of-turn",
        ability: {
          trigger: { on: "dies", who: "self" },
          targets: [],
          // The creature that died is the trigger object, followed to the
          // graveyard it went to (Undying's shape) — under its owner's
          // control, which is where `put-onto-battlefield` puts it by default.
          effect: { kind: "put-onto-battlefield", target: "trigger-object", enterTapped: true },
          resolve: null,
          text: RETURN_TEXT,
        },
      },
    ],
  },
  faces: ["Malakir Rebirth", "Malakir Mire"],
});
