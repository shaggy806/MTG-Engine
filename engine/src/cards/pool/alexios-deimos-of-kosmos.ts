import { defineCard } from "../define.js";

// #312 in top-commanders.txt.
//
// Rulings:
//   [2024-07-05] Alexios can attack planeswalkers its owner controls and battles its owner
//     protects. ("cant-attack-owner" names the player only.)
//   [2024-07-05] If Alexios is controlled by a player other than its owner and its controller
//     leaves the game, the effect giving that player control of Alexios ends. Alexios will return
//     to the control of the player still in the game who most recently controlled it.
//     (Every other player's latest control effect is kept — see `gainControlByEffect`.)
//   [2024-07-05] Alexios can't be sacrificed for any reason. If an effect instructs you to
//     sacrifice it, you can't and it remains on the battlefield. You also can't sacrifice it to
//     pay a cost that requires you to sacrifice a creature.
//   [2024-07-05] If Alexios can't attack for any reason (such as being tapped), then it doesn't
//     attack. If there's a cost associated with having it attack, its controller isn't forced to
//     pay that cost, so it doesn't have to attack in that case either.
//   [2024-07-05] If Alexios's owner leaves the game, Alexios leaves the game along with them.
//   [2024-07-05] If an effect instructs you to sacrifice a creature and you control any creatures
//     other than Alexios, you must sacrifice one of those other creatures. You can't try to
//     sacrifice Alexios.

const STATIC_TEXT = "Alexios attacks each combat if able, can't be sacrificed, and can't attack its owner.";
const UPKEEP_TEXT =
  "At the beginning of each player's upkeep, that player gains control of Alexios, untaps it, and " +
  "puts a +1/+1 counter on it. It gains haste until end of turn.";

export default defineCard({
  name: "Alexios, Deimos of Kosmos",
  manaCost: "{3}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Berserker"],
  power: 4,
  toughness: 4,
  keywords: ["trample"],
  text: `Trample\n${STATIC_TEXT}\n${UPKEEP_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["must-attack", "cant-attack-owner"],
      cantBeSacrificed: true,
      text: STATIC_TEXT,
    },
  ],
  triggered: [
    {
      // "That player" is the one whose upkeep it is: they gain control, and
      // they are the one untapping it and putting the counter on it — so if
      // they have left the game by then, none of that happens (800.4b), and
      // only "it gains haste" still does.
      trigger: { on: "step-begins", step: "upkeep", who: "any" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-control", target: "source", who: "active-player", untilEndOfTurn: false },
          { kind: "untap", target: "source", by: "active-player" },
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1, by: "active-player" },
          { kind: "grant-keyword", target: "source", keyword: "haste", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
