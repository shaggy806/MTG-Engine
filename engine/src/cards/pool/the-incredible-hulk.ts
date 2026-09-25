import { defineCard } from "../define.js";

// The back face of Bruce Banner, castable on its own.
//
// "If he's attacking" is asked as the ability resolves.
const ENRAGE_TEXT =
  "Enrage — Whenever The Incredible Hulk is dealt damage, put a +1/+1 counter on him. If he's " +
  "attacking, untap him and there is an additional combat phase after this phase.";

export default defineCard({
  name: "The Incredible Hulk",
  art: "https://cards.scryfall.io/art_crop/back/e/0/e0dbbdcf-84e1-494f-8b8c-0a094f603fa9.jpg",
  manaCost: "{2}{R}{R}{G}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Gamma", "Berserker", "Hero"],
  power: 8,
  toughness: 8,
  keywords: ["reach", "trample"],
  text: `Reach, trample\n${ENRAGE_TEXT}`,
  triggered: [
    {
      trigger: { on: "dealt-damage", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
          {
            kind: "conditional",
            condition: { kind: "source", filter: { attacking: true } },
            then: {
              kind: "sequence",
              effects: [
                { kind: "untap", target: "source" },
                { kind: "additional-combat", afterThisPhase: true },
              ],
            },
          },
        ],
      },
      resolve: null,
      text: ENRAGE_TEXT,
    },
  ],
  faces: ["Bruce Banner", "The Incredible Hulk"],
});
