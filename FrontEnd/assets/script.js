// Variables globales
const gallery = document.querySelector(".gallery");
// let galleryWorkCount = 0;

// Fonctions
async function loadImages() {
  const response = await fetch("http://localhost:5678/api/works");
  const works = await response.json();
  // galleryWorkCount = works.length;
  works.forEach((work) => {
    const figure = document.createElement("figure");
    const image = document.createElement("img");
    const figcaption = document.createElement("figcaption");

    image.src = work.imageUrl;
    image.alt = work.title;
    figcaption.textContent = work.title;

    figure.appendChild(image);
    figure.appendChild(figcaption);
    gallery.appendChild(figure);
  });
}

// Main
loadImages();
