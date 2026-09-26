import { defineCard } from "../define.js";

// #392 in top-commanders.txt.
//
// The direction is the "as this enters" word (`chooseOnEnter`), and the rule
// every player attacks under reads it (`attackOnlyNearestOpponent`): left is
// onward in turn order, right is back, skipping players who have lost. Every
// Pramikon's direction applies at once, so two that disagree leave nobody to
// attack while three or more players are left (the ruling); one that entered
// some way that didn't ask has no direction, and no effect (the other).
const CHOOSE_TEXT = "As Pramikon enters, choose left or right.";
const ATTACK_TEXT =
  "Each player may attack only the nearest opponent in the chosen direction and planeswalkers " +
  "controlled by that opponent.";

export default defineCard({
  name: "Pramikon, Sky Rampart",
  manaCost: "{U}{R}{W}",
  colors: ["W", "U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 1,
  toughness: 5,
  keywords: ["flying", "defender"],
  text: `Flying, defender\n${CHOOSE_TEXT}\n${ATTACK_TEXT}`,
  chooseOnEnter: ["left", "right"],
  static: [{ affects: { scope: "self" }, attackOnlyNearestOpponent: true, text: ATTACK_TEXT }],
});
