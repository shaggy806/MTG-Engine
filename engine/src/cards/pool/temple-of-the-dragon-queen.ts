import { defineCard } from "../define.js";

const REVEAL_TEXT =
  "As this land enters, you may reveal a Dragon card from your hand. This land enters tapped unless you revealed a " +
  "Dragon card this way or you control a Dragon.";

// Both "as this enters" choices are asked before it moves (rule 614.12):
// the colour, then the reveal. Either the reveal or a Dragon already on the
// battlefield lets it enter untapped (`revealOrCondition`); a Dragon card is
// one with the creature type, not one named for it (the ruling).
export default defineCard({
  name: "Temple of the Dragon Queen",
  types: ["land"],
  colors: [],
  text: `${REVEAL_TEXT}\nAs this land enters, choose a color.\n{T}: Add one mana of the chosen color.`,
  chooseOnEnter: ["W", "U", "B", "R", "G"],
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        tappedUnlessRevealFromHand: ["Dragon"],
        tappedUnless: { kind: "controls", filter: { subtype: "Dragon" }, atLeast: 1 },
        revealOrCondition: true,
      },
      text: REVEAL_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "chosen", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of the chosen color.",
    },
  ],
});
