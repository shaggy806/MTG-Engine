import { defineCard } from "../define.js";

// #359 in top-commanders.txt.
//
// "If it wasn't put onto the battlefield with this ability" is
// `putThereBySource: false` on the trigger's filter, which is what stops a
// chain. The mana-value bound is read off the entering permanent.
const TEXT =
  "Whenever another permanent you control enters, if it wasn't put onto the battlefield with this " +
  "ability, you may put a permanent card with equal or lesser mana value from your hand onto the battlefield.";

export default defineCard({
  name: "Kodama of the East Tree",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 6,
  toughness: 6,
  keywords: ["reach"],
  pairing: { kind: "partner" },
  text: `Reach\n${TEXT}\nPartner (You can have two commanders if both have partner.)`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", otherOnly: true, filter: { putThereBySource: false } },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: {
          typesAnyOf: ["artifact", "creature", "enchantment", "land", "planeswalker", "battle"],
          manaValue: { op: "lte", n: { amount: { manaValueOf: "trigger-object" } } },
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
