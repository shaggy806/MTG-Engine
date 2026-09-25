import { defineCard } from "../define.js";

// #319 in top-commanders.txt.
//
// - "Enters or attacks" is two triggers of one ability.
// - The return is a graveyard ability that doesn't move the card as a cost
//   (`staysInZone`): its effect returns it, with the other card, as one
//   instruction (`simultaneous`), so they enter together. A target chosen
//   and gone by resolution counters the whole ability, and this card stays
//   where it is (2023-04-14 ruling); choosing none returns it alone.
const MAKE_TEXT = "Whenever Slimefoot and Squee enters or attacks, create a 1/1 green Saproling creature token.";
const RETURN_TEXT =
  "{1}{B}{R}{G}, Sacrifice a Saproling: Return this card and up to one other target creature card from " +
  "your graveyard to the battlefield. Activate only as a sorcery.";
const saproling = { kind: "create-token", token: "Saproling Token", count: 1 } as const;

export default defineCard({
  name: "Slimefoot and Squee",
  manaCost: "{B}{R}{G}",
  colors: ["B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Fungus", "Goblin"],
  power: 3,
  toughness: 3,
  text: `${MAKE_TEXT}\n${RETURN_TEXT}`,
  triggered: [
    { trigger: { on: "enters-battlefield", who: "self" }, targets: [], effect: saproling, resolve: null, text: MAKE_TEXT },
    { trigger: { on: "attacks", who: "self" }, targets: [], effect: saproling, resolve: null, text: MAKE_TEXT },
  ],
  activated: [
    {
      cost: { mana: "{1}{B}{R}{G}", tap: false, sacrifice: { filter: { subtype: "Saproling" } } },
      zone: "graveyard",
      staysInZone: true,
      sorcerySpeed: true,
      targets: [
        {
          kind: "optional",
          of: { kind: "other", of: { kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } } },
        },
      ],
      effect: {
        kind: "sequence",
        simultaneous: true,
        effects: [
          { kind: "put-onto-battlefield", target: "source" },
          { kind: "put-onto-battlefield", target: 0 },
        ],
      },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
