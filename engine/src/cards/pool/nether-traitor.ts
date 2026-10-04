import { defineCard } from "../define.js";

// EDHREC rank 2389.
//
// Rulings:
//   [2021-03-19] Once a creature has been blocked, that creature remains blocked and will deal and
//     be dealt combat damage even if it gains or loses shadow or if the blocking creature gains or
//     loses shadow.
//   [2021-03-19] Multiple instances of shadow on the same creature are redundant.
//   [2021-03-19] If multiple creatures are put into your graveyard at the same time, Nether
//     Traitor's ability triggers for each of them. Once you return it to the battlefield, you may
//     pay {B} for the other abilities as they resolve, but they'll have no effect if you do. Even
//     if Nether Traitor returns to your graveyard, it's considered a new object and won't be
//     returned.
//   [2021-03-19] A token you own that dies is put into your graveyard before it ceases to exist.
//   [2021-03-19] If an attacking creature has multiple evasion abilities, such as shadow and
//     flying, a creature can block it only if that creature satisfies all of the appropriate
//     evasion abilities.
//   [2021-03-19] If Nether Traitor and another creature are put into your graveyard at the same
//     time, Nether Traitor's ability won't trigger. This is because it must be in your graveyard
//     before the creature dies in order for its ability that returns it to the battlefield to
//     trigger.

const SHADOW_TEXT = "Shadow (This creature can block or be blocked by only creatures with shadow.)";
const RETURN_TEXT =
  "Whenever another creature is put into your graveyard from the battlefield, you may pay {B}. If you do, return this card from your graveyard to the battlefield.";

export default defineCard({
  name: "Nether Traitor",
  manaCost: "{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 1,
  keywords: ["haste", "shadow"],
  text: `Haste\n${SHADOW_TEXT}\n${RETURN_TEXT}`,
  triggered: [
    {
      // Works only from the graveyard (rule 113.6k). A creature dying
      // alongside it isn't seen (the rulings — `fromGraveyard`).
      fromGraveyard: true,
      // "Your graveyard": a creature you own, whoever controlled it; a token
      // you own counts (the rulings).
      trigger: { on: "dies", who: "any", otherOnly: true, filter: { type: "creature", ownedBy: "you" } },
      targets: [],
      // Once it has returned, a second trigger can still be paid for, to no
      // effect: "source" is the card only while it's the same object (rule 400.7).
      effect: {
        kind: "may",
        prompt: "Pay {B} to return Nether Traitor to the battlefield?",
        cost: "{B}",
        effect: { kind: "put-onto-battlefield", target: "source" },
      },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
