import { useState, useMemo } from "react";
import { FolderSidebar } from "@/components/FolderSidebar";
import { BookmarkCard } from "@/components/BookmarkCard";
import { bookmarks, folders as initialFolders, type Folder } from "@/data/mockBookmarks";
import { Search, SlidersHorizontal } from "lucide-react";

const Index = () => {
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [folderList, setFolderList] = useState<Folder[]>(initialFolders);

  const currentFolder = folderList.find((f) => f.id === selectedFolder);

  const handleAddFolder = (name: string) => {
    const id = name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    setFolderList((prev) => [...prev, { id, name, icon: "folder", count: 0 }]);
  };

  const filteredBookmarks = useMemo(() => {
    let filtered = bookmarks;
    if (selectedFolder !== "all") {
      filtered = filtered.filter((b) => b.folderId === selectedFolder);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.content.toLowerCase().includes(q) ||
          b.author.name.toLowerCase().includes(q) ||
          b.author.handle.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [selectedFolder, searchQuery]);

  return (
    <div className="flex min-h-screen bg-background">
      <FolderSidebar
        selectedFolder={selectedFolder}
        onSelectFolder={setSelectedFolder}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        folders={folderList}
        onAddFolder={handleAddFolder}
      />

      {/* Main content */}
      <main className="flex-1 border-r border-border max-w-[600px]">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="px-4 py-3">
            <h2 className="text-xl font-bold">{currentFolder?.name || "북마크"}</h2>
            <p className="text-sm text-muted-foreground">
              {filteredBookmarks.length}개의 포스트
            </p>
          </div>

          {/* Search bar */}
          <div className="px-4 pb-3 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-full bg-secondary px-4 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="북마크 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
              />
            </div>
            <button className="p-2 rounded-full hover:bg-accent transition-colors">
              <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </header>

        {/* Bookmark list */}
        <div>
          {filteredBookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <p className="text-lg font-medium">북마크가 없습니다</p>
              <p className="text-sm mt-1">이 폴더에 저장된 북마크가 없어요.</p>
            </div>
          ) : (
            filteredBookmarks.map((bookmark) => (
              <BookmarkCard key={bookmark.id} bookmark={bookmark} />
            ))
          )}
        </div>
      </main>

      {/* Right spacer for X-like centered layout */}
      <div className="flex-1 hidden lg:block" />
    </div>
  );
};

export default Index;
