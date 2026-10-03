import { defineCard } from "../define.js";

const TEXT = "Vivid — {T}: For each color among permanents you control, add one mana of that color.";

// One of each colour among them, each once however many have it — at most
// {W}{U}{B}{R}{G}, never {C} (the rulings). Vivid is an ability word.
export default defineCard({
  name: "Bloom Tender",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 1,
  toughness: 1,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { eachColorAmong: { controlledBy: "you" } }, amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
