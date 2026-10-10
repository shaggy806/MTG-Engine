import { roomCard } from "../helpers.js";
import left from "./spiked-corridor.js";
import right from "./torture-pit.js";

// EDHREC rank 4196. A Room (rule 709.5): each door is cast on its own and
// enters unlocked; the other is unlocked by paying its mana cost as a
// sorcery.
export default roomCard("Spiked Corridor // Torture Pit", left, right);
