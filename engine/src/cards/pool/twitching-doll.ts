import { defineCard } from "../define.js";

const MANA_TEXT = "{T}: Add one mana of any color. Put a nest counter on this creature.";
const SPIDER_TEXT =
  "{T}, Sacrifice this creature: Create a 2/2 green Spider creature token with reach for each " +
  "counter on this creature. Activate only as a sorcery.";

// The counter is part of the mana ability (`also`), so it goes on whether
// the Doll is tapped by hand or by the auto-payer. Every counter counts, of
// any kind, as the Doll last existed (rule 608.2h).
export default defineCard({
  name: "Twitching Doll",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["artifact", "creature"],
  subtypes: ["Spider", "Toy"],
  power: 2,
  toughness: 2,
  text: `${MANA_TEXT}\n${SPIDER_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: 1,
        also: { kind: "add-counter", target: "source", counter: "nest", amount: 1 },
      },
      resolve: null,
      text: MANA_TEXT,
    },
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      sorcerySpeed: true,
      targets: [],
      effect: {
        kind: "create-token",
        token: "2/2 Green Spider Token (Reach)",
        count: { countersOn: "source" },
      },
      resolve: null,
      text: SPIDER_TEXT,
    },
  ],
});
