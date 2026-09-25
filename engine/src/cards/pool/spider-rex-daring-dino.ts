import { defineCard } from "../define.js";

export default defineCard({
  name: "Spider-Rex, Daring Dino",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spider", "Dinosaur", "Hero"],
  power: 6,
  toughness: 6,
  keywords: ["reach", "trample"],
  text: "Reach, trample\nWard {2} (Whenever this creature becomes the target of a spell or ability an opponent controls, counter it unless that player pays {2}.)",
  triggered: [
    {
      trigger: { on: "becomes-target", who: "self", byOpponentOnly: true },
      targets: [],
      effect: { kind: "ward", cost: { mana: "{2}" } },
      resolve: null,
      text: "Ward {2}",
    },
  ],
});
