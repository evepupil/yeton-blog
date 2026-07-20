"use strict";

const root = document.documentElement;
const themeButton = document.querySelector("#theme-button");
const mobileMenuButton = document.querySelector("#mobile-menu-button");
const mobileNav = document.querySelector("#mobile-nav");
const tooltip = document.querySelector("#chart-tooltip");
const heatmap = document.querySelector("#github-heatmap");
const monthLabels = document.querySelector("#month-labels");
const tokenChart = document.querySelector("#token-chart");

function readSavedTheme() {
  try {
    return localStorage.getItem("chaosyn-prototype-theme");
  } catch {
    return null;
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem("chaosyn-prototype-theme", theme);
  } catch {
    // The prototype still works when file URL storage is unavailable.
  }
}

const savedTheme = readSavedTheme();
if (savedTheme === "dark" || savedTheme === "light") {
  root.dataset.theme = savedTheme;
}

function updateThemeButton() {
  const isDark = root.dataset.theme === "dark";
  themeButton.setAttribute(
    "aria-label",
    isDark ? "切换浅色模式" : "切换深色模式",
  );
  themeButton.innerHTML = `<i data-lucide="${isDark ? "sun" : "moon"}" aria-hidden="true"></i>`;
  window.lucide?.createIcons();
}

themeButton.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  saveTheme(root.dataset.theme);
  updateThemeButton();
});

mobileMenuButton.addEventListener("click", () => {
  const willOpen = mobileNav.hidden;
  mobileNav.hidden = !willOpen;
  mobileMenuButton.setAttribute("aria-expanded", String(willOpen));
  mobileMenuButton.setAttribute(
    "aria-label",
    willOpen ? "关闭菜单" : "打开菜单",
  );
  mobileMenuButton.innerHTML = `<i data-lucide="${willOpen ? "x" : "menu"}" aria-hidden="true"></i>`;
  window.lucide?.createIcons();
});

function seededValue(index) {
  const wave = Math.sin(index * 1.73) + Math.cos(index * 0.41);
  const pulse = index % 11 === 0 || index % 17 === 0 ? 1.6 : 0;
  return Math.max(0, Math.min(4, Math.round(wave + pulse + 1.45)));
}

function getHeatmapWeeks() {
  return window.matchMedia("(max-width: 760px)").matches ? 18 : 53;
}

function renderHeatmap() {
  const weeks = getHeatmapWeeks();
  const totalDays = weeks * 7;
  const today = new Date("2026-07-20T12:00:00+08:00");
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
  });

  heatmap.replaceChildren();
  monthLabels.replaceChildren();
  heatmap.style.setProperty("--heatmap-weeks", String(weeks));
  monthLabels.style.setProperty("--heatmap-weeks", String(weeks));

  for (let week = 0; week < weeks; week += 1) {
    const labelDate = new Date(today);
    labelDate.setDate(today.getDate() - totalDays + week * 7 + 1);

    if (week === 0 || labelDate.getDate() <= 7) {
      const label = document.createElement("span");
      label.style.gridColumn = String(week + 1);
      label.textContent = `${labelDate.getMonth() + 1}月`;
      monthLabels.append(label);
    }
  }

  for (let index = 0; index < totalDays; index += 1) {
    const cellDate = new Date(today);
    cellDate.setDate(today.getDate() - totalDays + index + 1);
    const level = seededValue(index + 9);
    const contributions = level === 0 ? 0 : level * 2 + ((index * 7) % 4);
    const cell = document.createElement("span");
    cell.className = `heatmap-cell level-${level}`;
    cell.dataset.tip = `${formatter.format(cellDate)} · ${contributions} 次贡献 · 原型数据`;
    cell.setAttribute("aria-hidden", "true");
    heatmap.append(cell);
  }
}

function renderTokenChart() {
  tokenChart.replaceChildren();

  for (let day = 0; day < 30; day += 1) {
    const base = 34 + ((day * 17) % 52);
    const pulse = day % 8 === 0 ? 22 : 0;
    const height = Math.min(100, base + pulse);
    const claudeShare = 38 + ((day * 13) % 42);
    const tokenTotal = (height * 0.18).toFixed(1);
    const bar = document.createElement("span");
    bar.className = "token-bar";
    bar.style.setProperty("--bar-height", `${height}%`);
    bar.style.setProperty("--claude-share", `${claudeShare}%`);
    bar.dataset.tip = `07.${String(day + 1).padStart(2, "0")} · ${tokenTotal}M Token · 原型数据`;
    bar.setAttribute("aria-hidden", "true");
    bar.innerHTML =
      '<i class="token-part claude"></i><i class="token-part codex"></i>';
    tokenChart.append(bar);
  }
}

function showTooltip(event) {
  const target = event.target.closest("[data-tip]");
  if (!target) {
    return;
  }

  tooltip.textContent = target.dataset.tip;
  tooltip.hidden = false;
  const rect = target.getBoundingClientRect();
  const left = Math.min(
    window.innerWidth - 110,
    Math.max(110, rect.left + rect.width / 2),
  );
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${rect.top}px`;
}

function hideTooltip() {
  tooltip.hidden = true;
}

document.addEventListener("pointerover", showTooltip);
document.addEventListener("pointerout", hideTooltip);

let currentHeatmapWeeks = getHeatmapWeeks();
window.addEventListener("resize", () => {
  const nextWeeks = getHeatmapWeeks();
  if (nextWeeks !== currentHeatmapWeeks) {
    currentHeatmapWeeks = nextWeeks;
    renderHeatmap();
  }
});

renderHeatmap();
renderTokenChart();
updateThemeButton();
window.lucide?.createIcons();
