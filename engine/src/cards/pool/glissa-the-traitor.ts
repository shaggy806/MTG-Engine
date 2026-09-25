import { defineCard } from "../define.js";

export default defineCard({
  name: "Glissa, the Traitor",
  manaCost: "{B}{G}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Zombie", "Elf"],
  power: 3,
  toughness: 3,
  keywords: ["first-strike", "deathtouch"],
  text: "First strike, deathtouch\nWhenever a creature an opponent controls dies, you may return target artifact card from your graveyard to your hand.",
  triggered: [
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature", controlledBy: "opponent" } },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "artifact" } }],
      effect: {
        kind: "may",
        prompt: "Return target artifact card from your graveyard to your hand?",
        effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
      resolve: null,
      text: "Whenever a creature an opponent controls dies, you may return target artifact card from your graveyard to your hand.",
    },
  ],
});
