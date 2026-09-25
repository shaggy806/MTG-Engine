import { defineCard } from "../define.js";

export default defineCard({
  name: "Altanak, the Thrice-Called",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Insect", "Beast"],
  power: 9,
  toughness: 9,
  keywords: ["trample"],
  text: "Trample\nWhenever Altanak becomes the target of a spell or ability an opponent controls, draw a card.\n{1}{G}, Discard this card: Return target land card from your graveyard to the battlefield tapped.",
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "land" } }],
      effect: { kind: "put-onto-battlefield", target: 0, enterTapped: true },
      resolve: null,
      text: "{1}{G}, Discard this card: Return target land card from your graveyard to the battlefield tapped.",
      zone: "hand",
    },
  ],
  triggered: [
    {
      trigger: { on: "becomes-target", who: "self", byOpponentOnly: true },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever Altanak becomes the target of a spell or ability an opponent controls, draw a card.",
    },
  ],
});
