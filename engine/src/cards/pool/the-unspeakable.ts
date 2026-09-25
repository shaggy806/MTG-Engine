import { defineCard } from "../define.js";

export default defineCard({
  name: "The Unspeakable",
  manaCost: "{6}{U}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 6,
  toughness: 7,
  keywords: ["flying", "trample"],
  text: "Flying, trample\nWhenever The Unspeakable deals combat damage to a player, you may return target Arcane card from your graveyard to your hand.",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { subtype: "Arcane" } }],
      effect: {
        kind: "may",
        prompt: "Return target Arcane card from your graveyard to your hand?",
        effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
      resolve: null,
      text: "Whenever The Unspeakable deals combat damage to a player, you may return target Arcane card from your graveyard to your hand.",
    },
  ],
});
