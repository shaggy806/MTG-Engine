import { defineCard } from "../define.js";

// "A Saproling you control dies" is matched against the creature as it last
// existed on the battlefield (rule 603.10a) — its creature types then, and
// who controlled it — and a Saproling token that has since ceased to exist
// still counts. Saprolings dying alongside Slimefoot still trigger it, once
// each (the card's ruling), and it deals that damage as it last existed.
export default defineCard({
  name: "Slimefoot, the Stowaway",
  manaCost: "{1}{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Fungus"],
  power: 2,
  toughness: 3,
  text:
    "Whenever a Saproling you control dies, Slimefoot deals 1 damage to each opponent and you " +
    "gain 1 life.\n" +
    "{4}: Create a 1/1 green Saproling creature token.",
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { subtype: "Saproling" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "damage", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text:
        "Whenever a Saproling you control dies, Slimefoot deals 1 damage to each opponent and " +
        "you gain 1 life.",
    },
  ],
  activated: [
    {
      cost: { mana: "{4}", tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Saproling Token", count: 1 },
      resolve: null,
      text: "{4}: Create a 1/1 green Saproling creature token.",
    },
  ],
});
