import { defineCard } from "../define.js";

export default defineCard({
  name: "Cemetery Reaper",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 2,
  toughness: 2,
  text:
    "Other Zombie creatures you control get +1/+1.\n" +
    "{2}{B}, {T}: Exile target creature card from a graveyard. Create a 2/2 black Zombie creature token.",
  static: [
    {
      affects: { scope: "creatures-you-control", subtype: "Zombie", excludeSelf: true },
      grantPt: [1, 1],
      text: "Other Zombie creatures you control get +1/+1.",
    },
  ],
  activated: [
    {
      cost: { mana: "{2}{B}", tap: true },
      targets: [{ kind: "card-in-graveyard", filter: { type: "creature" } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "exile", target: 0 },
          { kind: "create-token", token: "Zombie Token", count: 1 },
        ],
      },
      resolve: null,
      text: "{2}{B}, {T}: Exile target creature card from a graveyard. Create a 2/2 black Zombie creature token.",
    },
  ],
});
