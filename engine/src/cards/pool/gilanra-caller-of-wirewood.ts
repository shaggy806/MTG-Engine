import { defineCard } from "../define.js";

const MANA_TEXT =
  "{T}: Add {G}. When you spend this mana to cast a spell with mana value 6 or greater, " +
  "draw a card.";

export default defineCard({
  name: "Gilanra, Caller of Wirewood",
  manaCost: "{2}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 2,
  toughness: 3,
  text: `${MANA_TEXT}\nPartner (You can have two commanders if both have partner.)`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "G",
        amount: 1,
        // A rider on the unit of mana, fired as it is spent (rule 106.12):
        // only a *cast* fires one, so mana spent on an ability draws nothing,
        // and the spell is already on the stack with its X chosen, so an X
        // spell counts at its full mana value there (rule 202.3e).
        whenSpent: {
          spell: { manaValue: { op: "gte", n: 6 } },
          effect: { kind: "draw", amount: 1 },
          text: "When you spend this mana to cast a spell with mana value 6 or greater, draw a card.",
        },
      },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
