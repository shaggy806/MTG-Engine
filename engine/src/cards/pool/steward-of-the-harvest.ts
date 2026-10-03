import { defineCard } from "../define.js";

// The land cards are exiled with this creature (rule 607.2a), and only their
// activated abilities pass on — not triggered, static or other keyword
// abilities. A land card with a basic land type has its intrinsic mana
// ability ("{T}: Add {G}" for a Forest), and an ability naming the land means
// the creature that has it (the rulings). A creature can't use a {T} ability
// while it's summoning sick (rule 302.6).
const ETB_TEXT = "When this creature enters, exile up to three target land cards from your graveyard.";
const GRANT_TEXT = "Creatures you control have all activated abilities of all land cards exiled with this creature.";

export default defineCard({
  name: "Steward of the Harvest",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 3,
  toughness: 3,
  text: `${ETB_TEXT}\n${GRANT_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [
        { kind: "any-number", of: { kind: "card-in-graveyard", whose: "you", filter: { type: "land" } }, max: 3 },
      ],
      effect: {
        kind: "for-each-target",
        from: 0,
        effect: { kind: "exile", target: 0, linked: true },
        simultaneous: true,
      },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantsActivatedOfLinkedExile: true,
      text: GRANT_TEXT,
    },
  ],
});
