import { useState, useRef, useEffect } from "react";
import {
  Bookmark,
  Code,
  Palette,
  Rocket,
  Brain,
  Heart,
  FolderPlus,
  Search,
  ChevronLeft,
  Folder,
  Check,
  X,
  Trash2,
  Star,
  Zap,
  Globe,
  Music,
  Camera,
  Film,
  BookOpen,
  Coffee,
  Gamepad2,
  ShoppingBag,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import type { Folder as FolderType } from "@/data/mockBookmarks";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  bookmark: Bookmark,
  code: Code,
  palette: Palette,
  rocket: Rocket,
  brain: Brain,
  heart: Heart,
  folder: Folder,
  star: Star,
  zap: Zap,
  globe: Globe,
  music: Music,
  camera: Camera,
  film: Film,
  book: BookOpen,
  coffee: Coffee,
  gamepad: Gamepad2,
  shopping: ShoppingBag,
  briefcase: Briefcase,
  graduation: GraduationCap,
};

const iconOptions = [
  { key: "folder", label: "폴더" },
  { key: "bookmark", label: "북마크" },
  { key: "code", label: "코드" },
  { key: "palette", label: "디자인" },
  { key: "rocket", label: "로켓" },
  { key: "brain", label: "두뇌" },
  { key: "heart", label: "하트" },
  { key: "star", label: "별" },
  { key: "zap", label: "번개" },
  { key: "globe", label: "글로브" },
  { key: "music", label: "음악" },
  { key: "camera", label: "카메라" },
  { key: "film", label: "영상" },
  { key: "book", label: "책" },
  { key: "coffee", label: "커피" },
  { key: "gamepad", label: "게임" },
  { key: "shopping", label: "쇼핑" },
  { key: "briefcase", label: "업무" },
  { key: "graduation", label: "교육" },
];

interface FolderSidebarProps {
  selectedFolder: string;
  onSelectFolder: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  folders: FolderType[];
  onAddFolder: (name: string, icon: string) => void;
  onDeleteFolder: (id: string) => void;
  hideCollapseButton?: boolean;
}

export function FolderSidebar({
  selectedFolder,
  onSelectFolder,
  collapsed,
  onToggleCollapse,
  folders,
  onAddFolder,
  onDeleteFolder,
  hideCollapseButton,
}: FolderSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("folder");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddFolder = () => {
    const trimmed = newFolderName.trim();
    if (trimmed) {
      onAddFolder(trimmed, selectedIcon);
      setNewFolderName("");
      setSelectedIcon("folder");
      setIsAdding(false);
      setShowIconPicker(false);
    }
  };

  const resetAdding = () => {
    setIsAdding(false);
    setNewFolderName("");
    setSelectedIcon("folder");
    setShowIconPicker(false);
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      onDeleteFolder(id);
      setConfirmDeleteId(null);
      if (selectedFolder === id) onSelectFolder("all");
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const SelectedIconComponent = iconMap[selectedIcon] || Folder;

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 border-r border-border flex flex-col transition-all duration-200 shrink-0",
        collapsed ? "w-[68px]" : "w-[280px]"
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border">
        {!collapsed && (
          <h1 className="text-xl font-bold tracking-tight">X 북마크 매니저</h1>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-full hover:bg-accent transition-colors"
        >
          <ChevronLeft
            className={cn(
              "h-5 w-5 text-foreground transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="p-3">
          <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="폴더 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
            />
          </div>
        </div>
      )}

      {/* Folders */}
      <nav className="flex-1 overflow-y-auto py-2">
        {filteredFolders.map((folder) => {
          const Icon = iconMap[folder.icon] || Bookmark;
          const isActive = selectedFolder === folder.id;
          const isDeletable = folder.id !== "all";
          const isConfirming = confirmDeleteId === folder.id;

          return (
            <div
              key={folder.id}
              className={cn(
                "group flex items-center transition-colors",
                "hover:bg-accent",
                isActive && "bg-accent font-semibold"
              )}
            >
              <button
                onClick={() => onSelectFolder(folder.id)}
                className="flex-1 flex items-center gap-3 px-4 py-3 text-left min-w-0"
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-[15px] truncate">{folder.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {folder.count}
                    </span>
                  </>
                )}
              </button>

              {isDeletable && !collapsed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(folder.id);
                  }}
                  className={cn(
                    "mr-2 p-1.5 rounded-full transition-all shrink-0",
                    isConfirming
                      ? "bg-destructive/20 text-destructive"
                      : "opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  )}
                  title={isConfirming ? "한번 더 클릭하면 삭제됩니다" : "폴더 삭제"}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </nav>

      {/* Add Folder */}
      <div className="p-3 border-t border-border">
        {isAdding && !collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3">
              {/* Icon picker trigger */}
              <button
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors border border-border"
                title="아이콘 선택"
              >
                <SelectedIconComponent className="h-5 w-5 text-primary" />
              </button>
              <input
                ref={inputRef}
                type="text"
                placeholder="폴더 이름"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddFolder();
                  if (e.key === "Escape") resetAdding();
                }}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground border-b border-primary py-1.5"
              />
              <button onClick={handleAddFolder} className="p-1 rounded-full hover:bg-accent">
                <Check className="h-4 w-4 text-primary" />
              </button>
              <button onClick={resetAdding} className="p-1 rounded-full hover:bg-accent">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Icon picker grid */}
            {showIconPicker && (
              <div className="mx-3 p-2 rounded-xl border border-border bg-popover grid grid-cols-5 gap-1">
                {iconOptions.map((opt) => {
                  const IconComp = iconMap[opt.key];
                  return (
                    <button
                      key={opt.key}
                      onClick={() => {
                        setSelectedIcon(opt.key);
                        setShowIconPicker(false);
                      }}
                      className={cn(
                        "p-2 rounded-lg flex items-center justify-center transition-colors",
                        selectedIcon === opt.key
                          ? "bg-primary/20 text-primary"
                          : "hover:bg-accent text-muted-foreground hover:text-foreground"
                      )}
                      title={opt.label}
                    >
                      <IconComp className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent transition-colors"
          >
            <FolderPlus className="h-5 w-5 text-primary shrink-0" />
            {!collapsed && (
              <span className="text-[15px] text-primary font-medium">
                새 폴더
              </span>
            )}
          </button>
        )}
      </div>
    </aside>
  );
}
