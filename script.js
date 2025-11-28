// Example JSON data
const exampleJson1 = {
  name: "John Doe",
  age: 30,
  email: "john@example.com",
  address: {
    street: "123 Main St",
    city: "New York",
    zip: "10001",
  },
  hobbies: ["reading", "coding", "gaming"],
  active: true,
};

const exampleJson2 = {
  name: "Jane Doe",
  age: 28,
  email: "jane@example.com",
  address: {
    street: "456 Oak Ave",
    city: "Los Angeles",
    zip: "90001",
  },
  hobbies: ["reading", "traveling", "photography"],
  active: true,
  phone: "555-1234",
};

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  const compareBtn = document.getElementById("compareBtn");
  const clearBtn = document.getElementById("clearBtn");
  const formatBtn = document.getElementById("formatBtn");
  const loadExample1Btn = document.getElementById("loadExample1");
  const loadExample2Btn = document.getElementById("loadExample2");
  const json1Input = document.getElementById("json1");
  const json2Input = document.getElementById("json2");
  const errorMessage = document.getElementById("errorMessage");
  const diffSection = document.getElementById("diffSection");
  const inputSection = document.getElementById("inputSection");
  const diffLeft = document.getElementById("diffLeft");
  const diffRight = document.getElementById("diffRight");

  let scrollSyncSetup = false;

  // Load example data
  loadExample1Btn.addEventListener("click", () => {
    json1Input.value = JSON.stringify(exampleJson1, null, 2);
  });

  loadExample2Btn.addEventListener("click", () => {
    json2Input.value = JSON.stringify(exampleJson2, null, 2);
  });

  // Format JSON
  formatBtn.addEventListener("click", () => {
    try {
      const json1 = JSON.parse(json1Input.value);
      json1Input.value = JSON.stringify(json1, null, 2);
    } catch (e) {
      showError("JSON 1 is invalid. Cannot format.");
      return;
    }

    try {
      const json2 = JSON.parse(json2Input.value);
      json2Input.value = JSON.stringify(json2, null, 2);
    } catch (e) {
      showError("JSON 2 is invalid. Cannot format.");
    }
  });

  // Clear all
  clearBtn.addEventListener("click", () => {
    json1Input.value = "";
    json2Input.value = "";
    diffSection.style.display = "none";
    inputSection.style.display = "grid";
    errorMessage.style.display = "none";
  });

  // Compare JSON
  compareBtn.addEventListener("click", () => {
    compareJson();
  });

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
    diffSection.style.display = "none";
  }

  function hideError() {
    errorMessage.style.display = "none";
  }

  function compareJson() {
    hideError();

    let obj1, obj2;

    try {
      obj1 = JSON.parse(json1Input.value || "{}");
    } catch (e) {
      showError(`JSON 1 is invalid: ${e.message}`);
      return;
    }

    try {
      obj2 = JSON.parse(json2Input.value || "{}");
    } catch (e) {
      showError(`JSON 2 is invalid: ${e.message}`);
      return;
    }

    // Format both JSON objects
    const json1Formatted = JSON.stringify(obj1, null, 2);
    const json2Formatted = JSON.stringify(obj2, null, 2);

    // Hide input section and show diff section
    inputSection.style.display = "none";
    diffSection.style.display = "block";

    displayLineByLineDiff(json1Formatted, json2Formatted, obj1, obj2);
  }

  function displayLineByLineDiff(json1Str, json2Str, obj1, obj2) {
    const lines1 = json1Str.split("\n");
    const lines2 = json2Str.split("\n");

    // Create a map of paths to their line numbers in both JSONs
    const keyLineMap1 = buildKeyLineMap(obj1, lines1);
    const keyLineMap2 = buildKeyLineMap(obj2, lines2);

    // Calculate differences
    const diffMap = calculateDiffMap(obj1, obj2);

    // Determine line statuses
    const lineStatus1 = new Array(lines1.length).fill("unchanged");
    const lineStatus2 = new Array(lines2.length).fill("unchanged");

    // First, mark all removed/added paths and their entire subtrees
    for (const [path, diffType] of Object.entries(diffMap)) {
      if (diffType === "removed") {
        const lineNums = keyLineMap1.get(path) || [];
        lineNums.forEach((lineNum) => {
          markSubtree(lines1, lineStatus1, lineNum, "removed");
        });
      }

      if (diffType === "added") {
        const lineNums = keyLineMap2.get(path) || [];
        lineNums.forEach((lineNum) => {
          markSubtree(lines2, lineStatus2, lineNum, "added");
        });
      }
    }

    // Then, mark modified paths and their nested differences
    for (const [path, diffType] of Object.entries(diffMap)) {
      if (diffType === "modified") {
        // Mark the key line itself
        const lineNums1 = keyLineMap1.get(path) || [];
        lineNums1.forEach((lineNum) => {
          lineStatus1[lineNum] = "modified-left";
        });

        const lineNums2 = keyLineMap2.get(path) || [];
        lineNums2.forEach((lineNum) => {
          lineStatus2[lineNum] = "modified-right";
        });

        // Find all nested paths under this modified path
        const nestedPaths = Object.keys(diffMap).filter(
          (p) =>
            p !== path && (p.startsWith(path + ".") || p.startsWith(path + "["))
        );

        nestedPaths.forEach((nestedPath) => {
          const nestedDiffType = diffMap[nestedPath];

          // Mark nested removed paths in JSON 1
          if (nestedDiffType === "removed") {
            const nestedLineNums = keyLineMap1.get(nestedPath) || [];
            nestedLineNums.forEach((lineNum) => {
              markSubtree(lines1, lineStatus1, lineNum, "removed");
            });
          }

          // Mark nested added paths in JSON 2
          if (nestedDiffType === "added") {
            const nestedLineNums = keyLineMap2.get(nestedPath) || [];
            nestedLineNums.forEach((lineNum) => {
              markSubtree(lines2, lineStatus2, lineNum, "added");
            });
          }

          // Mark nested modified paths
          if (nestedDiffType === "modified") {
            const nestedLineNums1 = keyLineMap1.get(nestedPath) || [];
            nestedLineNums1.forEach((lineNum) => {
              lineStatus1[lineNum] = "modified-left";
            });

            const nestedLineNums2 = keyLineMap2.get(nestedPath) || [];
            nestedLineNums2.forEach((lineNum) => {
              lineStatus2[lineNum] = "modified-right";
            });
          }
        });
      }
    }

    // Mark structural lines (braces, brackets) near changed sections
    markStructuralLines(lines1, lineStatus1);
    markStructuralLines(lines2, lineStatus2);

    // Reset scroll positions
    diffLeft.scrollTop = 0;
    diffLeft.scrollLeft = 0;
    diffRight.scrollTop = 0;
    diffRight.scrollLeft = 0;

    // Render both sides
    renderDiffLines(diffLeft, lines1, lineStatus1);
    renderDiffLines(diffRight, lines2, lineStatus2);

    // Synchronize scrolling (only setup once)
    if (!scrollSyncSetup) {
      syncScroll(diffLeft, diffRight);
      scrollSyncSetup = true;
    }

    // Update stats
    const stats = {
      added: Object.values(diffMap).filter((t) => t === "added").length,
      removed: Object.values(diffMap).filter((t) => t === "removed").length,
      modified: Object.values(diffMap).filter((t) => t === "modified").length,
    };
    updateStats(stats);
  }

  function buildKeyLineMap(obj, lines) {
    const pathToLineMap = new Map();
    const jsonStr = lines.join("\n");

    // Recursively traverse the object to build paths, then find line numbers
    function traverse(o, path = "", searchStart = 0) {
      if (o === null || o === undefined) return searchStart;

      if (Array.isArray(o)) {
        o.forEach((item, idx) => {
          const currentPath = path ? `${path}[${idx}]` : `[${idx}]`;
          searchStart = traverse(item, currentPath, searchStart);
        });
      } else if (typeof o === "object") {
        Object.keys(o).forEach((key) => {
          const currentPath = path ? `${path}.${key}` : key;
          const value = o[key];

          // Find the line number for this key by searching in the JSON string
          const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const keyPattern = `"${escapedKey}"\\s*:`;
          const regex = new RegExp(keyPattern, "g");

          // Search from the last position
          regex.lastIndex = searchStart;
          const match = regex.exec(jsonStr);

          if (match) {
            // Calculate line number
            const beforeMatch = jsonStr.substring(0, match.index);
            const lineNum = (beforeMatch.match(/\n/g) || []).length;

            if (!pathToLineMap.has(currentPath)) {
              pathToLineMap.set(currentPath, []);
            }
            if (!pathToLineMap.get(currentPath).includes(lineNum)) {
              pathToLineMap.get(currentPath).push(lineNum);
            }

            // Update search start to after this match
            searchStart = match.index + match[0].length;
          }

          // Recursively traverse nested objects/arrays
          if (typeof value === "object" && value !== null) {
            searchStart = traverse(value, currentPath, searchStart);
          }
        });
      }

      return searchStart;
    }

    traverse(obj);
    return pathToLineMap;
  }

  function markSubtree(lines, lineStatuses, startLine, status) {
    if (startLine >= lines.length) return;

    const startLineContent = lines[startLine].trim();
    let braceCount = 0;
    let bracketCount = 0;
    let inSubtree = false;

    // Check if the starting line opens an object/array
    const keyValueMatch = startLineContent.match(/^"([^"]+)":\s*(.+)$/);
    if (keyValueMatch) {
      const valuePart = keyValueMatch[2].trim();
      if (valuePart === "{" || valuePart === "[") {
        inSubtree = true;
        if (valuePart === "{") braceCount = 1;
        if (valuePart === "[") bracketCount = 1;
      }
    } else if (startLineContent === "{" || startLineContent === "[") {
      inSubtree = true;
      if (startLineContent === "{") braceCount = 1;
      if (startLineContent === "[") bracketCount = 1;
    }

    // Mark the starting line
    lineStatuses[startLine] = status;

    // If we're in a subtree, mark all lines until we close it
    if (inSubtree) {
      for (let i = startLine + 1; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (!trimmed) {
          lineStatuses[i] = status;
          continue;
        }

        // Count standalone braces/brackets
        if (trimmed === "{") braceCount++;
        else if (trimmed === "}") braceCount--;
        else if (trimmed === "[") bracketCount++;
        else if (trimmed === "]") bracketCount--;
        else {
          // Check for braces/brackets in key-value pairs
          const kvMatch = trimmed.match(/^"[^"]+":\s*(.+)$/);
          if (kvMatch) {
            const val = kvMatch[1].trim();
            if (val === "{") braceCount++;
            else if (val === "[") bracketCount++;
            // Count closing braces/brackets at end of line
            if (val.endsWith("}")) braceCount--;
            if (val.endsWith("]")) bracketCount--;
          }
          // Count closing braces/brackets at start of value
          if (trimmed.startsWith("}")) braceCount--;
          if (trimmed.startsWith("]")) bracketCount--;
        }

        // Mark this line
        lineStatuses[i] = status;

        // Stop when we've closed all braces/brackets
        if (braceCount === 0 && bracketCount === 0) {
          break;
        }
      }
    }
  }

  function markNestedDifferences(
    path,
    diffMap,
    keyLineMap,
    lineStatuses,
    status,
    lines
  ) {
    // Find all nested paths that are different
    const nestedPaths = Object.keys(diffMap).filter(
      (p) =>
        p !== path && (p.startsWith(path + ".") || p.startsWith(path + "["))
    );

    nestedPaths.forEach((nestedPath) => {
      const nestedDiffType = diffMap[nestedPath];
      const lineNums = keyLineMap.get(nestedPath) || [];
      lineNums.forEach((lineNum) => {
        if (nestedDiffType === "removed" || nestedDiffType === "added") {
          markSubtree(
            lines,
            lineStatuses,
            lineNum,
            nestedDiffType === "removed" ? "removed" : "added"
          );
        } else if (nestedDiffType === "modified") {
          lineStatuses[lineNum] = status;
        }
      });
    });
  }

  function markStructuralLines(lines, lineStatuses) {
    // Mark structural lines near changed sections for better visual context
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (
        (trimmed === "{" ||
          trimmed === "}" ||
          trimmed === "[" ||
          trimmed === "]" ||
          trimmed === ",") &&
        lineStatuses[idx] === "unchanged"
      ) {
        // Check if nearby lines are changed
        let nearbyChanged = false;
        let nearbyType = null;
        for (
          let i = Math.max(0, idx - 3);
          i <= Math.min(lines.length - 1, idx + 3);
          i++
        ) {
          if (lineStatuses[i] !== "unchanged") {
            nearbyChanged = true;
            nearbyType = lineStatuses[i];
            break;
          }
        }
        if (nearbyChanged) {
          // Keep structural lines unchanged for better readability
          // They'll be highlighted by proximity to changed lines
        }
      }
    });
  }

  function calculateDiffMap(obj1, obj2, path = "") {
    const diffMap = {};

    if (obj1 === undefined && obj2 === undefined) return diffMap;
    if (obj1 === undefined) {
      diffMap[path || "root"] = "added";
      return diffMap;
    }
    if (obj2 === undefined) {
      diffMap[path || "root"] = "removed";
      return diffMap;
    }

    // Handle arrays
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      const maxLen = Math.max(obj1.length, obj2.length);
      for (let i = 0; i < maxLen; i++) {
        const currentPath = path ? `${path}[${i}]` : `[${i}]`;
        if (i >= obj1.length) {
          diffMap[currentPath] = "added";
        } else if (i >= obj2.length) {
          diffMap[currentPath] = "removed";
        } else {
          Object.assign(
            diffMap,
            calculateDiffMap(obj1[i], obj2[i], currentPath)
          );
        }
      }
      return diffMap;
    }

    // Handle objects
    if (isObject(obj1) && isObject(obj2)) {
      const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
      for (const key of allKeys) {
        const currentPath = path ? `${path}.${key}` : key;
        if (!(key in obj2)) {
          diffMap[currentPath] = "removed";
        } else if (!(key in obj1)) {
          diffMap[currentPath] = "added";
        } else {
          Object.assign(
            diffMap,
            calculateDiffMap(obj1[key], obj2[key], currentPath)
          );
        }
      }
      return diffMap;
    }

    // Primitive values
    if (!deepEqual(obj1, obj2)) {
      diffMap[path || "root"] = "modified";
    }

    return diffMap;
  }

  function renderDiffLines(container, lines, lineStatuses) {
    let html = "";
    lines.forEach((line, idx) => {
      const status = lineStatuses[idx] || "unchanged";
      const escapedLine = escapeHtml(line || " ");
      html += `<div class="diff-line ${status}">`;
      html += `<span class="diff-line-number">${idx + 1}</span>`;
      html += `<span class="diff-line-content">${escapedLine}</span>`;
      html += `</div>`;
    });
    container.innerHTML = html;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function syncScroll(left, right) {
    let isScrolling = false;

    left.addEventListener("scroll", () => {
      if (!isScrolling) {
        isScrolling = true;
        right.scrollTop = left.scrollTop;
        right.scrollLeft = left.scrollLeft;
        setTimeout(() => {
          isScrolling = false;
        }, 10);
      }
    });

    right.addEventListener("scroll", () => {
      if (!isScrolling) {
        isScrolling = true;
        left.scrollTop = right.scrollTop;
        left.scrollLeft = right.scrollLeft;
        setTimeout(() => {
          isScrolling = false;
        }, 10);
      }
    });
  }

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function deepEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, idx) => deepEqual(val, b[idx]));
    }

    if (typeof a === "object") {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every((key) => deepEqual(a[key], b[key]));
    }

    return false;
  }

  function updateStats(stats) {
    document.getElementById("addedCount").textContent = `+${stats.added}`;
    document.getElementById("removedCount").textContent = `-${stats.removed}`;
    document.getElementById("modifiedCount").textContent = `~${stats.modified}`;
  }
});
