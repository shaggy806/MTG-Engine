import { defineCard } from "../define.js";

export default defineCard({
  name: "Anarchist",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 2,
  text: "When this creature enters, you may return target sorcery card from your graveyard to your hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "sorcery" } }],
      effect: {
        kind: "may",
        prompt: "Return target sorcery card from your graveyard to your hand?",
        effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
      resolve: null,
      text: "When this creature enters, you may return target sorcery card from your graveyard to your hand.",
    },
  ],
});
