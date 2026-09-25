import { defineCard } from "../define.js";

export default defineCard({
  name: "Archaeomender",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 3,
  text: "When this creature enters, return target artifact card from your graveyard to your hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "artifact" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "When this creature enters, return target artifact card from your graveyard to your hand.",
    },
  ],
});
