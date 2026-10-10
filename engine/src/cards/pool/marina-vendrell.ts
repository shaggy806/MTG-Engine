import { defineCard } from "../define.js";

// EDHREC rank 7921. Muxus, Goblin Grandee's shape for the reveal. The door
// is chosen as the ability resolves — any door of the Room, locking an
// unlocked one or unlocking a locked one.
const ENTER =
  "When Marina Vendrell enters, reveal the top seven cards of your library. Put all enchantment cards from among them into your hand and the rest on the bottom of your library in a random order.";
const DOOR = "{T}: Lock or unlock a door of target Room you control. Activate only as a sorcery.";

export default defineCard({
  name: "Marina Vendrell",
  manaCost: "{W}{U}{B}{R}{G}",
  colors: ["W", "U", "B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warlock"],
  power: 3,
  toughness: 5,
  text: `${ENTER}\n${DOOR}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 7,
        reveal: true,
        min: 7,
        max: 7,
        filter: { type: "enchantment" },
        destination: "hand",
        leftover: "bottom-random",
      },
      resolve: null,
      text: ENTER,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      sorcerySpeed: true,
      targets: [{ kind: "permanent", filter: { subtype: "Room", controlledBy: "you" } }],
      effect: { kind: "unlock-door", target: 0, orLock: true },
      resolve: null,
      text: DOOR,
    },
  ],
});
