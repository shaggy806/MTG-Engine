import { defineCard } from "../define.js";

export default defineCard({
  name: "Thrasios, Triton Hero",
  manaCost: "{G}{U}",
  colors: ["G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Merfolk", "Wizard"],
  power: 1,
  toughness: 3,
  pairing: { kind: "partner" },
  text:
    "{4}: Scry 1, then reveal the top card of your library. If it's a land card, put it onto " +
    "the battlefield tapped. Otherwise, draw a card.\n" +
    "Partner (You can have two commanders if both have partner.)",
  activated: [
    {
      cost: { mana: "{4}", tap: false },
      targets: [],
      effect: {
        kind: "scry",
        amount: 1,
        then: {
          // The nonland card revealed is the one drawn (2020-11-10 ruling):
          // nothing moves between the reveal and the draw.
          kind: "reveal-top",
          then: {
            kind: "conditional",
            condition: { kind: "target", index: 0, filter: { type: "land" } },
            then: { kind: "put-onto-battlefield", target: 0, enterTapped: true },
            else: { kind: "draw", amount: 1 },
          },
        },
      },
      resolve: null,
      text:
        "{4}: Scry 1, then reveal the top card of your library. If it's a land card, put it onto " +
        "the battlefield tapped. Otherwise, draw a card.",
    },
  ],
});
