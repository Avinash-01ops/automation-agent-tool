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

    // Debug: Log the full backend response and xpaths array
    console.log("[DEBUG] Backend response:", data);
    if (data && data.xpaths) {
      console.log(`[DEBUG] xpaths array (${data.xpaths.length}):`, data.xpaths);
    } else {
      console.warn("[DEBUG] No xpaths array in response or it is empty.");
    }

    if (data.error) {
      showError("urlInput", data.error);
      logBox.textContent = "❌ Error: " + data.error;
      logsBox.style.display = "block";
      return;
    }

    logBox.textContent = `✅ Scraping complete. Found ${data.xpaths && data.xpaths.length ? data.xpaths.length : 0} elements.\n`;
    logBox.textContent += data.logs ? `📄 Page Preview:\n${data.logs}\n` : '';
    logsBox.style.display = "block";

    // Organize by all categories
    const categories = {
      'Text Box': [],
      'Text Area': [],
      'Button': [],
      'Submit Button': [],
      'Reset Button': [],
      'Checkbox': [],
      'Radio Button': [],
      'Dropdown': [],
      'Dropdown Option': [],
      'Link': [],
      'Image': [],
      'Table': [],
      'Table Row': [],
      'Table Cell': [],
      'Frame/Iframe': [],
      'Modal Dialog': [],
      'Slider': [],
      'Tabs': [],
      'Tab': [],
      'Tab Panel': [],
      'Tooltip': [],
      'Menu': [],
      'Navigation Bar': [],
      'Pagination Control': [],
      'Progress Bar': [],
      'Auto-complete Field': [],
      'File Upload': [],
      'Hidden Field': [],
      'Form Validation Message': [],
      'Dynamic Element': [],
      'Text Field': [],
      'Other': []
    };
    if (data.xpaths && Array.isArray(data.xpaths)) {
      data.xpaths.forEach(item => {
        if (categories[item.category]) categories[item.category].push(item);
        else categories['Other'].push(item);
      });
    }

    // Render all categories in the UI
    const categoryOrder = Object.keys(categories);
    let htmlSections = '';
    categoryOrder.forEach(cat => {
      if (categories[cat].length) {
        htmlSections += `<h3 style=\"margin-top:2rem;color:var(--subtle-text);font-size:1.1rem;font-weight:600;\">${cat}</h3><ul style=\"margin-bottom:1.5rem;\">`;
        htmlSections += categories[cat].map(e => `
          <li>
            <div style=\"display:flex;flex-direction:column;gap:0.2rem;\">
              <span style=\"color:var(--subtle-text);font-size:0.98rem;\"><strong>${e.name || e.tag || 'Element'}</strong></span>
              <span style=\"color:#888;font-size:0.92rem;\">XPath: <code>${e.xpath}</code></span>
              ${e.id ? `<span style='color:#888;font-size:0.92rem;'>ID: <code>${e.id}</code></span>` : ''}
              ${e.class ? `<span style='color:#888;font-size:0.92rem;'>Class: <code>${e.class}</code></span>` : ''}
              ${e.selectors && e.selectors.length ? `<span style='color:#888;font-size:0.92rem;'>Selectors: <code>${e.selectors.join(' | ')}</code></span>` : ''}
            </div>
          </li>
        `).join('');
        htmlSections += '</ul>';
      }
    });
    document.getElementById("xpathLists").innerHTML = htmlSections;

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
    buttons: document.getElementById('tabButtons'),
    others: document.getElementById('tabOthers')
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
tabs.others.onclick = () => switchTab('others');


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