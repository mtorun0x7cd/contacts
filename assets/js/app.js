"use strict";
/*
 * File:      assets/js/app.js
 * Purpose:   Provides interactive functionality for the Contacts application.
 * Author:    MTORUN0X7CD
 * Version:   3.0
 * Last Modified: 2025-07-26
*/
document.addEventListener("DOMContentLoaded", () => {
    /**
     * Creates a debounced function that delays invoking func until after
     * wait milliseconds have elapsed since the last time it was invoked.
     * @param {Function} func The function to debounce.
     * @param {number} wait The number of milliseconds to delay.
     * @returns {Function} Returns the new debounced function.
     */
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // --- DOM Elements ---
    const dom = {
        html: document.documentElement,
        themeToggle: document.getElementById("themeToggle"),
        searchInput: document.getElementById("searchInput"),
        clearSearchBtn: document.getElementById("clearSearch"),
        contactTableBody: document.getElementById("contactTableBody"),
        statusText: document.getElementById("statusText"),
        headers: document.querySelectorAll("thead th"),
    };

    // --- State ---
    const state = {
        allContacts: [],
        filteredContacts: [],
        sortColumn: 'alias',
        sortDirection: 1,
        error: null,
    };

    // --- Core Functions ---

    /**
     * Renders the table rows based on the current state. Securely creates
     * DOM elements instead of using innerHTML for data.
     */
    const renderTable = () => {
        dom.contactTableBody.innerHTML = ''; // Clear existing rows

        if (state.error) {
            const row = dom.contactTableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = dom.headers.length;
            cell.className = 'feedback-cell';
            cell.textContent = state.error;
            return;
        }

        if (state.filteredContacts.length === 0) {
            const row = dom.contactTableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = dom.headers.length;
            cell.className = 'feedback-cell';
            cell.textContent = 'Keine Kontakte gefunden.';
            return;
        }

        const fragment = document.createDocumentFragment();
        state.filteredContacts.forEach(contact => {
            const row = document.createElement('tr');

            const aliasCell = document.createElement('td');
            const aliasText = contact.alias || 'N/A';
            if (aliasText.toLowerCase() !== 'n/a') {
                aliasCell.innerHTML = `
                    <span class="copy-alias" data-alias="${aliasText}" title="Alias kopieren: ${aliasText}">
                        <span class="alias-text">${aliasText}</span>
                        <span class="copy-icon">📋</span>
                        <span class="copied-text">Kopiert!</span>
                    </span>`;
            } else {
                aliasCell.textContent = aliasText;
            }
            row.appendChild(aliasCell);

            const nameCell = document.createElement('td');
            nameCell.textContent = contact.name || '';
            row.appendChild(nameCell);

            const phoneCell = document.createElement('td');
            const phoneText = contact.phone || 'N/A';
            if (phoneText.toLowerCase() !== 'n/a') {
                const link = document.createElement('a');
                link.href = `tel:${phoneText}`;
                link.title = `Anrufen: ${phoneText}`;
                link.textContent = phoneText;
                phoneCell.appendChild(link);
            } else {
                phoneCell.textContent = phoneText;
            }
            row.appendChild(phoneCell);

            fragment.appendChild(row);
        });
        dom.contactTableBody.appendChild(fragment);
    };

    /**
     * Updates the status text with the current row count.
     */
    const updateStatusText = () => {
        if (state.error) {
            dom.statusText.textContent = 'Fehler beim Laden der Daten.';
            return;
        }
        const query = dom.searchInput.value.trim();
        dom.statusText.textContent = query ?
            `Zeige ${state.filteredContacts.length} von ${state.allContacts.length} Kontakten.` :
            `Kontakte insgesamt: ${state.allContacts.length}.`;
    };

    /**
     * Filters and sorts the master contact list, then triggers a re-render.
     */
    const processAndRender = () => {
        const query = dom.searchInput.value.toLowerCase().trim();

        state.filteredContacts = state.allContacts.filter(c =>
            (c.alias || '').toLowerCase().includes(query) ||
            (c.name || '').toLowerCase().includes(query) ||
            (c.phone || '').toLowerCase().includes(query)
        );

        state.filteredContacts.sort((a, b) => {
            const valA = a[state.sortColumn] || '';
            const valB = b[state.sortColumn] || '';
            const direction = state.sortDirection;

            if (state.sortColumn === 'phone') {
                const numA = parseFloat(String(valA).replace(/\D/g, '')) || 0;
                const numB = parseFloat(String(valB).replace(/\D/g, '')) || 0;
                return (numA - numB) * direction;
            }
            return valA.localeCompare(valB, 'de', { sensitivity: 'base' }) * direction;
        });

        renderTable();
        updateStatusText();
    };

    /**
     * Updates the visual indicators (▲/▼) on table headers.
     */
    const updateSortIndicators = () => {
        dom.headers.forEach(th => {
            const indicator = th.querySelector('.sort-indicator');
            if (th.dataset.column === state.sortColumn) {
                th.setAttribute('aria-sort', state.sortDirection === 1 ? 'ascending' : 'descending');
                indicator.textContent = state.sortDirection === 1 ? '▲' : '▼';
            } else {
                th.setAttribute('aria-sort', 'none');
                indicator.textContent = '';
            }
        });
    };

    // --- Event Handlers ---

    /**
     * Handles clicks on table headers to trigger sorting.
     * @param {HTMLTableCellElement} th The header element that was clicked.
     */
    const onSort = (th) => {
        const column = th.dataset.column;
        if (state.sortColumn === column) {
            state.sortDirection *= -1;
        } else {
            state.sortColumn = column;
            state.sortDirection = 1;
        }
        updateSortIndicators();
        processAndRender();
    };

    const onSearchInput = () => {
        const query = dom.searchInput.value.trim();
        dom.clearSearchBtn.style.display = query ? 'block' : 'none';
        processAndRender();
    };

    const onClearSearch = () => {
        dom.searchInput.value = '';
        onSearchInput();
        dom.searchInput.focus();
    };

    const onThemeToggle = () => {
        const isLight = dom.html.classList.toggle('light-mode');
        dom.themeToggle.setAttribute('aria-pressed', String(isLight));
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    };

    const onAliasCopy = (e) => {
        const copyContainer = e.target.closest('.copy-alias');
        if (!copyContainer) return;

        const aliasText = copyContainer.dataset.alias;
        navigator.clipboard.writeText(aliasText).then(() => {
            const originalIcon = copyContainer.querySelector('.copy-icon');
            const copiedText = copyContainer.querySelector('.copied-text');
            originalIcon.style.display = 'none';
            copiedText.style.display = 'inline';
            setTimeout(() => {
                originalIcon.style.display = 'inline';
                copiedText.style.display = 'none';
            }, 1500);
        }).catch(err => console.error('Copy failed:', err));
    };

    // --- Initialization ---

    /**
     * Fetches contact data from the external JSON file and updates the state.
     */
    const fetchContacts = async () => {
        try {
            const response = await fetch('contacts.json');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            state.allContacts = await response.json();
            if (!Array.isArray(state.allContacts)) {
                throw new Error("JSON data is not an array.");
            }
        } catch (error) {
            console.error("Could not load or parse contacts.json:", error);
            state.error = "Fehler: 'contacts.json' konnte nicht geladen werden oder ist ungültig.";
            state.allContacts = [];
        }
    };

    /**
     * Main initialization function.
     */
    const init = async () => {
        // Set initial theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            dom.html.classList.add('light-mode');
            dom.themeToggle.setAttribute('aria-pressed', 'true');
        }

        // Display loading state
        dom.contactTableBody.innerHTML = `<tr><td colspan="${dom.headers.length}" class="feedback-cell">Lade Kontakte...</td></tr>`;

        // Fetch data and then render the application
        await fetchContacts();
        processAndRender();
        updateSortIndicators();

        // Attach event listeners
        dom.searchInput.addEventListener("input", debounce(onSearchInput, 200));
        dom.clearSearchBtn.addEventListener("click", onClearSearch);
        dom.themeToggle.addEventListener("click", onThemeToggle);
        dom.contactTableBody.addEventListener("click", onAliasCopy);

        dom.headers.forEach(th => {
            th.addEventListener("click", () => onSort(th));
            th.addEventListener("keydown", e => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSort(th);
                }
            });
        });
    };

    init();
});
