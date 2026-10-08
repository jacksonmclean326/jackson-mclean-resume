class Player {
  name;
  rounds; // {bid, won, bonus, score}
  total_score;

  constructor(name) {
    this.name = name;
    this.total_score = 0;
    this.rounds = [
      { bid: null, won: null, bonus: null, score: this.total_score },
    ];
  }

  calculate_score() {
    const round = this.rounds.at(-1);
    if (round.bid === 0) {
      if (round.won === 0) {
        this.total_score += ROUND * 10 + round.bonus;
      } else {
        this.total_score -= ROUND * 10;
      }
    } else {
      if (round.bid === round.won) {
        this.total_score += round.bid * 20 + round.bonus;
      } else {
        this.total_score -= Math.abs(round.bid - round.won) * 10;
      }
    }
    if (ROUND < 10) {
      this.rounds.push({
        bid: null,
        won: null,
        bonus: null,
        score: this.total_score,
      });
    }
  }
}

const NUMBERS = new Map([
  ["two", 2],
  ["three", 3],
  ["four", 4],
  ["five", 5],
  ["six", 6],
  ["seven", 7],
  ["eight", 8],
]);
const ROUND_HEADER = document.getElementById("round");
const START_ERROR = document.getElementById("start-error");
const SECTION_ONE = document.getElementById("stage-one");
const SECTION_TWO = document.getElementById("stage-two");
const SECTION_THREE = document.getElementById("stage-three");
let PLAYERS = [];
let ROUND = 0;
let NUM_PLAYERS = 0;

on_reload();

function on_reload() {
  const round = localStorage.getItem("round");
  const players = localStorage.getItem("players");
  if (round && players) {
    ROUND = Number(round);
    const savedPlayers = JSON.parse(players);
    PLAYERS = savedPlayers.map((savedPlayer) => {
      const restoredPlayer = new Player(savedPlayer.name);
      restoredPlayer.total_score = savedPlayer.total_score;
      restoredPlayer.rounds = savedPlayer.rounds;
      return restoredPlayer;
    });
    NUM_PLAYERS = PLAYERS.length;
  }

  if (ROUND > 10) {
    SECTION_ONE.classList.add("hidden");
    SECTION_THREE.classList.remove("hidden");
    display_winners();
  } else if (ROUND > 0) {
    for (const [i, player] of PLAYERS.entries()) {
      add_row(player, i);
      SECTION_ONE.classList.add("hidden");
      SECTION_TWO.classList.remove("hidden");
      ROUND_HEADER.textContent = `ROUND ${ROUND}`;
    }
    reRender_rows();
  }
}

function start_game() {
  const num_players_string = document.getElementById("num-players-input").value;
  NUM_PLAYERS = Number(num_players_string);
  if (isNaN(NUM_PLAYERS) || NUM_PLAYERS <= 1 || NUM_PLAYERS > 8) {
    const num = NUMBERS.get(num_players_string.toLowerCase());

    if (num) {
      NUM_PLAYERS = num;
    } else {
      START_ERROR.textContent = "Please enter a valid number";
      return;
    }
  }

  START_ERROR.textContent = "";
  get_names();
  document.getElementById("num-players-input").value = "";
  document.getElementById("num_players").classList.add("hidden");
  document.getElementById("names").classList.remove("hidden");
}

function create_players() {
  for (let i = 0; i < NUM_PLAYERS; i++) {
    const name =
      document.getElementById(`name-${i}`).value.trim() || `player ${i + 1}`;
    const player = new Player(name);
    PLAYERS.push(player);
    add_row(player, i);
  }
  SECTION_ONE.classList.add("hidden");
  SECTION_TWO.classList.remove("hidden");
  ROUND = 1;
  ROUND_HEADER.textContent = `Round ${ROUND}`;
  localStorage.setItem("round", ROUND);
  localStorage.setItem("players", JSON.stringify(PLAYERS));
}

function get_names() {
  const name_box = document.getElementById("names");
  const header = document.createElement("h2");
  header.textContent = "Enter Player Names:";
  name_box.appendChild(header);

  for (let i = 0; i < NUM_PLAYERS; i++) {
    const label = document.createElement("label");
    label.htmlFor = `name-${i}`;
    label.textContent = `Player ${i + 1} name:`;
    const input = document.createElement("input");
    input.id = `name-${i}`;
    input.maxLength = 12;
    input.placeholder = `player ${i + 1}`;
    label.appendChild(input);
    name_box.appendChild(label);
  }

  const submit_button = document.createElement("button");
  submit_button.textContent = "Start";
  submit_button.addEventListener("click", create_players);
  name_box.appendChild(submit_button);
}

function add_row(player, num) {
  const table = document.getElementById("table");
  const row = document.createElement("tr");
  const cell_one = document.createElement("td");
  const cell_two = document.createElement("td");
  cell_two.classList.add("round_info");
  const cell_three = document.createElement("td");
  cell_one.textContent = player.name;

  const bid = document.createElement("input");
  bid.id = `bid-${num}`;
  bid.ariaLabel = `bid for ${player.name}`;
  bid.placeholder = "bid";
  bid.type = "number";
  const won = document.createElement("input");
  won.id = `won-${num}`;
  won.ariaLabel = `bids won for ${player.name}`;
  won.placeholder = "bids won";
  won.type = "number";
  const bonus = document.createElement("input");
  bonus.id = `bonus-${num}`;
  bonus.ariaLabel = `bonus points for ${player.name}`;
  bonus.placeholder = "bonus";
  bonus.type = "number";

  cell_two.appendChild(bid);
  cell_two.appendChild(won);
  cell_two.appendChild(bonus);

  cell_three.textContent = `${player.total_score}`;
  cell_three.id = `score-${num}`;
  row.appendChild(cell_one);
  row.appendChild(cell_two);
  row.appendChild(cell_three);
  table.appendChild(row);
}

function finish_round() {
  let total_won = 0;
  for (let i = 0; i < NUM_PLAYERS; i++) {
    total_won += Number(document.getElementById(`won-${i}`).value);
  }

  if (total_won > ROUND || total_won < ROUND - 1) {
    document.getElementById("finalize-confirmation-message").textContent =
      "The total amount of winners is not consistent with the round. Are you sure all values are input correctly?";
    document.getElementById("finalize-confirmation").classList.remove("hidden");
    return;
  }

  complete_round();
}

function continue_finalize_round() {
  document.getElementById("finalize-confirmation").classList.add("hidden");
  complete_round();
}

function cancel_finalize_round() {
  document.getElementById("finalize-confirmation").classList.add("hidden");
}

function complete_round() {
  for (let i = 0; i < NUM_PLAYERS; i++) {
    const player = PLAYERS[i];
    player.rounds.at(-1).bid = Number(
      document.getElementById(`bid-${i}`).value,
    );
    player.rounds.at(-1).won = Number(
      document.getElementById(`won-${i}`).value,
    );
    player.rounds.at(-1).bonus = Number(
      document.getElementById(`bonus-${i}`).value,
    );
    player.calculate_score();
  }

  ROUND++;
  if (ROUND <= 10) {
    reRender_rows();
    ROUND_HEADER.textContent = `Round ${ROUND}`;
  } else {
    SECTION_TWO.classList.add("hidden");
    SECTION_THREE.classList.remove("hidden");
    display_winners();
  }
  localStorage.setItem("round", ROUND);
  localStorage.setItem("players", JSON.stringify(PLAYERS));
}

function reRender_rows() {
  for (let i = 0; i < NUM_PLAYERS; i++) {
    const player = PLAYERS[i];
    const bid = document.getElementById(`bid-${i}`);
    bid.value = player.rounds.at(-1).bid;
    const won = document.getElementById(`won-${i}`);
    won.value = player.rounds.at(-1).won;
    const bonus = document.getElementById(`bonus-${i}`);
    bonus.value = player.rounds.at(-1).bonus;
    document.getElementById(`score-${i}`).textContent =
      `${player.rounds.at(-1).score}`;
  }
}

function display_winners() {
  const winners = [...PLAYERS].sort((a, b) => b.total_score - a.total_score);

  for (const [i, winner] of winners.entries()) {
    if (i < 3) {
      const winnerLabel = document.getElementById(`winner-${i + 1}`);

      winnerLabel.textContent = `${i + 1}. ${winner.name} : ${winner.total_score}`;
    } else {
      const list = document.createElement("li");
      list.textContent = `${winner.name} : ${winner.total_score}`;
      document.getElementById("other-winners").appendChild(list);
    }
  }
}

function undo_round() {
  if (ROUND === 1) return;
  for (const player of PLAYERS) {
    player.rounds.pop();
  }
  if (--ROUND === 10) {
    SECTION_THREE.classList.add("hidden");
    SECTION_TWO.classList.remove("hidden");
  }
  ROUND_HEADER.textContent = `Round ${ROUND}`;
  localStorage.setItem("round", ROUND);
  localStorage.setItem("players", JSON.stringify(PLAYERS));
  reRender_rows();
}

function reset() {
  // remove all dynamically added html related to players
  const table = document.getElementById("table");
  table.querySelectorAll("tr:not(:first-child)").forEach((row) => row.remove());
  document.getElementById("names").replaceChildren();
  document.getElementById("other-winners").replaceChildren();
  ["winner-1", "winner-2", "winner-3"].forEach((id) => {
    document.getElementById(id).textContent = "";
  });

  // clear storage
  localStorage.removeItem("round");
  localStorage.removeItem("players");

  // reset to start page
  SECTION_ONE.classList.remove("hidden");
  document.getElementById("num_players").classList.remove("hidden");
  document.getElementById("names").classList.add("hidden");
  SECTION_THREE.classList.add("hidden");
  SECTION_TWO.classList.add("hidden");

  // reset global variables
  ROUND = 0;
  NUM_PLAYERS = 0;
  PLAYERS = [];
}
