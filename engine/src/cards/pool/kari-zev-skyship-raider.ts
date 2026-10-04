import { defineCard } from "../define.js";

// EDHREC rank 5885.
//
// Rulings:
//   [2017-02-09] You choose which opponent or opposing planeswalker Ragavan is attacking as you
//     create the token. It doesn't have to be the same player or planeswalker Kari Zev is
//     attacking.
//   [2017-02-09] Although Ragavan is attacking, it was never declared as an attacking creature
//     (for the purposes of abilities that trigger whenever a creature attacks, for example).
//   [2017-02-09] The delayed triggered ability that exiles Ragavan triggers at end of combat even
//     if Kari Zev is no longer on the battlefield.

const ATTACK_TEXT =
  "Whenever Kari Zev attacks, create Ragavan, a legendary 2/1 red Monkey creature token. Ragavan enters tapped and attacking. Exile that token at end of combat.";

export default defineCard({
  name: "Kari Zev, Skyship Raider",
  manaCost: "{1}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Pirate"],
  power: 1,
  toughness: 3,
  keywords: ["first-strike", "menace"],
  text: `First strike, menace\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          // The controller picks whom it attacks as it's created (the ruling).
          { kind: "create-token", token: "Ragavan", count: 1, tapped: true, attacking: "choose" },
          // A delayed ability about the token just made (Satya's shape), at the
          // next end of combat step — this combat's.
          {
            kind: "delayed-trigger",
            at: "end-of-combat",
            about: "created",
            effect: { kind: "exile", target: 0 },
            text: "Exile that token at end of combat.",
          },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
