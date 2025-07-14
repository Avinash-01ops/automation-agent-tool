
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
    el.style.color = "#d32f2f";
    el.style.fontSize = "0.98rem";
    el.style.marginTop = "0.3rem";
    el.style.fontWeight = "500";
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
 * Show or hide a loading spinner above the XPaths section.
 * @param {boolean} isLoading - Whether to show or hide the spinner
 */
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
    document.getElementById("xpathSection").parentElement.insertBefore(spinner, document.getElementById("xpathSection"));
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

// ===================== Main Event Handlers =====================

/**
 * Handle the Get XPaths button click: fetches XPaths from backend, shows loading, errors, and results.
 */
document.getElementById("getXpathsBtn").addEventListener("click", async () => {
  const url = document.getElementById("urlInput").value.trim();
  const logBox = document.getElementById("logContent");
  clearError("urlInput");
  logBox.textContent = "";

  // Validate URL
  if (!url) {
    showError("urlInput", "Please enter a valid URL.");
    return;
  }

  setLoading(true);
  // Hide and clear all sections before fetching
  document.getElementById("xpathSection").style.display = "none";
  document.getElementById("textFields").innerHTML = "";
  document.getElementById("inputFields").innerHTML = "";
  document.getElementById("buttons").innerHTML = "";
  document.getElementById("textFields").style.display = "none";
  document.getElementById("inputFields").style.display = "none";
  document.getElementById("buttons").style.display = "none";

  try {
    // Fetch XPaths from backend
    const response = await fetch("http://localhost:5000/api/scrape-xpaths", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    const data = await response.json();
    setLoading(false);

    if (data.error) {
      showError("urlInput", data.error);
      logBox.textContent = "❌ Error: " + data.error + "\n";
      document.getElementById("textFields").innerHTML = `<li>Error: ${data.error}</li>`;
      return;
    }

    logBox.textContent = `✅ Scraping complete. Found ${data.xpaths.length} elements.\n`;
    logBox.textContent += data.logs ? `📄 Page Preview:\n${data.logs}\n` : '';



    // Group by AI category
    const categories = {};
    data.xpaths.forEach((item, index) => {
      const cat = item.category || 'Uncategorized';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push({
        name: `Element ${index + 1}`,
        xpath: item.xpath,
        html: item.html,
        category: cat
      });
    });

    // Show section if any xpaths found
    const hasAny = Object.values(categories).some(arr => arr.length);
    if (hasAny) {
      document.getElementById("xpathSection").style.display = "block";
    }

    // Render lists for each category (first 3 categories get tabs, rest as extra sections)
    const catNames = Object.keys(categories);
    const renderList = arr => arr.length
      ? arr.map(e => `<li style='margin-bottom: 0.5em;'><span style='background:#f1f1f1; border-radius:4px; padding:0.2em 0.5em; font-weight:bold;'>${e.name} <span style='color:#888;font-size:0.95em;'>[${e.category}]</span></span><br><code style='color:#1976d2;'>${e.xpath ? e.xpath : ''}</code></li>`).join("")
      : "<li style='color:gray;'>No items found</li>";

    // For backward compatibility, map first 3 categories to tabs
    const tabIds = ["textFields", "inputFields", "buttons"];
    for (let i = 0; i < tabIds.length; i++) {
      const arr = categories[catNames[i]] || [];
      document.getElementById(tabIds[i]).innerHTML = renderList(arr);
    }

    // Hide all tabs, show first tab by default
    tabIds.forEach((id, idx) => {
      document.getElementById(id).style.display = idx === 0 ? "block" : "none";
    });

    // Tab switching logic
    document.getElementById("tabTextFields").onclick = () => {
      document.getElementById("textFields").style.display = "block";
      document.getElementById("inputFields").style.display = "none";
      document.getElementById("buttons").style.display = "none";
    };
    document.getElementById("tabInputFields").onclick = () => {
      document.getElementById("textFields").style.display = "none";
      document.getElementById("inputFields").style.display = "block";
      document.getElementById("buttons").style.display = "none";
    };
    document.getElementById("tabButtons").onclick = () => {
      document.getElementById("textFields").style.display = "none";
      document.getElementById("inputFields").style.display = "none";
      document.getElementById("buttons").style.display = "block";
    };

    // Dynamically render extra categories (beyond the first 3 tabs)
    // Remove any previous extra sections
    const extraSectionClass = 'extra-category-section';
    document.querySelectorAll('.' + extraSectionClass).forEach(el => el.remove());

    for (let i = 3; i < catNames.length; i++) {
      const cat = catNames[i];
      const arr = categories[cat];
      // Create a new section below the tabs
      const section = document.createElement('div');
      section.className = extraSectionClass;
      section.style.marginTop = '1.5em';
      section.innerHTML = `<h4 style='margin-bottom:0.5em;color:#1976d2;'>${cat}</h4><ul style='margin:0 0 0 1.2em;padding:0;'>${renderList(arr)}</ul>`;
      document.getElementById('xpathSection').appendChild(section);
    }

  } catch (err) {
    setLoading(false);
    showError("urlInput", "Request failed. Please check your connection or backend.");
    logBox.textContent = "❌ Request failed: " + err.message;
    document.getElementById("textFields").innerHTML = `<li>Error fetching XPaths. Is the backend running?</li>`;
  }
});

/**
 * Handle Save Credentials button: validates and (mock) saves credentials, shows errors if needed.
 */
document.getElementById("saveCredsBtn").addEventListener("click", () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  clearError("username");
  clearError("password");

  // Require at least one field
  if (!username && !password) {
    showError("username", "Enter username or password to save.");
    return;
  }

  // Simulate save (replace with real logic if needed)
  alert("Credentials saved securely (mock)");
});
