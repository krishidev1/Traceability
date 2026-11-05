import { zipSync } from "fflate";

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function columnName(index) {
  let name = "";
  let number = index + 1;
  while (number > 0) {
    const remainder = (number - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    number = Math.floor((number - 1) / 26);
  }
  return name;
}

function createWorksheetXml(headers, records) {
  const rows = [headers, ...records.map((record) => headers.map((header) => record[header] ?? ""))];
  const lastCell = `${columnName(Math.max(headers.length, 1) - 1)}${Math.max(rows.length, 1)}`;
  const sheetRows = rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => {
      const address = `${columnName(columnIndex)}${rowIndex + 1}`;
      if (typeof value === "number" && Number.isFinite(value)) {
        return `<c r="${address}"><v>${value}</v></c>`;
      }
      return `<c r="${address}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
    }).join("");
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join("");
  const columnWidths = headers.map((header, index) => {
    const width = Math.min(42, Math.max(12, String(header).length + 3));
    return `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<dimension ref="A1:${lastCell}"/>
<sheetViews><sheetView workbookViewId="0"/></sheetViews>
<cols>${columnWidths}</cols>
<sheetData>${sheetRows}</sheetData>
<autoFilter ref="A1:${lastCell}"/>
</worksheet>`;
}

function createWorkbookFiles(sheets) {
  const sheetOverrides = sheets.map((_, index) =>
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  ).join("");
  const sheetElements = sheets.map(({ name }, index) =>
    `<sheet name="${escapeXml(name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
  ).join("");
  const sheetRelationships = sheets.map((_, index) =>
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
  ).join("");
  const files = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${sheetOverrides}
</Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${sheetElements}</sheets>
</workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${sheetRelationships}
</Relationships>`,
  };
  sheets.forEach(({ headers, records }, index) => {
    files[`xl/worksheets/sheet${index + 1}.xml`] = createWorksheetXml(headers, records);
  });
  return files;
}

export function createReportWorkbook(sheets) {
  const workbookFiles = Object.fromEntries(
    Object.entries(createWorkbookFiles(sheets)).map(([path, contents]) => [
      path,
      new TextEncoder().encode(contents),
    ]),
  );
  const workbookBlob = new Blob([zipSync(workbookFiles)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  return workbookBlob;
}

export function downloadReportWorkbook(sheets, filename) {
  const workbookBlob = createReportWorkbook(sheets);
  const workbookUrl = URL.createObjectURL(workbookBlob);
  const link = document.createElement("a");
  link.href = workbookUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(workbookUrl), 1000);
}
