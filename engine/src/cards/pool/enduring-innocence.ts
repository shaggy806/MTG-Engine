import { defineCard } from "../define.js";
import { enduringReturn } from "../helpers.js";

const DRAW_TEXT =
  "Whenever one or more other creatures you control with power 2 or less enter, draw a card. " +
  "This ability triggers only once each turn.";

// The power is read as each creature enters, counters it enters with
// included (the ruling) — the trigger's filter. Once a turn, so a batch of
// small creatures draws one card.
export default defineCard({
  name: "Enduring Innocence",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["enchantment", "creature"],
  subtypes: ["Sheep", "Glimmer"],
  power: 2,
  toughness: 1,
  keywords: ["lifelink"],
  text: `Lifelink\n${DRAW_TEXT}\n${enduringReturn("Enduring Innocence").text}`,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        otherOnly: true,
        filter: { type: "creature", power: { op: "lte", n: 2 } },
      },
      oncePerTurn: true,
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
    enduringReturn("Enduring Innocence"),
  ],
});
