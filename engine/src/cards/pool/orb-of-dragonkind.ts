import { defineCard } from "../define.js";

const MANA_TEXT =
  "{1}, {T}: Add two mana in any combination of colors. Spend this mana only to cast Dragon spells or activate abilities of Dragons.";
const LOOK_TEXT =
  "{R}, {T}, Sacrifice this artifact: Look at the top seven cards of your library. You may reveal a Dragon card from among them and put it into your hand. Put the rest on the bottom of your library in a random order.";

// A Dragon card is one with the creature type Dragon, not "Dragon" in its
// name (the ruling). "Abilities of Dragons" are Dragon permanents' (rule
// 109.2).
export default defineCard({
  name: "Orb of Dragonkind",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["artifact"],
  text: `${MANA_TEXT}\n${LOOK_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: { oneOf: ["W", "U", "B", "R", "G"] },
        amount: 2,
        spendOnly: {
          spell: { subtype: "Dragon" },
          abilityOf: { subtype: "Dragon" },
          text: "Spend this mana only to cast Dragon spells or activate abilities of Dragons.",
        },
      },
      resolve: null,
      text: MANA_TEXT,
    },
    {
      cost: { mana: "{R}", tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 7,
        reveal: "chosen",
        min: 0,
        max: 1,
        filter: { subtype: "Dragon" },
        destination: "hand",
        leftover: "bottom-random",
      },
      resolve: null,
      text: LOOK_TEXT,
    },
  ],
});
