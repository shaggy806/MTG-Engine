import { defineCard } from "../define.js";

/** The back face of Venat, Heart of Hydaelyn. */
const BLESSING_TEXT =
  "Blessing of Light — At the beginning of combat on your turn, put a +1/+1 counter on another target creature " +
  "you control. Until your next turn, it gains indestructible. If that creature is legendary, draw a card.";

// A target gone illegal fizzles the whole ability: no counter, no draw (the
// ruling). "Is legendary" is read as it resolves.
export default defineCard({
  name: "Hydaelyn, the Mothercrystal",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["God"],
  power: 4,
  toughness: 4,
  keywords: ["indestructible"],
  text: `Indestructible\n${BLESSING_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [{ kind: "other", of: "creature-you-control" }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
          { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "until-your-next-turn" },
          {
            kind: "conditional",
            condition: { kind: "target", index: 0, filter: { supertype: "legendary" } },
            then: { kind: "draw", amount: 1 },
          },
        ],
      },
      resolve: null,
      text: BLESSING_TEXT,
    },
  ],
  faces: ["Venat, Heart of Hydaelyn", "Hydaelyn, the Mothercrystal"],
  transform: true,
});
