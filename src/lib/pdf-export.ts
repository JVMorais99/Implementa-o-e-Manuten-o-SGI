import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
  RGB,
} from "pdf-lib";

// Exportação de PDF "robusta": layout próprio sobre pdf-lib (JS puro, sem binários
// nem navegador headless — confiável em produção/serverless). Converte o HTML
// controlado dos documentos (h1-h3, p, ul/li, table/tr/th/td, strong) num PDF A4
// com quebra de linha, paginação automática, negrito inline e tabelas com cabeçalho
// repetido a cada página.

const PAGE_W = 595.28; // A4 retrato (pt)
const PAGE_H = 841.89;
const MARGIN = 52;
const CONTENT_W = PAGE_W - MARGIN * 2;
const LINE = 1.38; // entrelinha

const COLORS = {
  text: rgb(0.13, 0.15, 0.2),
  heading: rgb(0.1, 0.12, 0.18),
  brand: rgb(0.18, 0.25, 0.55),
  muted: rgb(0.45, 0.48, 0.55),
  border: rgb(0.82, 0.84, 0.88),
  headerFill: rgb(0.93, 0.95, 1),
  footer: rgb(0.6, 0.62, 0.68),
};

type Token = { text: string; bold: boolean };

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

// Sanitiza texto para o WinAnsi (codificação das fontes padrão): troca caracteres
// fora do conjunto por equivalentes ASCII, evitando erro de codificação.
function toWinAnsi(text: string): string {
  return text
    .replace(/[‘’‚]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/ /g, " ")
    .replace(/[•]/g, "-");
}

// Quebra um trecho inline (com possíveis <strong>) em tokens-palavra com flag bold.
function tokenizeInline(html: string, forceBold = false): Token[] {
  const tokens: Token[] = [];
  const regex = /<strong>([\s\S]*?)<\/strong>|([^<]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) {
    const bold = forceBold || m[1] !== undefined;
    const raw = (m[1] ?? m[2] ?? "").replace(/<[^>]+>/g, "");
    const text = toWinAnsi(decodeEntities(raw));
    for (const word of text.split(/\s+/)) {
      if (word) tokens.push({ text: word, bold });
    }
  }
  return tokens;
}

class PdfWriter {
  doc!: PDFDocument;
  page!: PDFPage;
  font!: PDFFont;
  bold!: PDFFont;
  y = 0;

  async init() {
    this.doc = await PDFDocument.create();
    this.font = await this.doc.embedFont(StandardFonts.Helvetica);
    this.bold = await this.doc.embedFont(StandardFonts.HelveticaBold);
    this.addPage();
  }

  addPage() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - MARGIN;
  }

  ensure(height: number) {
    if (this.y - height < MARGIN + 24) this.addPage();
  }

  fontFor(bold: boolean) {
    return bold ? this.bold : this.font;
  }

  widthOf(token: Token, size: number) {
    return this.fontFor(token.bold).widthOfTextAtSize(token.text, size);
  }

  // Distribui tokens em linhas dentro de maxWidth e desenha, paginando.
  drawRuns(
    tokens: Token[],
    opts: {
      size: number;
      x?: number;
      maxWidth?: number;
      color?: RGB;
      after?: number;
      hangingIndent?: number;
    }
  ) {
    const x = opts.x ?? MARGIN;
    const maxWidth = opts.maxWidth ?? CONTENT_W;
    const color = opts.color ?? COLORS.text;
    const lineHeight = opts.size * LINE;
    const spaceW = this.font.widthOfTextAtSize(" ", opts.size);

    let line: Token[] = [];
    let lineW = 0;

    const flush = (isLast: boolean) => {
      if (line.length === 0 && !isLast) return;
      this.ensure(lineHeight);
      let cursorX = x;
      for (const t of line) {
        this.page.drawText(t.text, {
          x: cursorX,
          y: this.y - opts.size,
          size: opts.size,
          font: this.fontFor(t.bold),
          color,
        });
        cursorX += this.widthOf(t, opts.size) + spaceW;
      }
      this.y -= lineHeight;
      line = [];
      lineW = 0;
    };

    for (const t of tokens) {
      const w = this.widthOf(t, opts.size);
      if (line.length > 0 && lineW + spaceW + w > maxWidth) flush(false);
      line.push(t);
      lineW += (line.length > 1 ? spaceW : 0) + w;
    }
    flush(true);
    if (opts.after) this.y -= opts.after;
  }

  // Mede quantas linhas um conjunto de tokens ocupa numa largura dada.
  measureLines(tokens: Token[], size: number, maxWidth: number): number {
    const spaceW = this.font.widthOfTextAtSize(" ", size);
    let lines = 1;
    let lineW = 0;
    for (const t of tokens) {
      const w = this.widthOf(t, size);
      if (lineW > 0 && lineW + spaceW + w > maxWidth) {
        lines++;
        lineW = w;
      } else {
        lineW += (lineW > 0 ? spaceW : 0) + w;
      }
    }
    return Math.max(1, lines);
  }
}

type Cell = { tokens: Token[]; header: boolean };

function parseTable(tableHtml: string): Cell[][] {
  const rows = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  return rows.map((row) => {
    const cells = [...row[1].matchAll(/<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi)];
    return cells.map((c) => {
      const header = c[1].toLowerCase() === "th";
      return { tokens: tokenizeInline(c[2], header), header };
    });
  });
}

function drawTable(w: PdfWriter, rows: Cell[][]) {
  if (rows.length === 0) return;
  const cols = Math.max(...rows.map((r) => r.length));
  const colW = CONTENT_W / cols;
  const size = 9;
  const padX = 5;
  const padY = 5;
  const lineHeight = size * 1.3;
  const cellW = colW - padX * 2;

  const rowHeight = (row: Cell[]) => {
    const maxLines = Math.max(
      1,
      ...row.map((c) => w.measureLines(c.tokens, size, cellW))
    );
    return maxLines * lineHeight + padY * 2;
  };

  const drawRow = (row: Cell[], h: number) => {
    const top = w.y;
    for (let i = 0; i < cols; i++) {
      const cell = row[i];
      const x = MARGIN + i * colW;
      if (cell?.header) {
        w.page.drawRectangle({
          x,
          y: top - h,
          width: colW,
          height: h,
          color: COLORS.headerFill,
        });
      }
      // bordas da célula
      w.page.drawRectangle({
        x,
        y: top - h,
        width: colW,
        height: h,
        borderColor: COLORS.border,
        borderWidth: 0.7,
      });
      if (cell) {
        const savedY = w.y;
        w.y = top - padY;
        w.drawRuns(cell.tokens, {
          size,
          x: x + padX,
          maxWidth: cellW,
          color: cell.header ? COLORS.brand : COLORS.text,
        });
        w.y = savedY;
      }
    }
    w.y = top - h;
  };

  const header = rows[0].some((c) => c.header) ? rows[0] : null;

  rows.forEach((row, idx) => {
    const h = rowHeight(row);
    // Paginação: se a linha não cabe, nova página e repete o cabeçalho.
    if (w.y - h < MARGIN + 24) {
      w.addPage();
      if (header && idx !== 0) drawRow(header, rowHeight(header));
    }
    drawRow(row, h);
  });
  w.y -= 8;
}

function renderBlocks(w: PdfWriter, html: string) {
  const blockRegex = /<(h1|h2|h3|p|ul|table)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  let any = false;

  while ((m = blockRegex.exec(html)) !== null) {
    any = true;
    const tag = m[1].toLowerCase();
    const inner = m[2];

    switch (tag) {
      case "h1":
        w.y -= 6;
        w.drawRuns(tokenizeInline(inner, true), {
          size: 17,
          color: COLORS.brand,
          after: 8,
        });
        break;
      case "h2":
        w.y -= 5;
        w.drawRuns(tokenizeInline(inner, true), {
          size: 12.5,
          color: COLORS.heading,
          after: 5,
        });
        break;
      case "h3":
        w.y -= 3;
        w.drawRuns(tokenizeInline(inner, true), {
          size: 11,
          color: COLORS.heading,
          after: 4,
        });
        break;
      case "p":
        w.drawRuns(tokenizeInline(inner), { size: 10.5, after: 7 });
        break;
      case "ul": {
        const items = [...inner.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
        for (const it of items) {
          const top = w.y;
          w.ensure(10.5 * LINE);
          w.page.drawText("-", {
            x: MARGIN,
            y: w.y - 10.5,
            size: 10.5,
            font: w.font,
            color: COLORS.muted,
          });
          w.y = top;
          w.drawRuns(tokenizeInline(it[1]), {
            size: 10.5,
            x: MARGIN + 14,
            maxWidth: CONTENT_W - 14,
            after: 2,
          });
        }
        w.y -= 5;
        break;
      }
      case "table":
        drawTable(w, parseTable(inner));
        break;
    }
  }

  if (!any) {
    const text = toWinAnsi(decodeEntities(html.replace(/<[^>]+>/g, "")));
    w.drawRuns(
      text.split(/\s+/).filter(Boolean).map((t) => ({ text: t, bold: false })),
      { size: 10.5 }
    );
  }
}

function drawFooters(w: PdfWriter, title: string) {
  const pages = w.doc.getPages();
  const total = pages.length;
  const label = toWinAnsi(title).slice(0, 70);
  pages.forEach((page, i) => {
    page.drawLine({
      start: { x: MARGIN, y: MARGIN - 6 },
      end: { x: PAGE_W - MARGIN, y: MARGIN - 6 },
      thickness: 0.5,
      color: COLORS.border,
    });
    page.drawText(label, {
      x: MARGIN,
      y: MARGIN - 18,
      size: 7.5,
      font: w.font,
      color: COLORS.footer,
    });
    const pageStr = `Página ${i + 1} de ${total}`;
    const pw = w.font.widthOfTextAtSize(pageStr, 7.5);
    page.drawText(pageStr, {
      x: PAGE_W - MARGIN - pw,
      y: MARGIN - 18,
      size: 7.5,
      font: w.font,
      color: COLORS.footer,
    });
  });
}

export async function htmlToPdfBuffer(
  title: string,
  contentHtml: string
): Promise<Buffer> {
  const w = new PdfWriter();
  await w.init();
  w.doc.setTitle(title);
  renderBlocks(w, contentHtml);
  drawFooters(w, title);
  const bytes = await w.doc.save();
  return Buffer.from(bytes);
}
