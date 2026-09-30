import { defineCard } from "../define.js";

const TEXT = "Skeletons you control and other Zombies you control get +1/+1 and have deathtouch.";

// Two groups that overlap: every Skeleton you control, Death Baron included
// should it become one (Maskwood Nexus), and every other Zombie. The second
// static leaves Skeletons out so a Skeleton Zombie gets the bonus once.
export default defineCard({
  name: "Death Baron",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Wizard"],
  power: 2,
  toughness: 2,
  text: `${TEXT} (Any amount of damage they deal to a creature is enough to destroy it.)`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", subtype: "Skeleton", controlledBy: "you" } },
      grantPt: [1, 1],
      grantKeywords: ["deathtouch"],
      text: TEXT,
    },
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", subtype: "Zombie", notSubtypes: ["Skeleton"], controlledBy: "you" },
        excludeSelf: true,
      },
      grantPt: [1, 1],
      grantKeywords: ["deathtouch"],
      text: TEXT,
    },
  ],
});
