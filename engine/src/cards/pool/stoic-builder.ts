import { defineCard } from "../define.js";

export default defineCard({
  name: "Stoic Builder",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human"],
  power: 2,
  toughness: 3,
  text: "When this creature enters, you may return target land card from your graveyard to your hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "land" } }],
      effect: {
        kind: "may",
        prompt: "Return target land card from your graveyard to your hand?",
        effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
      resolve: null,
      text: "When this creature enters, you may return target land card from your graveyard to your hand.",
    },
  ],
});
