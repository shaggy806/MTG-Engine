import { defineCard } from "../define.js";
import { crew, equip } from "../helpers.js";

// EDHREC rank 4856. Each grant is one more ability beside any the
// Equipment or Vehicle already has: its controller picks which to use.
const LOOK =
  "When Astor enters, look at the top seven cards of your library. You may reveal an Equipment or Vehicle card from among them and put it into your hand. Put the rest on the bottom of your library in a random order.";
const EQUIP = "Equipment you control have equip {1}.";
const CREW = "Vehicles you control have crew 1.";

export default defineCard({
  name: "Astor, Bearer of Blades",
  manaCost: "{2}{R}{W}",
  colors: ["R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 4,
  toughness: 4,
  text: `${LOOK}\n${EQUIP}\n${CREW}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 7,
        reveal: "chosen",
        min: 0,
        max: 1,
        filter: { anyOf: [{ subtype: "Equipment" }, { subtype: "Vehicle" }] },
        destination: "hand",
        leftover: "bottom-random",
      },
      resolve: null,
      text: LOOK,
    },
  ],
  static: [
    {
      affects: { scope: "filter", filter: { subtype: "Equipment", controlledBy: "you" } },
      grantsActivated: [equip("{1}")],
      text: EQUIP,
    },
    {
      affects: { scope: "filter", filter: { subtype: "Vehicle", controlledBy: "you" } },
      grantsActivated: [crew(1)],
      text: CREW,
    },
  ],
});
