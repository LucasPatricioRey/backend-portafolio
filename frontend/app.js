const API_URL = "http://localhost:3000";

const authOptions = document.getElementById("authOptions");
const registerSection = document.getElementById("registerSection");
const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");

const showLoginBtn = document.getElementById("showLoginBtn");
const showRegisterBtn = document.getElementById("showRegisterBtn");
const backFromRegister = document.getElementById("backFromRegister");
const backFromLogin = document.getElementById("backFromLogin");

const registerName = document.getElementById("registerName");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");
const getUsersBtn = document.getElementById("getUsersBtn");
const logoutBtn = document.getElementById("logoutBtn");
const deleteAccountBtn = document.getElementById("deleteAccountBtn");

const tokenText = document.getElementById("tokenText");
const statusText = document.getElementById("statusText");
const userText = document.getElementById("userText");
const usersList = document.getElementById("usersList");
const message = document.getElementById("message");

let token = localStorage.getItem("token");
let userName = localStorage.getItem("userName");
let userEmail = localStorage.getItem("userEmail");

updateUI();

showLoginBtn.addEventListener("click", showLogin);
showRegisterBtn.addEventListener("click", showRegister);
backFromRegister.addEventListener("click", showAuthOptions);
backFromLogin.addEventListener("click", showAuthOptions);

registerBtn.addEventListener("click", registerUser);
loginBtn.addEventListener("click", loginUser);
getUsersBtn.addEventListener("click", getUsers);
logoutBtn.addEventListener("click", logout);
deleteAccountBtn.addEventListener("click", deleteAccount);

function showLogin() {
  authOptions.classList.add("hidden");
  registerSection.classList.add("hidden");
  loginSection.classList.remove("hidden");
}

function showRegister() {
  authOptions.classList.add("hidden");
  loginSection.classList.add("hidden");
  registerSection.classList.remove("hidden");
}

function showAuthOptions() {
  authOptions.classList.remove("hidden");
  loginSection.classList.add("hidden");
  registerSection.classList.add("hidden");
}

function updateUI() {
  if (token) {
    authOptions.classList.add("hidden");
    registerSection.classList.add("hidden");
    loginSection.classList.add("hidden");
    dashboardSection.classList.remove("hidden");

    logoutBtn.style.display = "inline-block";
    deleteAccountBtn.style.display = "inline-block";

    statusText.textContent = "Estás logueado";
    userText.textContent = userName && userEmail
      ? `${userName} - ${userEmail}`
      : "Sesión iniciada correctamente";

    tokenText.textContent = token;
  } else {
    authOptions.classList.remove("hidden");
    registerSection.classList.add("hidden");
    loginSection.classList.add("hidden");
    dashboardSection.classList.add("hidden");

    logoutBtn.style.display = "none";
    deleteAccountBtn.style.display = "none";

    statusText.textContent = "No estás logueado";
    userText.textContent = "Elegí una opción para continuar.";
    tokenText.textContent = "Todavía no hay token";
    usersList.innerHTML = "";
  }
}

async function registerUser() {
  const user = {
    name: registerName.value.trim(),
    email: registerEmail.value.trim(),
    password: registerPassword.value.trim()
  };

  try {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(user)
    });

    const data = await response.json();

    showMessage(data.message, response.ok);

    if (response.ok) {
      registerName.value = "";
      registerEmail.value = "";
      registerPassword.value = "";
      showLogin();
    }

  } catch (error) {
    showMessage("Error al registrar usuario", false);
    console.log(error);
  }
}

async function loginUser() {
  const user = {
    email: loginEmail.value.trim(),
    password: loginPassword.value.trim()
  };

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(user)
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.message, false);
      return;
    }

    token = data.token;
    userName = data.user.name;
    userEmail = data.user.email;

    localStorage.setItem("token", token);
    localStorage.setItem("userName", userName);
    localStorage.setItem("userEmail", userEmail);

    loginEmail.value = "";
    loginPassword.value = "";

    updateUI();
    showMessage(data.message, true);

  } catch (error) {
    showMessage("Error al iniciar sesión", false);
    console.log(error);
  }
}

async function getUsers() {
  if (!token) {
    showMessage("Primero tenés que iniciar sesión", false);
    return;
  }

  try {
    const response = await fetch(`${API_URL}/users`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.message, false);
      return;
    }

    usersList.innerHTML = "";

    data.forEach(user => {
      const li = document.createElement("li");

      li.innerHTML = `
        <div>
          <strong>${user.name}</strong>
          <span>${user.email}</span>
        </div>
      `;

      usersList.appendChild(li);
    });

    showMessage("Usuarios cargados correctamente", true);

  } catch (error) {
    showMessage("Error al obtener usuarios", false);
    console.log(error);
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");

  token = null;
  userName = null;
  userEmail = null;

  updateUI();
  showMessage("Sesión cerrada correctamente", true);
}

async function deleteAccount() {
  const confirmDelete = confirm("¿Seguro que querés eliminar tu cuenta? Esta acción no se puede deshacer.");

  if (!confirmDelete) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/me`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.message, false);
      return;
    }

    logout();
    showMessage(data.message, true);

  } catch (error) {
    showMessage("Error al eliminar la cuenta", false);
    console.log(error);
  }
}

function showMessage(text, success = true) {
  message.textContent = text;
  message.className = success ? "success" : "error";
}