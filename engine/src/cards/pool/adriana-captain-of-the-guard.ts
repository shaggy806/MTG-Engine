import { defineCard } from "../define.js";
import { melee } from "../helpers.js";

// EDHREC rank 4862.
//
// Rulings:
//   [2016-08-23] Melee will trigger if the creature with melee attacks a planeswalker. However,
//     the effect counts only opponents (and not planeswalkers) that you attacked with a creature
//     when determining the bonus.
//   [2016-08-23] Creatures that enter the battlefield attacking were never declared as attackers,
//     so they won't count toward melee's effect. Similarly, if a creature with melee enters the
//     battlefield attacking, melee won't trigger.
//   [2016-08-23] You determine the size of the bonus as the melee ability resolves. Count each
//     opponent that you attacked with one or more creatures. It doesn't matter if the attacking
//     creatures are still attacking or even if they are still on the battlefield. It also doesn't
//     matter if the opponent you attacked is still in the game.
//   [2016-08-23] It doesn't matter how many creatures you attacked a player with, only that you
//     attacked a player with at least one creature. For example, if you attack one player with
//     Wings of the Guard and another player with five creatures, Wings of the Guard will get +2/+2
//     until end of turn.

// Skyhunter Strike Force's grant, unconditional: each other creature gets the
// same melee trigger, each instance triggering on its own (rule 702.121b).
const MELEE_TEXT =
  "Melee (Whenever this creature attacks, it gets +1/+1 until end of turn for each opponent you attacked this combat.)";
const GRANT_TEXT =
  "Other creatures you control have melee. (If a creature has multiple instances of melee, each triggers separately.)";

export default defineCard({
  name: "Adriana, Captain of the Guard",
  manaCost: "{3}{R}{W}",
  colors: ["W", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 4,
  toughness: 4,
  text: `${MELEE_TEXT}\n${GRANT_TEXT}`,
  triggered: [melee()],
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantsTriggered: [melee()],
      text: GRANT_TEXT,
    },
  ],
});
