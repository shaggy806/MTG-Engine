import { defineCard } from "../define.js";

export default defineCard({
  name: "Scrivener",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 2,
  text: "When this creature enters, you may return target instant card from your graveyard to your hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "instant" } }],
      effect: {
        kind: "may",
        prompt: "Return target instant card from your graveyard to your hand?",
        effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
      resolve: null,
      text: "When this creature enters, you may return target instant card from your graveyard to your hand.",
    },
  ],
});
