
"use strict";

// ========================================
// CampusGate - Visitor Management System
// ========================================

const STORAGE_KEY = "campusgate_visitors_v1";

let visitors = loadVisitors();

// ========================================
// Storage
// ========================================

function loadVisitors() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Could not load visitor records:", error);
        return [];
    }
}

function saveVisitors() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visitors));
}

// ========================================
// Navigation
// ========================================

function showSection(sectionId) {
    document.querySelectorAll(".content-section").forEach(section => {
        section.classList.add("hidden");
    });

    const selectedSection = document.getElementById(sectionId);

    if (selectedSection) {
        selectedSection.classList.remove("hidden");
    }

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("active");
    });

    document.querySelectorAll(".nav-link").forEach(link => {
        if (link.getAttribute("onclick")?.includes(`'${sectionId}'`)) {
            link.classList.add("active");
        }
    });

    if (sectionId === "dashboard") {
        renderDashboard();
    }

    if (sectionId === "records") {
        renderRecords();
    }
}

// Make the function accessible to inline HTML onclick handlers.
window.showSection = showSection;

// ========================================
// Helpers
// ========================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function formatDateTime(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString();
}

function isToday(value) {
    if (!value) return false;

    const date = new Date(value);
    const today = new Date();

    return date.getFullYear() === today.getFullYear()
        && date.getMonth() === today.getMonth()
        && date.getDate() === today.getDate();
}

function getElement(id) {
    return document.getElementById(id);
}

function notify(message) {
    alert(message);
}

// ========================================
// Visitor Registration
// ========================================

function registerVisitor(event) {
    event.preventDefault();

    const name = getElement("visitorName")?.value.trim() || "";
    const phone = getElement("phone")?.value.trim() || "";
    const category = getElement("category")?.value || "";
    const department = getElement("department")?.value || "";
    const host = getElement("host")?.value.trim() || "";
    const purpose = getElement("purpose")?.value.trim() || "";
    const notes = getElement("notes")?.value.trim() || "";

    if (!name || !phone || !category || !host || !purpose) {
        notify("Please fill in all required fields.");
        return;
    }

    if (!/^\d{10}$/.test(phone)) {
        notify("Please enter a valid 10-digit phone number.");
        return;
    }

    const visitor = {
        id: Date.now().toString(),
        name,
        phone,
        category,
        department,
        host,
        purpose,
        notes,
        checkIn: new Date().toISOString(),
        checkOut: null,
        status: "On Campus"
    };

    visitors.unshift(visitor);
    saveVisitors();

    const form = getElement("visitorForm");

    if (form) {
        form.reset();
    }

    renderDashboard();
    renderRecords();

    notify("Visitor registered successfully!");

    showSection("dashboard");
}

// ========================================
// Dashboard
// ========================================

function renderDashboard() {
    const visitsToday = visitors.filter(visitor =>
        isToday(visitor.checkIn)
    ).length;

    const currentlyOnCampus = visitors.filter(visitor =>
        visitor.status === "On Campus"
    ).length;

    const completedVisits = visitors.filter(visitor =>
        visitor.status === "Checked Out"
    ).length;

    if (getElement("visitsToday")) {
        getElement("visitsToday").textContent = visitsToday;
    }

    if (getElement("currentlyOnCampus")) {
        getElement("currentlyOnCampus").textContent = currentlyOnCampus;
    }

    if (getElement("completedVisits")) {
        getElement("completedVisits").textContent = completedVisits;
    }

    const tbody = getElement("recentVisitors");

    if (!tbody) return;

    if (visitors.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">No visitors registered yet.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = visitors.slice(0, 5).map(visitor => `
        <tr>
            <td>${escapeHTML(visitor.name)}</td>
            <td>${escapeHTML(visitor.category)}</td>
            <td>${escapeHTML(visitor.host)}</td>
            <td>${escapeHTML(formatDateTime(visitor.checkIn))}</td>
            <td>
                <span class="status ${visitor.status === "On Campus" ? "active" : "completed"}">
                    ${escapeHTML(visitor.status)}
                </span>
            </td>
        </tr>
    `).join("");
}

// ========================================
// Visitor Records
// ========================================

function renderRecords() {
    const tbody = getElement("visitorTableBody");

    if (!tbody) return;

    const searchTerm = (
        getElement("searchInput")?.value || ""
    ).toLowerCase().trim();

    const statusFilter = getElement("statusFilter")?.value || "All";
    const categoryFilter = getElement("categoryFilter")?.value || "All";

    const filteredVisitors = visitors.filter(visitor => {
        const matchesSearch =
            visitor.name.toLowerCase().includes(searchTerm) ||
            visitor.phone.includes(searchTerm);

        const matchesStatus =
            statusFilter === "All" ||
            visitor.status === statusFilter;

        const matchesCategory =
            categoryFilter === "All" ||
            visitor.category === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
    });

    if (filteredVisitors.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9">No matching visitor records found.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredVisitors.map(visitor => `
        <tr>
            <td>${escapeHTML(visitor.id.slice(-8))}</td>
            <td>${escapeHTML(visitor.name)}</td>
            <td>${escapeHTML(visitor.phone)}</td>
            <td>${escapeHTML(visitor.category)}</td>
            <td>${escapeHTML(visitor.host)}</td>
            <td>${escapeHTML(formatDateTime(visitor.checkIn))}</td>
            <td>${escapeHTML(formatDateTime(visitor.checkOut))}</td>
            <td>
                <span class="status ${visitor.status === "On Campus" ? "active" : "completed"}">
                    ${escapeHTML(visitor.status)}
                </span>
            </td>
            <td>
                ${visitor.status === "On Campus"
                    ? `<button type="button" class="checkout-button" data-checkout-id="${escapeHTML(visitor.id)}">Check Out</button>`
                    : `<span>Completed</span>`
                }
            </td>
        </tr>
    `).join("");
}

// ========================================
// Check Out Visitor
// ========================================

function checkOutVisitor(visitorId) {
    const visitor = visitors.find(item => item.id === visitorId);

    if (!visitor || visitor.status !== "On Campus") {
        return;
    }

    if (!confirm(`Check out ${visitor.name}?`)) {
        return;
    }

    visitor.checkOut = new Date().toISOString();
    visitor.status = "Checked Out";

    saveVisitors();
    renderDashboard();
    renderRecords();
}

// ========================================
// Event Listeners
// ========================================

function initializeApp() {
    const visitorForm = getElement("visitorForm");

    if (visitorForm) {
        visitorForm.addEventListener("submit", registerVisitor);
    }

    const searchInput = getElement("searchInput");

    if (searchInput) {
        searchInput.addEventListener("input", renderRecords);
    }

    const statusFilter = getElement("statusFilter");

    if (statusFilter) {
        statusFilter.addEventListener("change", renderRecords);
    }

    const categoryFilter = getElement("categoryFilter");

    if (categoryFilter) {
        categoryFilter.addEventListener("change", renderRecords);
    }

    const visitorTableBody = getElement("visitorTableBody");

    if (visitorTableBody) {
        visitorTableBody.addEventListener("click", event => {
            const button = event.target.closest("[data-checkout-id]");

            if (button) {
                checkOutVisitor(button.dataset.checkoutId);
            }
        });
    }

    renderDashboard();
    renderRecords();
    showSection("dashboard");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
} else {
    initializeApp();
}
