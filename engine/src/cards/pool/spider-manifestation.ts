import { defineCard } from "../define.js";

// EDHREC rank 3908.

const UNTAP_TEXT = "Whenever you cast a spell with mana value 4 or greater, untap this creature.";

export default defineCard({
  name: "Spider Manifestation",
  manaCost: "{1}{R/G}",
  colors: ["R", "G"],
  types: ["creature"],
  subtypes: ["Spider", "Avatar"],
  power: 2,
  toughness: 2,
  keywords: ["reach"],
  text: `Reach\n{T}: Add {R} or {G}.\n${UNTAP_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["R", "G"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {R} or {G}.",
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { manaValue: { op: "gte", n: 4 } } },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: UNTAP_TEXT,
    },
  ],
});
