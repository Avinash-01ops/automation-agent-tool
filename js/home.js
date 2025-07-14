
// ===================== Home Page Script =====================

// Utility: Show error message below input
function showError(id, message) {
  let el = document.getElementById(id + "Error");
  if (!el) {
    el = document.createElement("div");
    el.id = id + "Error";
    el.className = "input-error";
    el.style.color = "#d32f2f";
    el.style.fontSize = "0.98rem";
    el.style.marginTop = "0.3rem";
    el.style.fontWeight = "500";
    document.getElementById(id).parentElement.appendChild(el);
  }
  el.textContent = message;
}
function clearError(id) {
  const el = document.getElementById(id + "Error");
  if (el) el.textContent = "";
}

// Utility: Show/hide loading spinner (for future async actions)
function setLoading(isLoading) {
  let spinner = document.getElementById("loadingSpinner");
  if (!spinner) {
    spinner = document.createElement("div");
    spinner.id = "loadingSpinner";
    spinner.innerHTML = '<span style="display:inline-block;width:22px;height:22px;border:3px solid #5db6fe;border-top:3px solid #fff;border-radius:50%;animation:spin 1s linear infinite;"></span> <span style="color:#5db6fe;font-weight:600;">Loading...</span>';
    spinner.style.display = "flex";
    spinner.style.alignItems = "center";
    spinner.style.gap = "0.7rem";
    spinner.style.margin = "1.2rem 0 0.5rem 0";
    spinner.style.justifyContent = "center";
    spinner.style.fontSize = "1.1rem";
    spinner.style.minHeight = "32px";
    document.body.appendChild(spinner);
  }
  spinner.style.display = isLoading ? "flex" : "none";
}

// Add CSS for spinner animation (only once)
if (!document.getElementById('spinKeyframes')) {
  const style = document.createElement('style');
  style.id = 'spinKeyframes';
  style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`;
  document.head.appendChild(style);
}

// Open modal for new project
document.getElementById("newProjectBtn").addEventListener("click", () => {
  document.getElementById("projectModal").classList.remove("hidden");
  document.getElementById("projectName").value = "";
  document.getElementById("projectDesc").value = "";
  clearError("projectName");
  clearError("projectDesc");
});

// Close modal
document.getElementById("closeModal").addEventListener("click", () => {
  document.getElementById("projectModal").classList.add("hidden");
});

// Modal close on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.getElementById("projectModal").classList.add("hidden");
  }
});

// Handle project form submission
document.getElementById("projectForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const name = document.getElementById("projectName").value.trim();
  const desc = document.getElementById("projectDesc").value.trim();
  clearError("projectName");
  clearError("projectDesc");

  let hasError = false;
  if (!name) {
    showError("projectName", "Project name is required.");
    hasError = true;
  }
  if (!desc) {
    showError("projectDesc", "Description is required.");
    hasError = true;
  }
  if (hasError) return;

  // Simulate loading (for future async save)
  setLoading(true);
  setTimeout(() => {
    setLoading(false);
    const project = {
      id: generateID(),
      name,
      desc
    };

    // Render project tile
    const tile = document.createElement("div");
    tile.className = "project-tile";
    tile.innerHTML = `
      <strong>${project.name}</strong>
      <p>${project.desc}</p>
      <div class="btn-row">
        <button onclick="openProject('${project.id}', '${project.name}')" class="btn btn-icon"><i class='fas fa-folder-open'></i> Edit</button>
        <button onclick="this.parentElement.parentElement.remove()" class="btn btn-icon"><i class='fas fa-trash'></i> Delete</button>
      </div>
    `;

    const container = document.getElementById("projectsContainer");
    container.classList.remove("empty");
    container.innerHTML = '';
    container.appendChild(tile);
    document.getElementById("projectModal").classList.add("hidden");
  }, 600);
});

// Open project: save name to localStorage and go to project.html
function openProject(id, name) {
  localStorage.setItem("projectName", name);
  window.location.href = "project.html";
}
