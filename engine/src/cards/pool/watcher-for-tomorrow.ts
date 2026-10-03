import { defineCard } from "../define.js";
import { hideaway } from "../helpers.js";

// Hideaway (rule 702.75): the exiled card is linked to this creature
// (607.2a), and the leaves trigger reaches only the card this stint of it
// exiled. If it leaves before the hideaway trigger resolves, the leaves
// trigger finds nothing and the card stays exiled (the ruling). The card
// isn't revealed as it goes to the hand.
const LEAVES_TEXT = "When this creature leaves the battlefield, put the exiled card into its owner's hand.";

export default defineCard({
  name: "Watcher for Tomorrow",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 1,
  text:
    "Hideaway 4 (When this creature enters, look at the top four cards of your library, exile one face down, then put the rest on the bottom in a random order.)\n" +
    `This creature enters tapped.\n${LEAVES_TEXT}`,
  triggered: [
    hideaway(4, "creature"),
    {
      trigger: { on: "leaves-battlefield", who: "self" },
      targets: [],
      effect: { kind: "return-exiled-by-source", linked: "hand" },
      resolve: null,
      text: LEAVES_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This creature enters tapped.",
    },
  ],
});
