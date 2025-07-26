# Contacts - A Secure Client-Side Contact List

A secure, client-side web application for searching, sorting, and managing a local contacts list. The application is designed for performance and privacy, loading all data from a local, untracked `contacts.json` file.

## Features

- **Client-Side Only:** No data is ever sent to a server. Everything runs locally in your browser.
- **Data Privacy:** Your contact list is stored in a `contacts.json` file which is explicitly excluded from version control via `.gitignore`.
- **Instant Search:** Performant live search that filters contacts as you type.
- **Clickable Actions:** Telephone numbers are automatically converted to `tel:` links.
- **Copy Alias:** Easily copy a contact's alias to the clipboard.
- **Sortable Columns:** Click any column header to sort the data.
- **Dark/Light Mode:** A theme toggle with automatic preference detection via `localStorage`.

## How to Use

1.  **Clone the Repository (if you haven't already):**
    ```sh
    git clone git@github.com:mtorun0x7cd/contacts.git
    ```

2.  **Populate Your Data:**
    - Create a file named `contacts.json` in the root directory of this project.
    - Add your contact data as a JSON array of objects. Each object must have `alias`, `name`, and `phone` keys.

    **`contacts.json` Example:**
    ```json
    [
      {
        "alias": "Work",
        "name": "John Doe",
        "phone": "+1-555-123-4567"
      },
      {
        "alias": "Home",
        "name": "Jane Smith",
        "phone": "N/A"
      }
    ]
    ```

3.  **Open the Application:**
    - Open the `index.html` file in your preferred web browser. The application will load and display the data from your `contacts.json` file.

## Project Structure

```
contacts/
├── .gitignore          # Prevents `contacts.json` from being committed
├── index.html          # The main HTML structure
├── contacts.json       # Your private contact data (you must create this)
├── assets/
│   ├── css/
│   │   └── style.css   # All application styles
│   └── js/
│       └── app.js      # All application logic
└── README.md           # Project documentation
```
