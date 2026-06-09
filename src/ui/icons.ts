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
  ListChecks,
  Lock,
  LockOpen,
  PanelTop,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  Sheet,
  Trash2,
  X,
  type IconNode,
} from "lucide";
import { attributes } from "./dom";

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
  "list-checks": ListChecks,
  lock: Lock,
  "lock-open": LockOpen,
  "panel-top": PanelTop,
  pencil: Pencil,
  plus: Plus,
  "refresh-cw": RefreshCw,
  "rotate-ccw": RotateCcw,
  save: Save,
  settings: Settings,
  sheet: Sheet,
  "trash-2": Trash2,
  x: X,
};

export function icon(name: string) {
  const node = iconNodes[name];
  if (!node) {
    return "";
  }

  const [tag, attrs, children = []] = node;
  const rootAttrs = {
    ...attrs,
    "aria-hidden": "true",
    class: "lucide-icon",
    focusable: "false",
    height: 18,
    width: 18,
  };
  const childMarkup = children
    .map(([childTag, childAttrs]) => `<${childTag}${attributes(childAttrs)} />`)
    .join("");

  return `<${tag}${attributes(rootAttrs)}>${childMarkup}</${tag}>`;
}
