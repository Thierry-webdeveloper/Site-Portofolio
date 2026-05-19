// Variables globales *************************************************************************
const filters = document.querySelector(".filters");
const gallery = document.querySelector(".gallery");
const btnLogout = document.querySelector("#logout-link");
// __ Variables d'accès et de navigation de la Modale
const btnEdit = document.querySelector("#edit-btn");
const btnModalAdd = document.querySelector("#modal-add-btn");
const btnModalBack = document.querySelector("#modal-back");
// __ Variable modale suppression des travaux
const modalGallery = document.querySelector(".modal-works-gallery");
// __ Variables modale ajout d'un projet
const modalForm = document.querySelector("#modal-form form");
const photoInput = document.querySelector("#photo-input");
const photoTitle = document.querySelector("#photo-title");
const photoCategory = document.querySelector("#photo-category");
const formSubmit = document.querySelector("#form-submit");
const uploadZone = document.querySelector("#upload-zone");
let categoriesLoaded = false; // évite de rejouer la fonction loadFormCategories()
// __ Variable identifiant d'accès aux fonctionnalités administrateur
const token = localStorage.getItem("token");

let modal = null; // référence à la modale ouverte (pattern Grafikart)

// Fonctions **********************************************************************************

// __ Gestion de l'accès au serveur  __________________________________________________________

// __ Communication avec l'API de Fatima (JSDoc)
/*
 * @param {string} url - Le point de terminaison (ex: "works", "categories").
 * @param {string} method - La méthode HTTP (GET, POST, DELETE, PUT).
 * @param {Object|FormData|null} [body=null] - Les données à envoyer. Peut être un objet JSON ou un FormData.
 * @param {string|null} [token=null] - Le jeton d'authentification (Bearer token).
 * @returns {Promise<{available: boolean, data: any, status?: number, error?: string}>}
 */
async function apiCall(url, method, body = null, token = null) {
  try {
    const headers = {};
    const options = { method, headers };

    // Ajout automatique du header Authorization si un token est fourni
    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    url = "http://localhost:5678/api/" + url;

    if (body) {
      if (body instanceof FormData) {
        // En cas de FormData, l'assigner directement sans Header Content-Type
        options.body = body;
      } else {
        // En cas d'objet standard, conversion JSON et Header approprié
        options.body = JSON.stringify(body);
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
      alert(
        `Erreur serveur : ${response.status}\nLa requête n'a pas pu aboutir.`,
      );
      return { available: false, data: null };
    }
  } catch (error) {
    // Capture les erreurs réseau, DNS et les erreurs de parsing JSON
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

// __ Fonction mutualisée - création d'un élément enfant pour "loadWorks" et de "addWorkToDOM"
function createGalleryChild(work) {
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

  return figure;
}

// __ Chargement des travaux
async function loadWorks() {
  const { available, data: works } = await apiCall("works", "GET");

  if (available) {
    works.forEach((work) => {
      gallery.appendChild(createGalleryChild(work));
    });
  }
}

// __ Suppression d'un enregistrement de la base de données
async function deleteRecord(id) {
  if (id && token) {
    const { available } = await apiCall(`works/${id}`, "DELETE", null, token);
    return available;
  }
  alert("Suppression impossible : identifiant invalide ou session expirée.");
  return false;
}

// __ Ajout d'un enregistrement de la base de données
async function addRecord(formData) {
  if (formData instanceof FormData && token) {
    const { available, data } = await apiCall("works", "POST", formData, token);
    return { available, data };
  }
  alert("Ajout impossible : données invalides ou session expirée.");
  return { available: false, data: null };
}
// __ Gestion de la page principale __________________________________________________________

// __ Chargement des données du serveur
async function loadData() {
  const success = await loadFilters();
  if (success === true) loadWorks();
}

// __ Gestion du mode d'édition de la page index
function enableEditMode() {
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

// __ Peuplement du select de catégories "photoCategory" du formulaire d'ajout (showModalForm Vue 2)
async function loadFormCategories() {
  if (!categoriesLoaded) {
    const { available, data: categories } = await apiCall("categories", "GET");
    if (!available) return;

    // Vider les options existantes sauf la première (option vide)
    photoCategory.innerHTML = '<option value=""></option>';

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.name;
      photoCategory.appendChild(option);
    });

    // évite de rejouer cette fonction : actuellement aucune fonctionnalité pour créer une nouvelle catégorie
    categoriesLoaded = true;
  }
}

// __ Navigation interne : Vue 1 (modale-galerie)
const showModalGallery = function () {
  document.querySelector("#modal-gallery").style.display = null;
  document.querySelector("#modal-form").style.display = "none";
};

// __ Navigation interne : Vue 2 (modale-formulaire d'ajout)
const showModalForm = function () {
  document.querySelector("#modal-gallery").style.display = "none";
  document.querySelector("#modal-form").style.display = null;

  loadFormCategories(); // chargement dynamique des catégories
};

// __ Actualisation du DOM des galeries après la suppression du travail
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

// __ Suppression d'un travail dans modalGallery (Vue 1)
async function deleteWork() {
  if (event.target.tagName === "BUTTON" || event.target.tagName === "I") {
    const figureModal = event.target.closest("figure");
    const workId = figureModal.getAttribute("data-work");

    const confirmation = confirm(
      "Êtes-vous sûr de vouloir supprimer cette photo de la galerie ?",
    );

    if (confirmation) {
      // __ Suppression de l'enregistrement en base de données
      const recordDeleted = await deleteRecord(workId);
      if (recordDeleted) {
        // __ Mise à jour des affichages du DOM
        refreshDOM(workId);
      }
    }
  }
}

// __ Fonction mutualisée - ajout d'un élément enfant pour "addWorkToDOM" et "cloningGallery"
function addModalGalleryChild(figure) {
  const clone = figure.cloneNode(true);
  clone.querySelector("figcaption").remove();

  const trashBtn = document.createElement("button");
  trashBtn.classList.add("modal-delete-btn");
  trashBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
  clone.appendChild(trashBtn);

  modalGallery.appendChild(clone);
}

// __ Clonage des travaux de gallery vers modalGallery (Vue 1)
function cloningGallery() {
  if (modalGallery.childElementCount === 0) {
    for (const figure of gallery.children) {
      addModalGalleryChild(figure);
    }
  }
}

// __ Ajout synchronisé d'un élément enfant dans le DOM des sélecteurs de gallery et modalGallery
function addWorkToDOM(work) {
  const figure = createGalleryChild(work);
  gallery.appendChild(figure);
  addModalGalleryChild(figure);
}

// __ Stoppe la propagation vers l'overlay (pattern Grafikart : clic sur fond ≠ clic sur contenu)
const stopPropagation = function (event) {
  event.stopPropagation();
};

// __ Ouvre la modale (pattern Grafikart : style.display = null → laisse le CSS flex agir)
const openModal = function (event) {
  event.preventDefault();
  modal = document.querySelector("#modal-overlay");
  modal.style.display = null; // retire le display:none inline => Le navigateur reprend le CSS (.modal)
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

// __ Ferme la modale (écoute de l'évènement activé dans openModal)
const closeModal = function (event) {
  if (event) event.preventDefault();

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

// __ Vérification de la validité du formulaire (active/désactive bouton Valider Vue 2)
function checkFormValidity() {
  const hasImage = photoInput.files.length > 0;
  const hasTitle = photoTitle.value.trim() !== "";
  const hasCategory = photoCategory.value !== "";

  if (hasImage && hasTitle && hasCategory) {
    formSubmit.classList.add("data-valid");
  } else {
    formSubmit.classList.remove("data-valid");
  }
}

// __ Vérification du format et de la taille du fichier uploader (previewImage Vue 2)
function isFileValid(file) {
  const maxSize = 4 * 1024 * 1024;
  const validTypes = ["image/jpeg", "image/png"]; // type : tableau

  if (!validTypes.includes(file.type))
    return {
      isValid: false,
      error: "** Ajout photo **\nSeuls les formats JPG et PNG sont acceptés.",
    };
  if (file.size > maxSize)
    return {
      isValid: false,
      error:
        "** Ajout photo **\nVeuillez sélectionner une image inférieure à 4Mo.",
    };

  return { isValid: true };
}

// __ Restaure l'état visuel initial de upload-zone (preview off, instructions on - Vue 2).
function resetUploadZone() {
  photoInput.value = ""; // vide la sélection du fichier

  // Cherche l'image de preview pour la supprimer
  const img = uploadZone.querySelector("img");
  if (img) {
    img.remove();
  }

  // Affichage des éléments d'origine
  // convertit la HTMLCollection en vrai Array; .children contient l'icône, le label et le <p>
  Array.from(uploadZone.children).forEach((child) => {
    // photoInput doit rester invisible pour ne pas afficher le bouton par défaut du navigateur
    if (child !== photoInput) {
      child.style.display = ""; // Le navigateur reprend le CSS d'origine
    }
  });
}

// __ Prévisualisation de l'image sélectionnée dans la zone d'upload (Vue 2)
function previewImage() {
  const file = photoInput.files[0];
  if (!file) return;

  const checkFile = isFileValid(file);

  if (!checkFile.isValid) {
    alert(checkFile.error);
    resetUploadZone();
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    // Masquage CSS des enfants existants (i, label, p) de la zone et afficher l'image à la place
    Array.from(uploadZone.children).forEach((child) => {
      if (child !== photoInput) {
        child.style.display = "none";
      }
    });

    // 2. On ajoute l'image de preview sans supprimer le reste
    let img = uploadZone.querySelector("img");
    if (!img) {
      img = document.createElement("img");
      uploadZone.appendChild(img);
    }
    img.src = e.target.result;
    img.style.display = "block"; // On s'assure que l'image est visible
    img.style.maxHeight = "169px"; // Garde tes proportions
  };
  reader.readAsDataURL(file);

  checkFormValidity(); // mise à jour couleur bouton
}

// __ Nettoie entièrement le formulaire de la modale (Vue 2)
function clearModalForm() {
  modalForm.reset(); // reset natif
  resetUploadZone(); // reset visuel
  checkFormValidity(); // bouton redevient gris
}

// __ Envoi du formulaire d'ajout via POST /works (multipart/form-data)
async function submitForm() {
  event.preventDefault();

  // Récupération des valeurs
  const file = photoInput.files[0];
  const title = photoTitle.value.trim(); // supprime les espaces inutiles au début et à la fin d’une chaîne de caractères
  const categoryId = photoCategory.value;

  // Validation côté client
  if (!file || !title || !categoryId) {
    alert(
      "** Ajout photo **\nVeuillez remplir tous les champs avant de valider !",
    );
    return;
  }

  // Construction du FormData
  const formData = new FormData();
  formData.append("image", file);
  formData.append("title", title);
  formData.append("category", parseInt(categoryId)); // l'API attend un integer

  const { available: recordAdded, data: newWork } = await addRecord(formData);
  if (recordAdded) {
    addWorkToDOM(newWork);
    clearModalForm();
    showModalGallery();
  }
}

// Main ****************************************************************************************

// __ Initialisation : async function init() inutile ici ces deux fonctions sont indépendantes l'une de l'autre
enableEditMode();
loadData();

// __ Event listeners _________________________________________________________________________
filters.addEventListener("click", selectFilter); // ici selectFilter reçoit 'event' en premier paramètre

btnLogout.addEventListener("click", disableEditMode);

// __ Modale : ouverture au clic sur Modifier, fermeture sur l'overlay, navigation

btnEdit.addEventListener("click", openModal);

btnModalAdd.addEventListener("click", showModalForm);
btnModalBack.addEventListener("click", showModalGallery);

// __ Modale : Formulaire d'ajout
photoInput.addEventListener("change", previewImage);
photoTitle.addEventListener("input", checkFormValidity);
photoCategory.addEventListener("change", checkFormValidity);
modalForm.addEventListener("submit", submitForm);
