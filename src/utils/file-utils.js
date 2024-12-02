export function openJavaScriptFile() {
  return new Promise((resolve, reject) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".js";

    fileInput.onchange = (event) => {
      const file = event.target.files[0];

      if (file) {
        const reader = new FileReader();

        reader.onload = (e) => {
          const content = e.target.result;
          resolve({
            filename: file.name,
            content: content,
          });
        };

        reader.onerror = () => {
          reject("Failed to read file"); // Reject the Promise if an error occurs
        };

        reader.readAsText(file);
      } else {
        reject("Please select a valid JavaScript file."); // Reject if the file is not valid
      }
    };

    fileInput.click(); // Programmatically trigger the file dialog
  });
}

/**
 * @param {string} code
 * @param {string} filename
 */
export function downloadJavaScriptFile(code, filename) {
  // Create a Blob from the JavaScript code
  const blob = new Blob([code], { type: "application/javascript" });

  // Create a temporary link element
  const link = document.createElement("a");

  // Set the download attribute with the desired file name
  link.download = filename;

  // Create an object URL for the Blob and set it as the href attribute
  link.href = URL.createObjectURL(blob);

  // Append the link to the body (it won't be visible)
  document.body.appendChild(link);

  // Programmatically trigger a click event on the link to start the download
  link.click();

  // Remove the link from the document
  document.body.removeChild(link);

  // Revoke the object URL to free up memory
  URL.revokeObjectURL(link.href);
}

// Initialize the IndexedDB database
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("FileStorage", 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore("files", { keyPath: "name" });
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

export async function saveFileToIndexedDB(
  fileName,
  fileContent,
  fileType = "application/javascript"
) {
  const db = await openDatabase();
  const transaction = db.transaction("files", "readwrite");
  const store = transaction.objectStore("files");

  const fileEntry = {
    name: fileName,
    type: fileType,
    content: fileContent,
  };

  store.put(fileEntry);

  return transaction.complete;
}

/**
 * Retrieve a list of all files in IndexedDB
 * @returns {Promise<string[]>}
 */
export async function listAllFiles() {
  const db = await openDatabase();
  const transaction = db.transaction("files", "readonly");
  const store = transaction.objectStore("files");
  const request = store.openCursor();

  const fileNames = [];

  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const fileName = cursor.value.name;

        // console.log("Found file:", fileName);

        fileNames.push(fileName);

        cursor.continue();
      } else {
        resolve(fileNames); // Resolve the Promise with the array of file names
      }
    };
    request.onerror = (event) => {
      reject(event.target.error); // Reject the Promise if an error occurs
    };
  });
}

/**
 * Returns the specified file content
 * @param {*} fileName
 * @returns {Promise<string>}
 */
export async function getFileFromIndexedDB(fileName) {
  const db = await openDatabase();
  const transaction = db.transaction("files", "readonly");
  const store = transaction.objectStore("files");
  const request = store.get(fileName);

  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      resolve(event.target.result?.content);
    };
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// Example usage:
// const fileInput = document.querySelector("#fileInput");
// fileInput.addEventListener("change", async (event) => {
//   const file = event.target.files[0];
//   await saveFileToIndexedDB(file);
//   console.log("File saved to IndexedDB");
// });

// async function restoreFile() {
//   const file = await getFileFromIndexedDB("example.txt");
//   console.log("File retrieved:", file);
// }

export async function clearAllFiles() {
  const db = await openDatabase();
  const transaction = db.transaction("files", "readwrite");
  const store = transaction.objectStore("files");
  const request = store.clear(); // Clear all records in the object store

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      console.log("All files cleared successfully.");
      resolve();
    };
    request.onerror = (event) => {
      console.error("Error clearing files:", event.target.error);
      reject(event.target.error);
    };
  });
}

export async function deleteFileFromIndexedDB(fileName) {
  try {
    // Open the database
    const db = await openDatabase();

    // Start a new transaction
    const transaction = db.transaction("files", "readwrite");
    const store = transaction.objectStore("files");

    // Delete the file by its name (key)
    const request = store.delete(fileName);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        // console.log(`File "${fileName}" deleted successfully.`);
        resolve();
      };
      request.onerror = (event) => {
        // console.error(`Error deleting file "${fileName}":`, event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    // console.error("Failed to delete the file:", error);
    throw error;
  }
}

// Example usage
// deleteFileFromIndexedDB('example.txt')
//   .then(() => console.log('File deleted'))
//   .catch((error) => console.error('Failed to delete file:', error));

export function getObfuscatedFileName(originalFileName) {
  if (typeof originalFileName !== "string") return "Obfuscated.js";

  const outputFileName = originalFileName;

  // file.obfuscated.js -> file.obfuscated.2.js
  // file.obfuscated.2.js -> file.obfuscated.3.js
  if (
    outputFileName.includes(".obfuscated.") &&
    outputFileName.endsWith(".js")
  ) {
    var num =
      parseInt(outputFileName.split(".obfuscated.")[1].split(".js")[0]) + 1;
    if (Number.isNaN(num) || num < 1) {
      num = 2;
    }

    return (
      outputFileName.split(".obfuscated")[0] + ".obfuscated." + num + ".js"
    );
  } else if (outputFileName.endsWith(".js")) {
    // Replace .js with .obfuscated.js
    return outputFileName.replace(".js", ".obfuscated.js");
  }

  // No file extension -> file.obfuscated.js
  return outputFileName + ".obfuscated.js";
}

export function getFileExtension(fileName) {
  const fileExtension = fileName.split(".").pop();
  return fileExtension;
}

export function getLanguageFromFileExtension(fileExtension) {
  return (
    {
      js: "javascript",
      ts: "typescript",
      json: "json",
    }[fileExtension] || "plaintext"
  );
}

export function openNewTabWithText(content) {
  if (typeof content === "object" && content) {
    // Content is JSON
    content = JSON.stringify(content, null, 4);
  }

  // Open a new tab with about:blank
  let newTab = window.open("about:blank", "_blank");

  // Write content into the new tab's document
  newTab.document.write(`
      <html>
          <head><title>New Tab</title></head>
          <body>
              <pre>${content}</pre>
          </body>
      </html>
  `);

  // Close the document to finalize writing
  newTab.document.close();
}
