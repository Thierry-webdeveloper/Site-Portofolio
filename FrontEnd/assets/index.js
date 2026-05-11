// Variables globales
const filters = document.querySelector(".filters");
const gallery = document.querySelector(".gallery");
const btnLogout = document.querySelector("#logout-link");
const btnEdit = document.querySelector("#edit-btn");
const btnModalAdd = document.querySelector("#modal-add-btn");
const btnModalBack = document.querySelector("#modal-back");
const modalGallery = document.querySelector(".modal-works-gallery");
const token = localStorage.getItem("token");

let modal = null; // référence à la modale ouverte (pattern Grafikart)

// Fonctions

// __ Gestion de l'accès au serveur  __________________________________________________________

// __ Communication avec l'API de Fatima (JSDoc)
/*
 * Vérifie la disponibilité du serveur et retourne les données.
 * @param {string} url - L'adresse de la ressource.
 * @param {string} method - La méthode HTTP (GET, POST, PUT, DELETE, etc.).
 * @param {Object} [body=null] - Le corps de la requête (pour POST/PUT).
 * @param {Object} [headers={}] - Les entêtes personnalisés.
 */

async function apiCall(url, method, body = null, headers = {}) {
  console.log(`apiCall : activé\nmethod : ${method}`);

  try {
    // Configuration de la requête
    const options = { method, headers };

    // Compléter l'adresse de la ressource
    url = "http://localhost:5678/api/" + url;

    // Si on a un corps de texte (pour POST/PUT), on l'ajoute
    if (body) {
      options.body = JSON.stringify(body);
      // Sécurité et transformation pour s'assurer que le serveur interprète le corps comme du JSON
      if (!options.headers["Content-Type"]) {
        options.headers["Content-Type"] = "application/json";
      }
    }

    const response = await fetch(url, options);

    if (response.ok) {
      const text = await response.text(); // Récupère la réponse sous forme de texte brut
      let data;
      if (text) {
        data = JSON.parse(text);
      } else {
        data = null;
      }
      return { available: true, data: data };
    } else {
      console.log(`Erreur serveur : ${response.status}`);
      alert(
        `Erreur serveur : ${response.status}\nLa requête n'a pas pu aboutir.`,
      );
      return { available: false, data: null };
    }
  } catch (error) {
    // Capture les erreurs réseau, DNS et les erreurs de parsing JSON
    console.log(`Erreur réseau : ${error.message}`);
    alert(
      `Impossible de contacter le serveur.\nVérifiez votre connexion (${error.message})`,
    );
    return { available: false, data: null };
  }
}

// __ Chargement des catégories
async function loadFilters() {
  const { available, data: categories } = await apiCall("categories", "GET");

  if (available) {
    createBtn("all", "Tous");
    categories.forEach((category) => {
      createBtn(category.id, category.name);
    });
    return true;
  }

  return false;
}

// __ Chargement des travaux
async function loadWorks() {
  const { available, data: works } = await apiCall("works", "GET");

  if (available) {
    works.forEach((work) => {
      const figure = document.createElement("figure");
      const image = document.createElement("img");
      const figcaption = document.createElement("figcaption");

      image.src = work.imageUrl;
      image.alt = work.title;
      figcaption.textContent = work.title;

      figure.appendChild(image);
      figure.appendChild(figcaption);
      figure.dataset.work = work.id;
      figure.dataset.category = work.categoryId;

      gallery.appendChild(figure);
    });
  }
}

// __ Suppression d'un enregistrement de la base de données
async function deleteRecord(id) {
  // const fakeToken = "azerty";
  const { available } = await apiCall(`works/${id}`, "DELETE", null, {
    Authorization: `Bearer ${token}`,
  });
  return available;
}

// __ Gestion de la page principale __________________________________________________________

// __ Chargement des données du serveur
async function loadData() {
  const success = await loadFilters();
  if (success === true) {
    loadWorks();
  }
}

// __ Gestion du mode d'édition de la page index
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

// __ Application du style aux boutons du filtre (appelé par loadFilters)
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

// __ Gestion de la modale ___________________________________________________________________

// __ Actualisation de la galerie
function refreshDOM(idWork) {
  const figureGallery = gallery.querySelector(`figure[data-work="${idWork}"]`);
  const figureModal = modalGallery.querySelector(
    `figure[data-work="${idWork}"]`,
  );
  if (figureGallery && figureModal) {
    figureGallery.remove();
    figureModal.remove();
    return true;
  } else {
    return false;
  }
}

// __ Suppression d'un travail dans modalGallery
async function deleteWork() {
  if (event.target.tagName === "BUTTON" || event.target.tagName === "I") {
    const figureModal = event.target.closest("figure");
    const workId = figureModal.getAttribute("data-work");

    console.log("workId : " + workId);

    const confirmation = confirm(
      "Êtes-vous sûr de vouloir supprimer cette photo de la galerie ?",
    );

    if (confirmation) {
      console.log("Demande de suppression confirmée");

      // __ Suppression de l'enregistrement en base de données
      const recordDeleted = await deleteRecord(workId);
      if (recordDeleted) {
        console.log(
          `L'enregistrement ${workId} a été supprimé avec succès de la base de données.`,
        );

        // __ Mise à jour des affichages du DOM
        const domUpdated = refreshDOM(workId);
        if (domUpdated) {
          console.log("Actualisation du DOM réalisée");
        } else {
          console.log("L'actualisation de DOM a échoué");
        }
      }
    } else {
      console.log("Suppression abandonnée");
    }
  }
}

// __ Clonage des travaux de gallery vers modalGallery
function cloningGallery() {
  if (modalGallery.childElementCount === 0) {
    for (const child of gallery.children) {
      const clone = child.cloneNode(true);
      clone.querySelector("figcaption").remove();

      const trashBtn = document.createElement("button");
      trashBtn.classList.add("modal-delete-btn");
      trashBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';

      clone.appendChild(trashBtn);
      modalGallery.appendChild(clone);
    }
  }
}

// __ Ouvre la modale (pattern Grafikart : style.display = null → laisse le CSS flex agir)
const openModal = function (event) {
  event.preventDefault();
  modal = document.querySelector("#modal-overlay");
  modal.style.display = null; // retire le display:none inline
  modal.setAttribute("aria-hidden", "false");
  modal.setAttribute("aria-modal", "true");

  cloningGallery();
  showModalGallery(); // toujours s'ouvrir sur la Vue 1

  modal.addEventListener("click", closeModal); // click dans la partie sombre de la modale
  modal.querySelector(".js-modal-close").addEventListener("click", closeModal); // click sur la croix de fermeture
  modal
    .querySelector(".modal-works-gallery")
    .addEventListener("click", deleteWork); // click dans modal-works-gallery
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
    .querySelector(".modal-works-gallery")
    .removeEventListener("click", deleteWork);
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
  // console.log("Enfant cliqué (stopPropagation)");
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
loadData();

// __ Event listeners _________________________________________________________________________
filters.addEventListener("click", selectFilter); // ici selectFilter reçoit 'event' en premier paramètre

btnLogout.addEventListener("click", disableEditMode);

// __ Modale : ouverture au clic sur Modifier, fermeture sur l'overlay, navigation

btnEdit.addEventListener("click", openModal);

btnModalAdd.addEventListener("click", showModalForm);
btnModalBack.addEventListener("click", showModalGallery);
