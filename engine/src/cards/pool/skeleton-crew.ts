import { defineCard } from "../define.js";

// EDHREC rank 5775.
// Makes Skeleton Pirate → new token "Skeleton Pirate Token" (scaffolded).
//
// Rulings:
//   [2023-11-10] Resolving Skeleton Crew's last ability won't cause its second ability to trigger.
//   [2023-11-10] If two or more creature cards leave your graveyard as a single event, Skeleton
//     Crew's second ability will trigger once. If they leave your graveyard as separate events, it
//     will trigger once for each event.

export default defineCard({
  name: "Skeleton Crew",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Skeleton", "Pirate"],
  power: 3,
  toughness: 3,
  text: "Each other creature you control that's a Skeleton or Pirate gets +1/+1.\nWhenever one or more creature cards leave your graveyard, create a 2/2 black Skeleton Pirate creature token. (This ability triggers only from the battlefield.)\n{5}{B}: Return this card from your graveyard to the battlefield tapped.",
  activated: [
    {
      cost: { mana: "{5}{B}", tap: false },
      zone: "graveyard",
      staysInZone: true,
      targets: [],
      effect: { kind: "put-onto-battlefield", target: "source", enterTapped: true },
      resolve: null,
      text: "{5}{B}: Return this card from your graveyard to the battlefield tapped.",
    },
  ],
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you", anyOf: [{ subtype: "Skeleton" }, { subtype: "Pirate" }] },
        excludeSelf: true,
      },
      grantPt: [1, 1],
      text: "Each other creature you control that's a Skeleton or Pirate gets +1/+1.",
    },
  ],
  triggered: [
    {
      // "One or more": once per move, however many creature cards left together.
      trigger: { on: "leaves-graveyard", who: "you", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "create-token", token: "Skeleton Pirate Token", count: 1 },
      resolve: null,
      text: "Whenever one or more creature cards leave your graveyard, create a 2/2 black Skeleton Pirate creature token.",
    },
  ],
});
