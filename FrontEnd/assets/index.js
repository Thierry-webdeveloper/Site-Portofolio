// Variables globales
const filters = document.querySelector(".filters");
const gallery = document.querySelector(".gallery");
const token = localStorage.getItem("token");

// Fonctions
function createBtn(category, title) {
  const newBtn = document.createElement("button");
  newBtn.classList.add("filter-btn");
  if (category === "all") {
    newBtn.classList.add("active");
  }
  newBtn.dataset.category = category;
  newBtn.textContent = title;
  filters.appendChild(newBtn);
}

async function loadFilters() {
  const response = await fetch("http://localhost:5678/api/categories");
  const categories = await response.json();
  createBtn("all", "Tous");
  categories.forEach((category) => {
    createBtn(category.id, category.name);
  });
}

async function loadWorks() {
  const response = await fetch("http://localhost:5678/api/works");
  const works = await response.json();
  works.forEach((work) => {
    const figure = document.createElement("figure");
    const image = document.createElement("img");
    const figcaption = document.createElement("figcaption");

    image.src = work.imageUrl;
    image.alt = work.title;
    figcaption.textContent = work.title;

    figure.appendChild(image);
    figure.appendChild(figcaption);
    figure.dataset.category = work.categoryId;

    gallery.appendChild(figure);
  });
}

function selectFilter() {
  if (event.target.tagName === "BUTTON") {
    const btnActive = document.querySelector(".active");
    const btnSelected = event.target; // la méthode .closest("button") n'est pas utile ici
    if (btnActive != btnSelected) {
      const allFigure = document.querySelectorAll("figure[data-category]");
      btnActive.classList.remove("active");
      btnSelected.classList.add("active");
      const categorySelected = btnSelected.getAttribute("data-category");
      // console.log("category : " + categorySelected);
      allFigure.forEach((figure) => {
        if (
          figure.dataset.category == categorySelected ||
          categorySelected == "all"
        ) {
          figure.style.display = "block";
        } else {
          figure.style.display = "none";
        }
      });
    }
  }
}

function enableEditMode() {
  if (token) {
    document.querySelector("#edit-banner").classList.remove("is-hidden");
    document.querySelector("#nav-login").classList.add("is-hidden");
    document.querySelector("#nav-logout").classList.remove("is-hidden");
    document.querySelector(".filters").classList.add("is-hidden");
    document.querySelector("#edit-btn-container").classList.remove("is-hidden");
    document.querySelector("#portfolio-header").style.marginBottom = "90px";
  }
}

// Main

// __ Initialisation : async function init() inutile ici  les deux fonctions de chargement sont indépendantes l'une de l'autre
enableEditMode();
loadFilters();
loadWorks();

// __ Event listeners
filters.addEventListener("click", selectFilter); // ici selectFilter reçoit 'event' en premier paramètre

document.querySelector("#logout-link").addEventListener("click", (event) => {
  event.preventDefault();
  localStorage.removeItem("token");
  // window.location.href = "login.html";
  location.reload();
});
