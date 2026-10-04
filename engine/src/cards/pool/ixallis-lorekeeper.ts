import { defineCard } from "../define.js";

// EDHREC rank 6023.
// "A Dinosaur source" includes a Dinosaur card in a hand or graveyard (the
// ruling) — `abilityOfAnyZone`, as Flamebraider's.

const TEXT =
  "{T}: Add one mana of any color. Spend this mana only to cast a Dinosaur spell or activate an ability of a Dinosaur source.";

export default defineCard({
  name: "Ixalli's Lorekeeper",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 1,
  toughness: 1,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: 1,
        spendOnly: {
          spell: { subtype: "Dinosaur" },
          abilityOf: { subtype: "Dinosaur" },
          abilityOfAnyZone: true,
          text: "Spend this mana only to cast a Dinosaur spell or activate an ability of a Dinosaur source.",
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
