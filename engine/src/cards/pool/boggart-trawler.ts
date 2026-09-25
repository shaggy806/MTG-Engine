import { defineCard } from "../define.js";

export default defineCard({
  name: "Boggart Trawler",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Goblin"],
  power: 3,
  toughness: 1,
  text: "When this creature enters, exile target player's graveyard.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["player"],
      effect: { kind: "exile-graveyard", target: 0 },
      resolve: null,
      text: "When this creature enters, exile target player's graveyard.",
    },
  ],
  faces: ["Boggart Trawler", "Boggart Bog"],
});
