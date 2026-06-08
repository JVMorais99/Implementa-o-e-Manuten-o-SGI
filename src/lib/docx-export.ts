import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";

// Converte o HTML gerado/editado dos documentos em um .docx.
// O HTML usa um conjunto controlado de tags (h1-h3, p, ul/li, table/tr/th/td,
// strong), sem aninhamento da mesma tag, o que permite um parser simples.

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

// Converte um trecho inline (pode conter <strong>) em TextRun[].
function inlineRuns(html: string, opts?: { bold?: boolean }): TextRun[] {
  const runs: TextRun[] = [];
  const regex = /<strong>([\s\S]*?)<\/strong>|([^<]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    if (match[1] !== undefined) {
      const text = decodeEntities(match[1].replace(/<[^>]+>/g, "")).trim();
      if (text) runs.push(new TextRun({ text, bold: true }));
    } else if (match[2] !== undefined) {
      const text = decodeEntities(match[2]);
      if (text.trim()) runs.push(new TextRun({ text, bold: opts?.bold }));
    }
  }
  if (runs.length === 0) runs.push(new TextRun({ text: "", bold: opts?.bold }));
  return runs;
}

function plainText(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, "")).trim();
}

function buildTable(tableHtml: string): Table {
  const rowMatches = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const rows: TableRow[] = rowMatches.map((rowMatch) => {
    const cellMatches = [
      ...rowMatch[1].matchAll(/<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi),
    ];
    const cells = cellMatches.map((cellMatch) => {
      const isHeader = cellMatch[1].toLowerCase() === "th";
      return new TableCell({
        width: { size: 100 / (cellMatches.length || 1), type: WidthType.PERCENTAGE },
        shading: isHeader ? { fill: "EEF2FF" } : undefined,
        children: [
          new Paragraph({
            children: inlineRuns(cellMatch[2], { bold: isHeader }),
          }),
        ],
      });
    });
    return new TableRow({ children: cells });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
    },
    rows,
  });
}

function htmlToBlocks(html: string): (Paragraph | Table)[] {
  const blocks: (Paragraph | Table)[] = [];
  const blockRegex = /<(h1|h2|h3|p|ul|table)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const inner = match[2];

    switch (tag) {
      case "h1":
        blocks.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 120 },
            children: inlineRuns(inner),
          })
        );
        break;
      case "h2":
        blocks.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 180, after: 100 },
            children: inlineRuns(inner),
          })
        );
        break;
      case "h3":
        blocks.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 140, after: 80 },
            children: inlineRuns(inner),
          })
        );
        break;
      case "p":
        blocks.push(
          new Paragraph({
            spacing: { after: 120 },
            children: inlineRuns(inner),
          })
        );
        break;
      case "ul": {
        const items = [...inner.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
        for (const item of items) {
          blocks.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 60 },
              children: inlineRuns(item[1]),
            })
          );
        }
        break;
      }
      case "table":
        blocks.push(buildTable(inner));
        blocks.push(new Paragraph({ text: "", spacing: { after: 80 } }));
        break;
    }
  }

  if (blocks.length === 0) {
    blocks.push(new Paragraph({ text: plainText(html) }));
  }
  return blocks;
}

export async function htmlToDocxBuffer(
  title: string,
  contentHtml: string
): Promise<Buffer> {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 }, // 11pt
        },
      },
    },
    sections: [
      {
        properties: {},
        children: htmlToBlocks(contentHtml),
      },
    ],
    title,
  });

  return Packer.toBuffer(doc);
}
