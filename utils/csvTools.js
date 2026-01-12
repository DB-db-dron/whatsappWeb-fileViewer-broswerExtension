class CsvParser {
    static parse(csvText) {
        if (typeof csvText !== 'string') {
            throw new Error('Invalid input: csvText must be a string.');
        }

        const data = [];
        let maxCols = 0;
        let row = [];
        const regex = /("((?:""|[^"])*)"|([^,\r\n]*))(,|\r\n?|\n|$)/g;
        let match;

        while ((match = regex.exec(csvText)) !== null) {
            if (match[0].length === 0) break;

            const cell = match[2] !== undefined ? match[2].replace(/""/g, '"') : match[3];
            row.push(cell);

            const delimiter = match[4];
            if (delimiter === '\r' || delimiter === '\n' || delimiter === '\r\n') {
                if (row.length > maxCols) maxCols = row.length;
                data.push(row);
                row = [];
            }
        }

        if (row.length > 0) {
            if (row.length > maxCols) maxCols = row.length;
            data.push(row);
        }

        return { data, maxCols };
    }
}

class CsvRenderer {
    static injectStyles(doc) {
        if (!doc || !doc.head) {
            throw new Error('Renderer Error: Invalid document object.');
        }

        const style = doc.createElement('style');
        style.textContent = `
            body { font-family: sans-serif; padding: 20px; }
            table { border-collapse: collapse; width: auto; min-width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; white-space: nowrap; }
            th { background-color: #f2f2f2; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .table-wrapper { overflow-x: auto; }
        `;
        doc.head.appendChild(style);
    }

    static render(doc, data, maxCols) {
        if (!doc || !Array.isArray(data)) {
            throw new Error('Renderer Error: Invalid document or data.');
        }

        const wrapper = doc.createElement('div');
        wrapper.className = 'table-wrapper';
        const table = doc.createElement('table');

        data.forEach((cells, rowIndex) => {
            const tr = doc.createElement('tr');
            // Pad row with empty cells
            while (cells.length < maxCols) cells.push('');

            cells.forEach(cellText => {
                const cell = doc.createElement(rowIndex === 0 ? 'th' : 'td');
                cell.textContent = cellText;
                tr.appendChild(cell);
            });
            table.appendChild(tr);
        });

        wrapper.appendChild(table);
        return wrapper;
    }
}

class CsvTools {
    static view(win, csvText, filename) {
        if (!win || !win.document) {
            console.error('CsvTools Error: Invalid window object.');
            return;
        }

        const doc = win.document;

        try {
            doc.title = filename || 'CSV Viewer';

            CsvRenderer.injectStyles(doc);

            const header = doc.createElement('h2');
            header.textContent = filename || 'Unknown File';
            doc.body.appendChild(header);

            const { data, maxCols } = CsvParser.parse(csvText);
            doc.body.appendChild(CsvRenderer.render(doc, data, maxCols));
        } catch (error) {
            console.error('CsvTools View Error:', error);
            const errorDiv = doc.createElement('div');
            errorDiv.style.cssText = 'color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; margin: 20px; border-radius: 4px; font-family: sans-serif;';
            errorDiv.textContent = `Error loading CSV: ${error.message}`;
            doc.body.appendChild(errorDiv);
        }
    }
}