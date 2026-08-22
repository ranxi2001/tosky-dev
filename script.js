const root = document.documentElement;
const toggle = document.querySelector(".theme-toggle");
const savedTheme = localStorage.getItem("tosky-theme");
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

function applyTheme(theme) {
  root.dataset.theme = theme;
  toggle.setAttribute("aria-label", theme === "dark" ? "Use light appearance" : "Use dark appearance");
  document.querySelector('meta[name="theme-color"]').content = theme === "dark" ? "#131411" : "#f4f4f1";
}

applyTheme(savedTheme || (systemPrefersDark ? "dark" : "light"));

toggle.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  localStorage.setItem("tosky-theme", nextTheme);
});

const header = document.querySelector(".site-header");
window.addEventListener("scroll", () => header.classList.toggle("scrolled", window.scrollY > 10), { passive: true });

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((element, index) => {
  if (element.closest(".hero")) element.style.transitionDelay = `${index * 65}ms`;
  revealObserver.observe(element);
});

document.querySelector("#year").textContent = new Date().getFullYear();
