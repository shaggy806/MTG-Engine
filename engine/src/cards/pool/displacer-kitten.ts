import { defineCard } from "../define.js";

/** "Up to one target": with nothing worth blinking, the player can leave the
 * slot empty even when Displacer Kitten is the only candidate — it isn't
 * forced to blink itself. A token blinked this way ceases to exist (the
 * 2022-06-10 ruling). */
export default defineCard({
  name: "Displacer Kitten",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Cat", "Beast"],
  power: 2,
  toughness: 2,
  text:
    "Avoidance — Whenever you cast a noncreature spell, exile up to one target nonland permanent " +
    "you control, then return that card to the battlefield under its owner's control.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [
        {
          kind: "optional",
          of: { kind: "permanent", whose: "you", filter: { notTypes: ["land"] } },
        },
      ],
      effect: { kind: "flicker", target: 0 },
      resolve: null,
      text:
        "Avoidance — Whenever you cast a noncreature spell, exile up to one target nonland permanent " +
        "you control, then return that card to the battlefield under its owner's control.",
    },
  ],
});
