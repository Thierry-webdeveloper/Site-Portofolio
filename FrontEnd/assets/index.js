// Variables globales
const filters = document.querySelector(".filters");
const gallery = document.querySelector(".gallery");
const btnLogout = document.querySelector("#logout-link");
const btnEdit = document.querySelector("#edit-btn");
const btnModalAdd = document.querySelector("#modal-add-btn");
const btnModalBack = document.querySelector("#modal-back");
const token = localStorage.getItem("token");

let modal = null; // référence à la modale ouverte (pattern Grafikart)

// Fonctions

// __ Application du style aux boutons du filtre
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

// __ Chargement des catégories
async function loadFilters() {
  const response = await fetch("http://localhost:5678/api/categories");
  const categories = await response.json();
  createBtn("all", "Tous");
  categories.forEach((category) => {
    createBtn(category.id, category.name);
  });
}

// __ Chargement des travaux
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

// __ Filtrage des travaux (figures) par catégories (sans nouvel appel API)
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

// __ Mode édition de la page index
function enableEditMode() {
  // const token = localStorage.getItem("token");
  if (token) {
    document.querySelector("#edit-banner").classList.remove("is-hidden");
    document.querySelector("#nav-login").classList.add("is-hidden");
    document.querySelector("#nav-logout").classList.remove("is-hidden");
    document.querySelector(".filters").classList.add("is-hidden");
    document.querySelector("#edit-btn-container").classList.remove("is-hidden");
    document.querySelector("#portfolio-header").classList.add("edit-mode");
  }
}

function disableEditMode() {
  event.preventDefault();
  localStorage.removeItem("token");
  // window.location.href = "login.html";
  window.location.reload(); // recharge la page index.html
}

// __ Fonctions de gestion de la modale __________________________________________________

// __ Ouvre la modale (pattern Grafikart : style.display = null → laisse le CSS flex agir)
const openModal = function (event) {
  event.preventDefault();
  modal = document.querySelector("#modal-overlay");
  modal.style.display = null; // retire le display:none inline
  modal.setAttribute("aria-hidden", "false");
  modal.setAttribute("aria-modal", "true");
  showModalGallery(); // toujours s'ouvrir sur la Vue 1

  modal.addEventListener("click", closeModal); // click dans la partie sombre de la modale
  modal.querySelector(".js-modal-close").addEventListener("click", closeModal); // click sur la croix de fermeture
  modal
    .querySelector(".js-modal-stop")
    .addEventListener("click", stopPropagation); // click dans la partie claire de la modale

  window.addEventListener("keydown", closeModalOnEscape);
};

// __ Ferme la modale
const closeModal = function (event) {
  if (event) event.preventDefault();
  // console.log("Parent cliqué");

  btnEdit.focus(); // redonner le focus avant removeAttribute("aria-modal") - alerte W3C

  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
  modal.removeAttribute("aria-modal");

  modal.removeEventListener("click", closeModal); // suppression des écoutes
  modal
    .querySelector(".js-modal-close")
    .removeEventListener("click", closeModal);
  modal
    .querySelector(".js-modal-stop")
    .removeEventListener("click", stopPropagation);
  window.removeEventListener("keydown", closeModalOnEscape);
  modal = null;
};

// __ Fermeture par la touche Échap (pattern Grafikart)
const closeModalOnEscape = function (event) {
  if (event.key === "Escape" || event.key === "Esc") closeModal(event);
};

// __ Stoppe la propagation vers l'overlay (pattern Grafikart : clic sur fond ≠ clic sur contenu)
const stopPropagation = function (event) {
  event.stopPropagation();
  // console.log("Enfant cliqué");
};

// __ Navigation interne : Vue 1 (galerie)
const showModalGallery = function () {
  document.querySelector("#modal-gallery").style.display = null;
  document.querySelector("#modal-form").style.display = "none";
};

// __ Navigation interne : Vue 2 (formulaire)
const showModalForm = function () {
  document.querySelector("#modal-gallery").style.display = "none";
  document.querySelector("#modal-form").style.display = null;
};

// Main

// __ Initialisation : async function init() inutile ici  les deux fonctions de chargement sont indépendantes l'une de l'autre
enableEditMode();
loadFilters();
loadWorks();

// __ Event listeners ____________________________________________________________________________
filters.addEventListener("click", selectFilter); // ici selectFilter reçoit 'event' en premier paramètre

btnLogout.addEventListener("click", disableEditMode);

// __ Modale : ouverture au clic sur Modifier, fermeture sur l'overlay, navigation

btnEdit.addEventListener("click", openModal);

btnModalAdd.addEventListener("click", showModalForm);
btnModalBack.addEventListener("click", showModalGallery);
