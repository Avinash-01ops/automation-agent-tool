// ===================== Project Page Script =====================

// Set project title from localStorage on page load
window.onload = function () {
  const title = localStorage.getItem("projectName") || "Untitled Project";
  document.getElementById("projectTitle").textContent = title;
};

// ===================== Utility Functions =====================

/**
 * Show an error message below the input field.
 * @param {string} id - The input field's id
 * @param {string} message - The error message to display
 */
function showError(id, message) {
  let el = document.getElementById(id + "Error");
  if (!el) {
    el = document.createElement("div");
    el.id = id + "Error";
    el.className = "input-error";
    document.getElementById(id).parentElement.appendChild(el);
  }
  el.textContent = message;
}

/**
 * Clear the error message for a given input field.
 * @param {string} id - The input field's id
 */
function clearError(id) {
  const el = document.getElementById(id + "Error");
  if (el) el.textContent = "";
}

/**
 * Show or hide a loading spinner.
 * @param {boolean} isLoading - Whether to show or hide the spinner
 */
function setLoading(isLoading) {
  let spinner = document.getElementById("loadingSpinner");
  if (!spinner) {
    spinner = document.createElement("div");
    spinner.id = "loadingSpinner";
    spinner.innerHTML = `<span style="display:inline-block;width:22px;height:22px;border:3px solid var(--primary-color);border-top:3px solid transparent;border-radius:50%;animation:spin 1s linear infinite;"></span> <span style="font-weight:600;color:var(--primary-color);">Loading...</span>`;
    spinner.style.cssText = `display:flex;align-items:center;gap:0.7rem;margin-top:1rem;justify-content:center;font-size:1.1rem;min-height:32px;`;
    const urlBox = document.getElementById("url-box");
    urlBox.parentElement.insertBefore(spinner, urlBox.nextSibling);
  }
  spinner.style.display = isLoading ? "flex" : "none";
}

// Add CSS for spinner animation (only once)
if (!document.getElementById('spinKeyframes')) {
  const style = document.createElement('style');
  style.id = 'spinKeyframes';
  style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}

// ===================== Main Event Handlers =====================

/**
 * Handle the Get XPaths button click: fetches XPaths from backend, shows loading, errors, and results.
 */
document.getElementById("getXpathsBtn").addEventListener("click", async () => {
  const url = document.getElementById("urlInput").value.trim();
  const logBox = document.getElementById("logContent");
  const xpathsBox = document.getElementById("xpaths-box");
  const logsBox = document.getElementById("logs-box");

  clearError("urlInput");
  logBox.textContent = "";

  if (!url) {
    showError("urlInput", "Please enter a valid URL.");
    return;
  }

  setLoading(true);
  xpathsBox.style.display = "none";
  logsBox.style.display = "none";
  ["textFields", "inputFields", "buttons"].forEach(id => {
    document.getElementById(id).innerHTML = "";
  });

  try {
    const response = await fetch("http://localhost:5000/api/scrape-xpaths", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });
    const data = await response.json();
    setLoading(false);

    if (data.error) {
      showError("urlInput", data.error);
      logBox.textContent = "❌ Error: " + data.error;
      logsBox.style.display = "block";
      return;
    }

    logBox.textContent = `✅ Scraping complete. Found ${data.xpaths.length} elements.\n`;
    logBox.textContent += data.logs ? `📄 Page Preview:\n${data.logs}\n` : '';
    logsBox.style.display = "block";

    const categories = { textFields: [], inputFields: [], buttons: [] };
    data.xpaths.forEach(item => {
        if (item.category === 'Text Field' || item.category === 'Text') categories.textFields.push(item);
        else if (item.category === 'Input Field' || item.category === 'Input') categories.inputFields.push(item);
        else if (item.category === 'Button') categories.buttons.push(item);
    });

    const renderList = (arr) => arr.length
      ? arr.map(e => `<li><p>${e.name || e.html}</p><code>${e.xpath}</code></li>`).join("")
      : "<li>No items found in this category.</li>";
      
    document.getElementById("textFields").innerHTML = renderList(categories.textFields);
    document.getElementById("inputFields").innerHTML = renderList(categories.inputFields);
    document.getElementById("buttons").innerHTML = renderList(categories.buttons);
    
    const hasAnyXPaths = Object.values(categories).some(arr => arr.length > 0);
    if(hasAnyXPaths) {
        xpathsBox.style.display = "block";
        // Default to first tab
        switchTab('textFields');
    }

  } catch (err) {
    setLoading(false);
    showError("urlInput", "Request failed. Check connection or backend.");
    logBox.textContent = "❌ Request failed: " + err.message;
    logsBox.style.display = "block";
  }
});

// Tab switching logic
const tabs = {
    textFields: document.getElementById('tabTextFields'),
    inputFields: document.getElementById('tabInputFields'),
    buttons: document.getElementById('tabButtons')
};

function switchTab(activeTab) {
    Object.keys(tabs).forEach(tabId => {
        const isVisible = tabId === activeTab;
        document.getElementById(tabId).style.display = isVisible ? "block" : "none";
        tabs[tabId].classList.toggle('active', isVisible);
    });
}

tabs.textFields.onclick = () => switchTab('textFields');
tabs.inputFields.onclick = () => switchTab('inputFields');
tabs.buttons.onclick = () => switchTab('buttons');


/**
 * Handle Save Credentials button: validates and (mock) saves credentials.
 */
document.getElementById("saveCredsBtn").addEventListener("click", () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  clearError("username");
  clearError("password");

  if (!username && !password) {
    showError("username", "Enter username or password to save.");
    return;
  }
  
  alert("Credentials saved securely (mock)");
});