const GAME_ID = "game32";
const GAME_TITLE = "カバ合戦";

const SUPABASE_URL = "https://gmncxnybsovlallxgnkd.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_ly3h5OhL8HDSHhYdmJq_Fw_9pG3mhla";

const kabaDb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const titleScreen = document.getElementById("titleScreen");
const gameScreen = document.getElementById("gameScreen");
const resultScreen = document.getElementById("resultScreen");

const titleImage = document.getElementById("titleImage");
const startButton = document.getElementById("startButton");
const backTitleButton = document.getElementById("backTitleButton");

const playerSoldiersEl = document.getElementById("playerSoldiers");
const enemySoldiersEl = document.getElementById("enemySoldiers");
const turnCountEl = document.getElementById("turnCount");
const hintText = document.getElementById("hintText");
const resultText = document.getElementById("resultText");

const choiceButtons = document.querySelectorAll(".choiceButton");

const resultImage = document.getElementById("resultImage");
const rankTitleEl = document.getElementById("rankTitle");
const finalScoreEl = document.getElementById("finalScore");
const resultCommentEl = document.getElementById("resultComment");
const resultButtons = document.getElementById("resultButtons");

const shareButton = document.getElementById("shareButton");
const registerButton = document.getElementById("registerButton");
const retryButton = document.getElementById("retryButton");
const arcadeButton = document.getElementById("arcadeButton");

const bgm = document.getElementById("bgm");

let playerSoldiers = 100;
let enemySoldiers = 100;
let turn = 1;
let currentEnemyPlan = "attack";
let enemyPersonality = null;
let acceptingInput = false;

let lastScore = 0;
let lastRankTitle = "足軽隊長";
let scoreRegistered = false;

const ACTIONS = {
  attack: {
    label: "攻める",
    emoji: "⚔️",
    strongAgainst: "defend",
    hint: "タヌキ軍が前に出てきた！"
  },
  defend: {
    label: "守る",
    emoji: "🛡️",
    strongAgainst: "flank",
    hint: "タヌキ軍が陣を固めている！"
  },
  flank: {
    label: "回り込む",
    emoji: "🐎",
    strongAgainst: "attack",
    hint: "タヌキ軍が横へ動いている！"
  }
};

const PERSONALITIES = [
  {
    name: "短気なタヌキ軍",
    intro: "攻めることが多い。勢いに注意！",
    weights: { attack: 50, defend: 25, flank: 25 }
  },
  {
    name: "慎重なタヌキ軍",
    intro: "守りを固めることが多い。",
    weights: { attack: 25, defend: 50, flank: 25 }
  },
  {
    name: "曲者のタヌキ軍",
    intro: "回り込むことが多い。横の動きに注意！",
    weights: { attack: 25, defend: 25, flank: 50 }
  }
];

function showScreen(screen) {
  [titleScreen, gameScreen, resultScreen].forEach((s) => {
    s.classList.remove("active");
  });
  screen.classList.add("active");
}

function playBgm() {
  if (!bgm) return;

  bgm.currentTime = 0;
  bgm.volume = 0.55;
  bgm.play().catch(() => {});
}

function stopBgm() {
  if (!bgm) return;

  bgm.pause();
  bgm.currentTime = 0;
}

function resetRegisterButton() {
  scoreRegistered = false;
  registerButton.disabled = false;
  registerButton.textContent = "記録を登録";
  resultButtons.classList.add("hidden");
}

function setChoiceButtonsEnabled(enabled) {
  choiceButtons.forEach((button) => {
    button.disabled = !enabled;
  });
}

function startGame() {
  playerSoldiers = 100;
  enemySoldiers = 100;
  turn = 1;
  acceptingInput = false;

  enemyPersonality =
    PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];

  resetRegisterButton();
  updateStatus();
  showScreen(gameScreen);
  playBgm();

  hintText.textContent = "今回の相手";
  resultText.innerHTML =
    `${enemyPersonality.name}<br>${enemyPersonality.intro}`;

  setChoiceButtonsEnabled(false);

  setTimeout(() => {
    chooseEnemyPlan();
    resultText.textContent = "兵法を選んでください";
    acceptingInput = true;
    setChoiceButtonsEnabled(true);
  }, 3000);
}

function updateStatus() {
  playerSoldiersEl.textContent = Math.max(0, playerSoldiers);
  enemySoldiersEl.textContent = Math.max(0, enemySoldiers);
  turnCountEl.textContent = turn;
}

function weightedRandom(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  let rand = Math.random() * total;

  for (const [key, value] of entries) {
    rand -= value;
    if (rand <= 0) return key;
  }

  return entries[0][0];
}

function chooseEnemyPlan() {
  const truePlan = weightedRandom(enemyPersonality.weights);
  const keys = Object.keys(ACTIONS);

  // 70%は本当、30%はフェイント
  const isFeint = Math.random() < 0.3;
  currentEnemyPlan = truePlan;

  let hintPlan = truePlan;

  if (isFeint) {
    const others = keys.filter((key) => key !== truePlan);
    hintPlan = others[Math.floor(Math.random() * others.length)];
  }

  hintText.textContent = ACTIONS[hintPlan].hint;
}

function judge(playerAction, enemyAction) {
  if (playerAction === enemyAction) return "draw";
  if (ACTIONS[playerAction].strongAgainst === enemyAction) return "win";
  return "lose";
}

function handleChoice(playerAction) {
  if (!acceptingInput) return;

  acceptingInput = false;
  setChoiceButtonsEnabled(false);

  const enemyAction = currentEnemyPlan;
  const result = judge(playerAction, enemyAction);

  let playerDamage = 0;
  let enemyDamage = 0;
  let resultLabel = "";

  if (result === "win") {
    playerDamage = 3;
    enemyDamage = 15;
    resultLabel = "読み勝ち！";
  } else if (result === "lose") {
    playerDamage = 15;
    enemyDamage = 3;
    resultLabel = "読み負けた！";
  } else {
    playerDamage = 8;
    enemyDamage = 8;
    resultLabel = "互角のぶつかり合い！";
  }

  playerSoldiers = Math.max(0, playerSoldiers - playerDamage);
  enemySoldiers = Math.max(0, enemySoldiers - enemyDamage);

  const p = ACTIONS[playerAction];
  const e = ACTIONS[enemyAction];

  resultText.innerHTML =
    `${p.emoji} カバ軍は「${p.label}」！<br>` +
    `${e.emoji} タヌキ軍は「${e.label}」！<br>` +
    `${resultLabel}<br>` +
    `カバ軍 -${playerDamage} / タヌキ軍 -${enemyDamage}`;

  updateStatus();

  setTimeout(() => {
    if (playerSoldiers <= 0 || enemySoldiers <= 0 || turn >= 10) {
      endGame();
      return;
    }

    turn += 1;
    updateStatus();
    chooseEnemyPlan();
    resultText.textContent = "兵法を選んでください";
    acceptingInput = true;
    setChoiceButtonsEnabled(true);
  }, 1800);
}

function getRank(score, isWin) {
  if (!isWin || score <= 29) {
    return {
      title: "足軽隊長",
      comment: `相手は「${enemyPersonality.name}」だった！次こそ勝利じゃ！`,
      image: "tittle.png"
    };
  }

  if (score <= 69) {
    return {
      title: "名軍師",
      comment: `相手は「${enemyPersonality.name}」だった！見事な采配！`,
      image: "tittle.png"
    };
  }

  return {
    title: "天下統一",
    comment: `相手は「${enemyPersonality.name}」だった！圧巻の大勝利！`,
    image: "tittle.png"
  };
}

function endGame() {
  acceptingInput = false;
  setChoiceButtonsEnabled(false);
  stopBgm();

  const isWin = playerSoldiers > enemySoldiers;
  lastScore = Math.max(0, playerSoldiers);

  const rank = getRank(lastScore, isWin);
  lastRankTitle = rank.title;

  rankTitleEl.textContent = rank.title;
  finalScoreEl.textContent = lastScore;
  resultCommentEl.textContent = rank.comment;
  resultImage.src = rank.image;

  resetRegisterButton();
  showScreen(resultScreen);
  showResultButtonsLater();
}

function showResultButtonsLater() {
  resultButtons.classList.add("hidden");

  setTimeout(() => {
    resultButtons.classList.remove("hidden");
  }, 1500);
}

function shareToX() {
  const text =
    `カバ合戦、いざ開戦じゃ！⚔️🦛\n` +
    `兵数${lastScore}\n\n` +
    `無料ブラウザゲーム「カバ合戦」\n` +
    `https://afoolhippo.github.io/game32/\n` +
    `#カバ合戦\n` +
    `#カバゲーセン`;

  const url =
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;

  window.open(url, "_blank");
}

async function registerScore() {
  if (scoreRegistered) {
    alert("この記録は登録済みです");
    return;
  }

  const nickname = prompt("ニックネームを入力してね", "匿名カバ");
  if (!nickname) return;

  registerButton.disabled = true;
  registerButton.textContent = "登録中...";

  const { error } = await kabaDb.from("kaba_scores").insert({
    game_id: GAME_ID,
    game_title: GAME_TITLE,
    nickname: nickname,
    rank_title: lastRankTitle,
    score: lastScore
  });

  if (error) {
    console.error(error);
    registerButton.disabled = false;
    registerButton.textContent = "記録を登録";
    alert("登録に失敗しました");
    return;
  }

  scoreRegistered = true;
  registerButton.textContent = "登録済み";
  alert("記録を登録しました！");
}

function goTitle() {
  stopBgm();
  acceptingInput = false;
  setChoiceButtonsEnabled(false);
  resetRegisterButton();
  showScreen(titleScreen);
}

titleImage.addEventListener("click", startGame);
startButton.addEventListener("click", startGame);
backTitleButton.addEventListener("click", goTitle);

choiceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    handleChoice(button.dataset.action);
  });
});

shareButton.addEventListener("click", shareToX);
registerButton.addEventListener("click", registerScore);
retryButton.addEventListener("click", startGame);
arcadeButton.addEventListener("click", () => {
  window.location.href = "https://afoolhippo.github.io/home/?skipTitle=1";
});

showScreen(titleScreen);
stopBgm();