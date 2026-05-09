// Variables globales
const loginForm = document.querySelector("#login form");
const errorMsg = document.querySelector("#login-error");

// Gestionnaire de soumission
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault(); // bloque le comportement natif par défaut du navigateur : rechargement de la page

  // __ Lecture des valeurs saisies
  const email = document.querySelector("#email").value;
  const password = document.querySelector("#password").value;

  errorMsg.textContent = "";

  // __ Vérification si le champs email est vide
  if (email == "") {
    errorMsg.textContent = "Veuillez saisir votre E-mail !";
    return;
  }

  // __ Appel API : POST /users/login (action/format/charge)
  const response = await fetch("http://localhost:5678/api/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (response.ok) {
    const data = await response.json();
    localStorage.setItem("token", data.token);
    console.log("Token JWT :", data.token);
    window.location.href = "index.html";
  } else {
    // Affichage du message d'erreur dans le DOM, création d'une balise <p id="login-error"> si elle n'existe pas
    // let errorMsg = document.querySelector("#login-error");
    // if (!errorMsg) {
    //   errorMsg = document.createElement("p");
    //   errorMsg.id = "login-error";
    //   loginForm.appendChild(errorMsg);
    // }
    errorMsg.textContent = "** Erreur dans l'identifiant ou le mot de passe **";
  }
});
