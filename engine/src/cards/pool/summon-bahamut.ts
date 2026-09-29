import { defineCard } from "../define.js";

const DESTROY_TEXT = "I, II — Destroy up to one target nonland permanent.";
const FLARE_TEXT =
  "IV — Mega Flare — This creature deals damage equal to the total mana value of other permanents you control to each opponent.";

// The total is read as chapter IV resolves (the ruling), from printed costs —
// {X} as 0, a transformed permanent by its front face.
export default defineCard({
  name: "Summon: Bahamut",
  manaCost: "{9}",
  colors: [],
  types: ["enchantment", "creature"],
  subtypes: ["Saga", "Dragon"],
  power: 9,
  toughness: 9,
  keywords: ["flying"],
  text:
    "(As this Saga enters and after your draw step, add a lore counter. Sacrifice after IV.)\n" +
    `${DESTROY_TEXT}\nIII — Draw two cards.\n${FLARE_TEXT}\nFlying`,
  chapters: [
    {
      at: [1, 2],
      targets: [{ kind: "optional", of: "nonland-permanent" }],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: DESTROY_TEXT,
    },
    {
      at: [3],
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "III — Draw two cards.",
    },
    {
      at: [4],
      targets: [],
      effect: {
        kind: "damage",
        amount: { aggregate: "sum", of: "mana-value", filter: { controlledBy: "you" }, excludeSelf: true },
        who: "each-opponent",
      },
      resolve: null,
      text: FLARE_TEXT,
    },
  ],
});
