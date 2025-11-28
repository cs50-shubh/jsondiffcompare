# JSON Diff Compare

A beautiful, locally-hosted web application for comparing two JSON objects and visualizing their differences.

## Features

- **Visual Diff Display**: Color-coded differences showing added, removed, and modified values
- **Statistics**: Quick overview of the number of additions, removals, and modifications
- **Filter Mode**: Option to show only differences or all fields
- **JSON Formatting**: Auto-format JSON for better readability
- **Example Data**: Load example JSON to test the functionality
- **Modern UI**: Beautiful, responsive design that works on desktop and mobile

## Usage

1. **Open the application**: Simply open `index.html` in your web browser
   - Double-click the file, or
   - Right-click and select "Open with" → your preferred browser

2. **Compare JSON**:
   - Paste your first JSON object in the left panel
   - Paste your second JSON object in the right panel
   - Click "Compare JSON" to see the differences

3. **Features**:
   - **Load Example**: Click the "Load Example" buttons to see sample data
   - **Format JSON**: Click "Format JSON" to prettify both JSON inputs
   - **Show Only Differences**: Toggle the switch to filter out unchanged fields
   - **Clear All**: Reset all inputs and results

## Color Coding

- 🟢 **Green**: Added fields (present in JSON 2 but not in JSON 1)
- 🔴 **Red**: Removed fields (present in JSON 1 but not in JSON 2)
- 🟡 **Yellow**: Modified fields (changed values between JSON 1 and JSON 2)
- ⚪ **Gray**: Unchanged fields (same in both JSON objects)

## Files

- `index.html` - Main HTML structure
- `styles.css` - Styling and visual design
- `script.js` - JSON comparison logic and interactivity

## Browser Compatibility

Works in all modern browsers (Chrome, Firefox, Safari, Edge).

## Notes

- The application runs entirely client-side - no server required
- All processing happens in your browser - your data never leaves your computer
- Supports nested objects and arrays
- Handles null, undefined, and various data types


