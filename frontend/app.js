const API_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://backend-portafolio-r87v.onrender.com";

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
const projectsList = document.getElementById("projectsList");
const message = document.getElementById("message");

const projectFormTitle = document.getElementById("projectFormTitle");
const projectTitle = document.getElementById("projectTitle");
const projectDescription = document.getElementById("projectDescription");
const projectStatus = document.getElementById("projectStatus");
const saveProjectBtn = document.getElementById("saveProjectBtn");
const refreshProjectsBtn = document.getElementById("refreshProjectsBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

let token = localStorage.getItem("token");
let userName = localStorage.getItem("userName");
let userEmail = localStorage.getItem("userEmail");
let editingProjectId = null;

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
saveProjectBtn.addEventListener("click", saveProject);
refreshProjectsBtn.addEventListener("click", getProjects);
cancelEditBtn.addEventListener("click", resetProjectForm);

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

    logoutBtn.classList.remove("hidden");
    deleteAccountBtn.classList.remove("hidden");

    statusText.textContent = "Sesión iniciada";
    userText.textContent = userName && userEmail
      ? `${userName} · ${userEmail}`
      : "Autenticación correcta.";

    tokenText.textContent = token;
    getProjects();
  } else {
    authOptions.classList.remove("hidden");
    registerSection.classList.add("hidden");
    loginSection.classList.add("hidden");
    dashboardSection.classList.add("hidden");

    logoutBtn.classList.add("hidden");
    deleteAccountBtn.classList.add("hidden");

    statusText.textContent = "No estás logueado";
    userText.textContent = "Elegí una opción para empezar a probar el flujo.";
    tokenText.textContent = "Todavía no hay token";
    usersList.innerHTML = "";
    projectsList.innerHTML = renderEmptyProjects();
    resetProjectForm();
  }
}

async function registerUser() {
  const user = {
    name: registerName.value.trim(),
    email: registerEmail.value.trim(),
    password: registerPassword.value.trim()
  };

  if (!user.name || !user.email || !user.password) {
    showMessage("Completá todos los campos del registro.", false);
    return;
  }

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
    showMessage("No se pudo registrar el usuario.", false);
    console.error(error);
  }
}

async function loginUser() {
  const user = {
    email: loginEmail.value.trim(),
    password: loginPassword.value.trim()
  };

  if (!user.email || !user.password) {
    showMessage("Ingresá email y contraseña.", false);
    return;
  }

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
    showMessage("No se pudo iniciar sesión.", false);
    console.error(error);
  }
}

async function getUsers() {
  if (!token) {
    showMessage("Primero tenés que iniciar sesión.", false);
    return;
  }

  try {
    const response = await fetch(`${API_URL}/users`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.message, false);
      return;
    }

    usersList.innerHTML = data.length
      ? data.map(user => `
        <li>
          <strong>${escapeHtml(user.name)}</strong>
          <span>${escapeHtml(user.email)}</span>
        </li>
      `).join("")
      : '<li class="empty-state">No hay usuarios para mostrar todavía.</li>';

    showMessage("Usuarios cargados correctamente.", true);
  } catch (error) {
    showMessage("No se pudieron obtener los usuarios.", false);
    console.error(error);
  }
}

async function getProjects() {
  if (!token) {
    projectsList.innerHTML = renderEmptyProjects();
    return;
  }

  try {
    const response = await fetch(`${API_URL}/projects`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.message, false);
      return;
    }

    renderProjects(data);
  } catch (error) {
    projectsList.innerHTML = '<div class="empty-state">No se pudieron cargar los proyectos.</div>';
    console.error(error);
  }
}

async function saveProject() {
  if (!token) {
    showMessage("Necesitás iniciar sesión para guardar proyectos.", false);
    return;
  }

  const payload = {
    title: projectTitle.value.trim(),
    description: projectDescription.value.trim(),
    status: projectStatus.value
  };

  if (!payload.title || !payload.description) {
    showMessage("Completá el título y la descripción del proyecto.", false);
    return;
  }

  const isEditing = Boolean(editingProjectId);
  const url = isEditing ? `${API_URL}/projects/${editingProjectId}` : `${API_URL}/projects`;
  const method = isEditing ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.message, false);
      return;
    }

    resetProjectForm();
    getProjects();
    showMessage(isEditing ? "Proyecto actualizado correctamente." : "Proyecto creado correctamente.", true);
  } catch (error) {
    showMessage("No se pudo guardar el proyecto.", false);
    console.error(error);
  }
}

function startEditProject(project) {
  editingProjectId = project._id;
  projectFormTitle.textContent = "Editar proyecto";
  projectTitle.value = project.title;
  projectDescription.value = project.description;
  projectStatus.value = project.status;
  saveProjectBtn.textContent = "Guardar cambios";
  cancelEditBtn.classList.remove("hidden");
  window.scrollTo({ top: dashboardSection.offsetTop - 20, behavior: "smooth" });
}

async function deleteProject(id) {
  const confirmDelete = window.confirm("¿Querés eliminar este proyecto?");

  if (!confirmDelete) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/projects/${id}`, {
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

    if (editingProjectId === id) {
      resetProjectForm();
    }

    getProjects();
    showMessage(data.message, true);
  } catch (error) {
    showMessage("No se pudo eliminar el proyecto.", false);
    console.error(error);
  }
}

function renderProjects(projects) {
  if (!projects.length) {
    projectsList.innerHTML = renderEmptyProjects();
    return;
  }

  projectsList.innerHTML = projects.map(project => `
    <article class="project-item">
      <div class="project-head">
        <div>
          <strong>${escapeHtml(project.title)}</strong>
          <span class="project-meta">Estado: ${escapeHtml(project.status)}</span>
        </div>
        <span class="project-badge">${escapeHtml(project.status)}</span>
      </div>

      <p>${escapeHtml(project.description)}</p>

      <div class="project-actions">
        <button type="button" data-action="edit" data-id="${project._id}">Editar</button>
        <button type="button" data-action="delete" data-id="${project._id}" class="delete-btn">Eliminar</button>
      </div>
    </article>
  `).join("");

  projectsList.querySelectorAll("[data-action='edit']").forEach(button => {
    button.addEventListener("click", () => {
      const project = projects.find(item => item._id === button.dataset.id);

      if (project) {
        startEditProject(project);
      }
    });
  });

  projectsList.querySelectorAll("[data-action='delete']").forEach(button => {
    button.addEventListener("click", () => deleteProject(button.dataset.id));
  });
}

function resetProjectForm() {
  editingProjectId = null;
  projectFormTitle.textContent = "Nuevo proyecto";
  projectTitle.value = "";
  projectDescription.value = "";
  projectStatus.value = "pendiente";
  saveProjectBtn.textContent = "Guardar proyecto";
  cancelEditBtn.classList.add("hidden");
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");

  token = null;
  userName = null;
  userEmail = null;

  updateUI();
  showMessage("Sesión cerrada correctamente.", true);
}

async function deleteAccount() {
  const confirmDelete = window.confirm("¿Seguro que querés eliminar tu cuenta? Esta acción no se puede deshacer.");

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
    showMessage("No se pudo eliminar la cuenta.", false);
    console.error(error);
  }
}

function renderEmptyProjects() {
  return `
    <div class="empty-state">
      Todavía no hay proyectos cargados para este usuario. Creá uno desde el formulario para probar el CRUD protegido.
    </div>
  `;
}

function showMessage(text, success = true) {
  message.textContent = text;
  message.className = `message ${success ? "success" : "error"}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
