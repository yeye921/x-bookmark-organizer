import { useState } from "react";
import { FolderSidebar } from "@/components/FolderSidebar";
import { BookmarkCard } from "@/components/BookmarkCard";
import { useAuth } from "@/hooks/useAuth";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useTwitterAuth } from "@/hooks/useTwitterAuth";
import { useTheme } from "@/hooks/useTheme";
import { Navigate } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  RefreshCw,
  LogOut,
  Loader2,
  Sun,
  Moon,
  Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { Folder, Bookmark } from "@/data/mockBookmarks";

const Index = () => {
  const { user, twitterProfile, loading: authLoading, signOut, isTwitterConnected } = useAuth();
  const { connectTwitter, connecting } = useTwitterAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    bookmarks: dbBookmarks,
    folders: dbFolders,
    syncing,
    loading: dataLoading,
    syncBookmarks,
    addFolder,
    deleteFolder,
    moveBookmarkToFolder,
    deleteBookmark,
  } = useBookmarks(user?.id);

  const [selectedFolder, setSelectedFolder] = useState("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Transform DB data to component format
  const folderList: Folder[] = [
    { id: "all", name: "모든 북마크", icon: "bookmark", count: dbBookmarks.length },
    ...dbFolders.map((f) => ({
      id: f.id,
      name: f.name,
      icon: f.icon,
      count: dbBookmarks.filter((b) => b.folder_id === f.id).length,
    })),
  ];

  const bookmarkList: Bookmark[] = dbBookmarks.map((b) => ({
    id: b.id,
    tweetId: b.tweet_id,
    author: {
      name: b.author_name || "Unknown",
      handle: b.author_handle || "@unknown",
      avatar: b.author_avatar || "",
      verified: b.author_verified || false,
    },
    content: b.content || "",
    timestamp: b.tweet_timestamp
      ? formatRelativeTime(b.tweet_timestamp)
      : "",
    likes: b.likes || 0,
    retweets: b.retweets || 0,
    replies: b.replies || 0,
    views: b.views || 0,
    folderId: b.folder_id,
    images: b.images && b.images.length > 0 ? b.images : undefined,
    rawTimestamp: b.tweet_timestamp || undefined,
  }));

  const currentFolder = folderList.find((f) => f.id === selectedFolder);

  const filteredBookmarks = (() => {
    let filtered = bookmarkList;
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
    // Sort by timestamp
    filtered = [...filtered].sort((a, b) => {
      if (!a.rawTimestamp && !b.rawTimestamp) return 0;
      if (!a.rawTimestamp) return 1;
      if (!b.rawTimestamp) return -1;
      const diff = new Date(b.rawTimestamp).getTime() - new Date(a.rawTimestamp).getTime();
      return sortOrder === "newest" ? diff : -diff;
    });
    return filtered;
  })();

  const handleAddFolder = async (name: string, icon: string = "folder") => {
    await addFolder(name, icon);
  };

  const handleDeleteFolder = async (id: string) => {
    await deleteFolder(id);
    if (selectedFolder === id) setSelectedFolder("all");
  };

  const handleSelectFolderMobile = (id: string) => {
    setSelectedFolder(id);
    setMobileSheetOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <FolderSidebar
          selectedFolder={selectedFolder}
          onSelectFolder={setSelectedFolder}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          folders={folderList}
          onAddFolder={handleAddFolder}
          onDeleteFolder={handleDeleteFolder}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 border-r border-border md:max-w-[600px] w-full">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {/* Mobile menu button */}
              <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
                <SheetTrigger asChild>
                  <button className="md:hidden p-2 rounded-full hover:bg-accent transition-colors shrink-0">
                    <Menu className="h-5 w-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[280px]">
                  <FolderSidebar
                    selectedFolder={selectedFolder}
                    onSelectFolder={handleSelectFolderMobile}
                    collapsed={false}
                    onToggleCollapse={() => {}}
                    folders={folderList}
                    onAddFolder={handleAddFolder}
                    onDeleteFolder={handleDeleteFolder}
                    hideCollapseButton
                  />
                </SheetContent>
              </Sheet>

              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold truncate">
                  {currentFolder?.name || "북마크"}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {filteredBookmarks.length}개의 포스트
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {isTwitterConnected ? (
                <button
                  onClick={() => syncBookmarks()}
                  disabled={syncing}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">{syncing ? "동기화 중..." : "동기화"}</span>
                </button>
              ) : (
                <button
                  onClick={() => connectTwitter()}
                  disabled={connecting}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {connecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  )}
                  <span className="hidden sm:inline">{connecting ? "연결 중..." : "X 계정 연동"}</span>
                </button>
              )}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-accent transition-colors"
                title={theme === "dark" ? "라이트 모드" : "다크 모드"}
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Moon className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              <button
                onClick={signOut}
                className="p-2 rounded-full hover:bg-accent transition-colors"
                title="로그아웃"
              >
                <LogOut className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="px-3 sm:px-4 pb-3 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-full bg-secondary px-3 sm:px-4 py-2">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="북마크 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
              />
            </div>
            <button className="p-2 rounded-full hover:bg-accent transition-colors shrink-0">
              <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Twitter profile info */}
          {isTwitterConnected && twitterProfile && (
            <div className="px-3 sm:px-4 pb-3 flex items-center gap-2 text-sm text-muted-foreground">
              {twitterProfile.twitter_avatar_url && (
                <img
                  src={twitterProfile.twitter_avatar_url}
                  alt=""
                  className="w-5 h-5 rounded-full"
                />
              )}
              <span>@{twitterProfile.twitter_username}</span>
            </div>
          )}
        </header>

        {/* Content */}
        <div>
          {dataLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !isTwitterConnected ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-muted-foreground">
              <svg className="h-12 w-12 mb-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <p className="text-lg font-medium">X 계정을 연동하세요</p>
              <p className="text-sm mt-1 text-center">
                상단의 "X 계정 연동" 버튼을 클릭해주세요
              </p>
            </div>
          ) : filteredBookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-muted-foreground">
              <p className="text-lg font-medium">북마크가 없습니다</p>
              <p className="text-sm mt-1 text-center">
                {dbBookmarks.length === 0
                  ? '"동기화" 버튼을 눌러 북마크를 가져오세요'
                  : "이 폴더에 저장된 북마크가 없어요."}
              </p>
            </div>
          ) : (
            filteredBookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                folders={folderList}
                onMoveToFolder={moveBookmarkToFolder}
                onDeleteBookmark={deleteBookmark}
              />
            ))
          )}
        </div>
      </main>

      {/* Right spacer */}
      <div className="flex-1 hidden lg:block" />
    </div>
  );
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "방금";
  if (diffMin < 60) return `${diffMin}분`;
  if (diffHour < 24) return `${diffHour}시간`;
  if (diffDay < 7) return `${diffDay}일`;
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export default Index;
