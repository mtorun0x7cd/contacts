"use strict";
/*
 * File:      assets/js/app.js
 * Purpose:   Provides interactive functionality for the Contacts application.
 * Author:    MTORUN0X7CD
 * Version:   4.0
 * Last Modified: 2025-07-27
*/

/**
 * Encapsulates the entire contacts application to prevent global scope pollution
 * and organize logic into a self-contained module.
 */
const ContactApp = {
    // --- Application State ---
    state: {
        allContacts: [],
        filteredContacts: [],
        sortColumn: 'alias',
        sortDirection: 1, // 1 for ascending, -1 for descending
        error: null,
    },

    // --- Cached DOM Elements ---
    dom: {},

    /**
     * Initializes the application: caches DOM elements, sets up the theme,
     * binds event listeners, and fetches initial data.
     */
    init() {
        this.cacheDom();
        this.setupTheme();
        this.bindEvents();
        this.fetchAndRender();
    },

    /**
     * Caches frequently accessed DOM elements for performance.
     */
    cacheDom() {
        this.dom = {
            html: document.documentElement,
            themeToggle: document.getElementById("themeToggle"),
            searchInput: document.getElementById("searchInput"),
            clearSearchBtn: document.getElementById("clearSearch"),
            contactTableBody: document.getElementById("contactTableBody"),
            statusText: document.getElementById("statusText"),
            headers: document.querySelectorAll("thead th"),
        };
    },

    /**
     * Binds all event listeners for the application.
     */
    bindEvents() {
        this.dom.searchInput.addEventListener("input", this.debounce(this.onSearchInput.bind(this), 200));
        this.dom.clearSearchBtn.addEventListener("click", this.onClearSearch.bind(this));
        this.dom.themeToggle.addEventListener("click", this.onThemeToggle.bind(this));
        this.dom.contactTableBody.addEventListener("click", this.onAliasCopy.bind(this));

        this.dom.headers.forEach(th => {
            th.addEventListener("click", () => this.onSort(th));
            th.addEventListener("keydown", e => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    this.onSort(th);
                }
            });
        });
    },

    /**
     * Fetches contact data and triggers the initial render.
     */
    async fetchAndRender() {
        this.renderFeedback("Lade Kontakte...");
        try {
            const response = await fetch('contacts.json');
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const data = await response.json();
            if (!Array.isArray(data)) throw new Error("JSON data is not an array.");

            this.state.allContacts = data;
        } catch (error) {
            console.error("Could not load or parse contacts.json:", error);
            this.state.error = "Fehler: 'contacts.json' konnte nicht geladen werden oder ist ungültig.";
        }
        this.processAndRender();
        this.updateSortIndicators();
    },

    /**
     * Filters and sorts contacts, then triggers a re-render.
     */
    processAndRender() {
        const query = this.dom.searchInput.value.toLowerCase().trim();

        this.state.filteredContacts = this.state.allContacts.filter(c =>
            (c.alias || '').toLowerCase().includes(query) ||
            (c.name || '').toLowerCase().includes(query) ||
            (c.phone || '').toLowerCase().includes(query)
        );

        this.state.filteredContacts.sort((a, b) => {
            const valA = a[this.state.sortColumn] || '';
            const valB = b[this.state.sortColumn] || '';
            const direction = this.state.sortDirection;

            if (this.state.sortColumn === 'phone') {
                const numA = parseFloat(String(valA).replace(/\D/g, '')) || 0;
                const numB = parseFloat(String(valB).replace(/\D/g, '')) || 0;
                return (numA - numB) * direction;
            }
            return valA.localeCompare(valB, 'de', { sensitivity: 'base' }) * direction;
        });

        this.renderTable();
        this.updateStatusText();
    },

    /**
     * Renders the entire table body based on the current state.
     */
    renderTable() {
        this.dom.contactTableBody.innerHTML = ''; // Clear existing rows

        if (this.state.error) {
            this.renderFeedback(this.state.error);
            return;
        }
        if (this.state.filteredContacts.length === 0) {
            this.renderFeedback('Keine Kontakte gefunden.');
            return;
        }

        const fragment = document.createDocumentFragment();
        this.state.filteredContacts.forEach(contact => {
            fragment.appendChild(this.createRow(contact));
        });
        this.dom.contactTableBody.appendChild(fragment);
    },

    /**
     * Creates a single table row (<tr>) for a contact.
     * @param {object} contact - The contact object.
     * @returns {HTMLTableRowElement} The created table row element.
     */
    createRow(contact) {
        const row = document.createElement('tr');
        row.appendChild(this.createAliasCell(contact.alias));
        row.appendChild(this.createCell(contact.name));
        row.appendChild(this.createPhoneCell(contact.phone));
        return row;
    },

    /**
     * Creates a standard table cell (<td>).
     * @param {string} text - The text content for the cell.
     * @returns {HTMLTableCellElement}
     */
    createCell(text) {
        const cell = document.createElement('td');
        cell.textContent = text || '';
        return cell;
    },

    /**
     * SECURELY creates the alias cell with copy functionality.
     * This avoids the use of innerHTML to prevent XSS.
     * @param {string} aliasText - The alias text.
     * @returns {HTMLTableCellElement}
     */
    createAliasCell(aliasText = 'N/A') {
        const cell = document.createElement('td');
        if (aliasText.toLowerCase() === 'n/a') {
            cell.textContent = aliasText;
            return cell;
        }

        const container = document.createElement('span');
        container.className = 'copy-alias';
        container.dataset.alias = aliasText;
        container.title = `Alias kopieren: ${aliasText}`;

        const textSpan = document.createElement('span');
        textSpan.className = 'alias-text';
        textSpan.textContent = aliasText;

        const iconSpan = document.createElement('span');
        iconSpan.className = 'copy-icon';
        iconSpan.textContent = '📋';

        const copiedSpan = document.createElement('span');
        copiedSpan.className = 'copied-text';
        copiedSpan.textContent = 'Kopiert!';

        container.append(textSpan, iconSpan, copiedSpan);
        cell.appendChild(container);
        return cell;
    },

    /**
     * Creates the phone cell with a clickable tel: link.
     * @param {string} phoneText - The phone number.
     * @returns {HTMLTableCellElement}
     */
    createPhoneCell(phoneText = 'N/A') {
        const cell = document.createElement('td');
        if (phoneText.toLowerCase() === 'n/a') {
            cell.textContent = phoneText;
            return cell;
        }
        const link = document.createElement('a');
        link.href = `tel:${phoneText.replace(/\s/g, '')}`;
        link.title = `Anrufen: ${phoneText}`;
        link.textContent = phoneText;
        cell.appendChild(link);
        return cell;
    },

    /**
     * Renders a feedback message (e.g., loading, error, no results) in the table.
     * @param {string} message - The message to display.
     */
    renderFeedback(message) {
        const row = this.dom.contactTableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = this.dom.headers.length;
        cell.className = 'feedback-cell';
        cell.textContent = message;
    },

    // --- Event Handlers & UI Updaters ---

    onSort(th) {
        const column = th.dataset.column;
        if (this.state.sortColumn === column) {
            this.state.sortDirection *= -1;
        } else {
            this.state.sortColumn = column;
            this.state.sortDirection = 1;
        }
        this.updateSortIndicators();
        this.processAndRender();
    },

    onSearchInput() {
        const query = this.dom.searchInput.value.trim();
        this.dom.clearSearchBtn.style.display = query ? 'block' : 'none';
        this.processAndRender();
    },

    onClearSearch() {
        this.dom.searchInput.value = '';
        this.onSearchInput();
        this.dom.searchInput.focus();
    },

    onThemeToggle() {
        const isLight = this.dom.html.classList.toggle('light-mode');
        this.dom.themeToggle.setAttribute('aria-pressed', String(isLight));
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    },

    onAliasCopy(e) {
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
    },

    updateStatusText() {
        if (this.state.error) {
            this.dom.statusText.textContent = 'Fehler beim Laden der Daten.';
            return;
        }
        const query = this.dom.searchInput.value.trim();
        this.dom.statusText.textContent = query ?
            `Zeige ${this.state.filteredContacts.length} von ${this.state.allContacts.length} Kontakten.` :
            `Kontakte insgesamt: ${this.state.allContacts.length}.`;
    },

    updateSortIndicators() {
        this.dom.headers.forEach(th => {
            const indicator = th.querySelector('.sort-indicator');
            if (th.dataset.column === this.state.sortColumn) {
                th.setAttribute('aria-sort', this.state.sortDirection === 1 ? 'ascending' : 'descending');
                indicator.textContent = this.state.sortDirection === 1 ? '▲' : '▼';
            } else {
                th.setAttribute('aria-sort', 'none');
                indicator.textContent = '';
            }
        });
    },

    setupTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light' || (savedTheme === null && window.matchMedia('(prefers-color-scheme: light)').matches)) {
            this.dom.html.classList.add('light-mode');
            this.dom.themeToggle.setAttribute('aria-pressed', 'true');
        }
    },

    // --- Utilities ---
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
};

document.addEventListener("DOMContentLoaded", () => ContactApp.init());
