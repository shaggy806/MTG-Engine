import { defineCard } from "../define.js";

export default defineCard({
  name: "Strongarm Thug",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Mercenary"],
  power: 1,
  toughness: 1,
  text: "When this creature enters, you may return target Mercenary card from your graveyard to your hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { subtype: "Mercenary" } }],
      effect: {
        kind: "may",
        prompt: "Return target Mercenary card from your graveyard to your hand?",
        effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
      resolve: null,
      text: "When this creature enters, you may return target Mercenary card from your graveyard to your hand.",
    },
  ],
});
