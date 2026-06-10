import { createElement } from "react";
import type { ReactElement } from "react";
import {
  Archive,
  ArrowRight,
  CalendarDays,
  Check,
  CircleHelp,
  Eraser,
  FilePlus2,
  FileText,
  FolderOpen,
  Inbox,
  LayoutDashboard,
  Lock,
  LockOpen,
  PanelTop,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  Trash2,
  TriangleAlert,
  X,
  type IconNode,
} from "lucide";

// Lucide exporta nós SVG; este mapa limita o conjunto usado pelo app.
const iconNodes: Record<string, IconNode> = {
  archive: Archive,
  "arrow-right": ArrowRight,
  "calendar-days": CalendarDays,
  check: Check,
  "circle-help": CircleHelp,
  eraser: Eraser,
  "file-plus-2": FilePlus2,
  "file-text": FileText,
  "folder-open": FolderOpen,
  inbox: Inbox,
  "layout-dashboard": LayoutDashboard,
  lock: Lock,
  "lock-open": LockOpen,
  "panel-top": PanelTop,
  pencil: Pencil,
  plus: Plus,
  "refresh-cw": RefreshCw,
  "rotate-ccw": RotateCcw,
  save: Save,
  settings: Settings,
  "trash-2": Trash2,
  "triangle-alert": TriangleAlert,
  x: X,
};

const reactAttributeNames: Record<string, string> = {
  class: "className",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-width": "strokeWidth",
};

type SvgNode = [string, Record<string, unknown>, SvgNode[]?];

function normalizeAttributes(attrs: Record<string, unknown>) {
  // Converte atributos SVG kebab-case para nomes aceitos pelo React.
  return Object.fromEntries(
    Object.entries(attrs).map(([name, value]) => [
      reactAttributeNames[name] || name,
      value,
    ]),
  );
}

function renderSvgNode(node: SvgNode, key: number): ReactElement {
  const [tag, attrs, children = []] = node;
  return createElement(
    tag,
    { ...normalizeAttributes(attrs), key },
    children.map((child, index) => renderSvgNode(child, index)),
  );
}

type IconProps = {
  name: string;
};

export function Icon({ name }: IconProps) {
  // Ícone inexistente não quebra a UI; só deixa o espaço vazio.
  const node = iconNodes[name];
  if (!node) {
    return null;
  }

  const [tag, attrs, children = []] = node as SvgNode;
  return createElement(
    tag,
    {
      ...normalizeAttributes(attrs),
      "aria-hidden": true,
      className: "lucide-icon",
      focusable: false,
      height: 18,
      width: 18,
    },
    children.map((child, index) => renderSvgNode(child, index)),
  );
}
