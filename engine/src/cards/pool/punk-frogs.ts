import { defineCard } from "../define.js";

export default defineCard({
  name: "Punk Frogs",
  manaCost: "{3}{G/U}{G/U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Frog", "Mutant", "Rebel"],
  power: 4,
  toughness: 5,
  text: "Ward {3} (Whenever this creature becomes the target of a spell or ability an opponent controls, counter it unless that player pays {3}.)",
  triggered: [
    {
      trigger: { on: "becomes-target", who: "self", byOpponentOnly: true },
      targets: [],
      effect: { kind: "ward", cost: { mana: "{3}" } },
      resolve: null,
      text: "Ward {3}",
    },
  ],
});
