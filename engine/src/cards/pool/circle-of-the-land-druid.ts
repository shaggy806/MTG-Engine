import { defineCard } from "../define.js";

export default defineCard({
  name: "Circle of the Land Druid",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Gnome", "Druid"],
  power: 1,
  toughness: 1,
  text: "When this creature enters, you may mill four cards. (You may put the top four cards of your library into your graveyard.)\nNatural Recovery — When this creature dies, return target land card from your graveyard to your hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Mill four cards?",
        effect: { kind: "mill", target: "you", amount: 4 },
      },
      resolve: null,
      text: "When this creature enters, you may mill four cards.",
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "land" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "Natural Recovery — When this creature dies, return target land card from your graveyard to your hand.",
    },
  ],
});
