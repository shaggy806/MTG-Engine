import { defineCard } from "../define.js";

export default defineCard({
  name: "Quarry Beetle",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 4,
  toughness: 5,
  text: "When this creature enters, you may return target land card from your graveyard to the battlefield.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "land" } }],
      effect: {
        kind: "may",
        prompt: "Return target land card from your graveyard to the battlefield?",
        effect: { kind: "put-onto-battlefield", target: 0 },
      },
      resolve: null,
      text: "When this creature enters, you may return target land card from your graveyard to the battlefield.",
    },
  ],
});
