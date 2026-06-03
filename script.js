const sampleParts = {
  low: {
    cpu: "Ryzen 5 3600 / Intel i5-10400F class",
    gpu: "GTX 1660 Super / RX 580 class",
    ram: "16GB DDR4",
    storage: "1TB NVMe SSD",
    psu: "550W bronze-rated quality PSU",
    warning: "Good for budget 1080p, but not a true PS5 destroyer."
  },
  mid: {
    cpu: "Ryzen 5 5600 / Intel i5-12400F class",
    gpu: "RX 6650 XT / RTX 3060 Ti / RX 7600 class",
    ram: "16GB to 32GB DDR4",
    storage: "1TB NVMe SSD",
    psu: "650W quality PSU",
    warning: "Strong 1080p and solid 1440p. Best value zone."
  },
  high: {
    cpu: "Ryzen 5 7600 / Ryzen 7 5700X3D / Core i5 newer-gen class",
    gpu: "RX 7800 XT / RTX 4070 class or better",
    ram: "32GB RAM",
    storage: "1TB to 2TB NVMe SSD",
    psu: "750W quality PSU",
    warning: "Excellent for 1440p and strong long-term upgrade room."
  },
  ultra: {
    cpu: "Ryzen 7 X3D / Core Ultra 7 class",
    gpu: "RTX 4080 class / RX 7900 XTX class or better",
    ram: "32GB to 64GB RAM",
    storage: "2TB NVMe SSD",
    psu: "850W high-quality PSU",
    warning: "Overkill for casual 1080p, serious power for 4K and future games."
  }
};

function getSelectedGames() {
  return Array.from(document.querySelectorAll("#gameSelect option:checked")).map(option => option.value);
}

function getTier(budget, currency) {
  const normalized = currency === "AED" ? budget : budget * 3.67;
  if (normalized < 2400) return "low";
  if (normalized < 4300) return "mid";
  if (normalized < 7200) return "high";
  return "ultra";
}

function resolutionMultiplier(resolution) {
  if (resolution === "4K") return 0.52;
  if (resolution === "1440p") return 0.74;
  return 1;
}

function tierBaseFps(tier) {
  return {
    low: 95,
    mid: 165,
    high: 235,
    ultra: 330
  }[tier];
}

function futureScore(tier, condition) {
  const base = { low: 42, mid: 71, high: 84, ultra: 92 }[tier];
  const conditionAdjust = condition === "Used" ? -8 : condition === "Mixed" ? -3 : 2;
  return Math.max(0, Math.min(100, base + conditionAdjust));
}

function valueScore(tier, budget) {
  const value = { low: 64, mid: 89, high: 82, ultra: 68 }[tier];
  const penalty = budget > 9000 ? 8 : 0;
  return Math.max(0, value - penalty);
}

function renderBuilderResult(data) {
  const result = document.getElementById("builderResult");
  const parts = sampleParts[data.tier];
  const baseFps = Math.round(tierBaseFps(data.tier) * resolutionMultiplier(data.resolution));
  const targetHit = baseFps >= data.fpsTarget;
  const future = futureScore(data.tier, data.condition);
  const value = valueScore(data.tier, data.budget);
  const confidence = data.tier === "low" ? 58 : data.tier === "mid" ? 76 : 72;

  const verdict = targetHit
    ? `This build direction should hit your ${data.fpsTarget} FPS target in lighter games and esports titles.`
    : `This budget may struggle to hit ${data.fpsTarget} FPS at ${data.resolution}. Lower settings, used parts, or more budget would help.`;

  result.innerHTML = `
    <p class="eyebrow">AI Recommendation</p>
    <h3>${data.region} ${data.budget} ${data.currency} ${data.resolution} build</h3>
    <p>${verdict}</p>
    <div class="result-stats">
      <div><span>Expected FPS</span><strong>${baseFps}</strong></div>
      <div><span>Value</span><strong>${value}</strong></div>
      <div><span>Future</span><strong>${future}</strong></div>
    </div>
    <div class="parts-list">
      <div><span>CPU</span><strong>${parts.cpu}</strong></div>
      <div><span>GPU</span><strong>${parts.gpu}</strong></div>
      <div><span>RAM</span><strong>${parts.ram}</strong></div>
      <div><span>Storage</span><strong>${parts.storage}</strong></div>
      <div><span>PSU</span><strong>${parts.psu}</strong></div>
    </div>
    <p><strong>Games:</strong> ${data.games.join(", ") || "No games selected"}</p>
    <p><strong>Warning:</strong> ${parts.warning}</p>
    <p><strong>Confidence:</strong> ${confidence}/100. Real launch version should use live benchmark and retailer data.</p>
  `;
}

const builderForm = document.getElementById("builderForm");
builderForm.addEventListener("submit", event => {
  event.preventDefault();
  const budget = Number(document.getElementById("budgetInput").value);
  const currency = document.getElementById("currencyInput").value;
  const resolution = document.getElementById("resolutionInput").value;
  const fpsTarget = Number(document.getElementById("fpsInput").value);
  const condition = document.getElementById("conditionInput").value;
  const region = document.getElementById("regionInput").value;
  const games = getSelectedGames();
  const tier = getTier(budget, currency);
  renderBuilderResult({ budget, currency, resolution, fpsTarget, condition, region, games, tier });
});

function renderPs5Result(budget, country, gameType) {
  const result = document.getElementById("ps5Result");
  const threshold = country === "UAE" ? 3300 : 900;
  let normalized = country === "UAE" ? budget : budget;
  const esportsBoost = gameType === "esports" ? 400 : gameType === "mixed" ? 0 : -500;
  const pcScore = Math.max(45, Math.min(96, Math.round((normalized + esportsBoost) / threshold * 70)));
  const ps5Score = gameType === "aaa" ? 84 : gameType === "mixed" ? 76 : 68;
  const verdict = pcScore > ps5Score + 8
    ? "✅ Budget likely beats PS5 for your use case."
    : pcScore >= ps5Score - 5
      ? "⚖️ Close battle. PC wins flexibility, PS5 wins simplicity."
      : "❌ PS5 is probably smarter value at this budget.";

  const waitAdvice = pcScore < ps5Score ? "Wait, save more, or buy used carefully." : "Buy only if prices are good and the PSU is safe.";

  result.innerHTML = `
    <span class="badge">Shareable Result</span>
    <h3>${verdict}</h3>
    <div class="result-stats">
      <div><span>PC Score</span><strong>${pcScore}</strong></div>
      <div><span>PS5 Score</span><strong>${ps5Score}</strong></div>
      <div><span>Advice</span><strong>${pcScore > ps5Score ? "PC" : "Wait"}</strong></div>
    </div>
    <p><strong>${budget} ${country === "UAE" ? "AED" : "local currency"}</strong> vs PS5 for <strong>${gameType}</strong> games.</p>
    <p>${waitAdvice}</p>
  `;
}

const ps5Form = document.getElementById("ps5Form");
ps5Form.addEventListener("submit", event => {
  event.preventDefault();
  const budget = Number(document.getElementById("ps5Budget").value);
  const country = document.getElementById("ps5Country").value;
  const gameType = document.getElementById("ps5GameType").value;
  renderPs5Result(budget, country, gameType);
});

const battleButtons = document.querySelectorAll(".battle-card");
const battleResult = document.getElementById("battleResult");

battleButtons.forEach(button => {
  button.addEventListener("click", () => {
    const [a, b, verdict] = button.dataset.battle.split("|");
    battleResult.innerHTML = `
      <p class="eyebrow">Battle Verdict</p>
      <h3>${a} vs ${b}</h3>
      <div class="result-stats">
        <div><span>FPS</span><strong>${a.length > b.length ? "A" : "B"}</strong></div>
        <div><span>Value</span><strong>${verdict.includes("value") ? "B" : "A"}</strong></div>
        <div><span>Winner</span><strong>${verdict.includes("PS5 wins") ? "Mixed" : "Depends"}</strong></div>
      </div>
      <p>${verdict}</p>
      <p>Production version should use real benchmark, power, price, and region data.</p>
    `;
  });
});

const menuButton = document.querySelector(".menu-button");
const navLinks = document.querySelector(".nav-links");
menuButton.addEventListener("click", () => {
  const isOpen = navLinks.style.display === "flex";
  navLinks.style.display = isOpen ? "none" : "flex";
  navLinks.style.position = "absolute";
  navLinks.style.top = "72px";
  navLinks.style.right = "12px";
  navLinks.style.flexDirection = "column";
  navLinks.style.background = "rgba(7, 11, 24, 0.96)";
  navLinks.style.border = "1px solid rgba(255,255,255,0.14)";
  navLinks.style.padding = "16px";
  navLinks.style.borderRadius = "18px";
});

// Load demo defaults.
renderBuilderResult({
  budget: 3500,
  currency: "AED",
  resolution: "1440p",
  fpsTarget: 144,
  condition: "Mixed",
  region: "UAE",
  games: ["Fortnite", "FC 26"],
  tier: "mid"
});
renderPs5Result(3500, "UAE", "esports");
