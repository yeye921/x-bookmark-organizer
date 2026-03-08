export interface Bookmark {
  id: string;
  tweetId?: string;
  author: {
    name: string;
    handle: string;
    avatar: string;
    verified: boolean;
  };
  content: string;
  timestamp: string;
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  folderId: string | null;
  images?: string[];
}

export interface Folder {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export const folders: Folder[] = [
  { id: "all", name: "모든 북마크", icon: "bookmark", count: 12 },
  { id: "tech", name: "개발 / 기술", icon: "code", count: 5 },
  { id: "design", name: "디자인", icon: "palette", count: 3 },
  { id: "startup", name: "스타트업", icon: "rocket", count: 2 },
  { id: "ai", name: "AI / ML", icon: "brain", count: 4 },
  { id: "life", name: "라이프", icon: "heart", count: 2 },
];

export const bookmarks: Bookmark[] = [
  {
    id: "1",
    author: { name: "Dan Abramov", handle: "@dan_abramov", avatar: "", verified: true },
    content: "React Server Components are not about performance. They're about letting you write components that run on the server. That's it. Everything else follows from that.",
    timestamp: "3시간",
    likes: 2847,
    retweets: 412,
    replies: 89,
    views: 184200,
    folderId: "tech",
  },
  {
    id: "2",
    author: { name: "Guillermo Rauch", handle: "@raaborito", avatar: "", verified: true },
    content: "Ship fast, fix later. The best products are built by teams that aren't afraid to put imperfect things in front of users. Perfection is the enemy of progress.",
    timestamp: "5시간",
    likes: 5231,
    retweets: 893,
    replies: 201,
    views: 421000,
    folderId: "startup",
    images: [
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop",
    ],
  },
  {
    id: "3",
    author: { name: "Sara Soueidan", handle: "@SaraSoueidan", avatar: "", verified: true },
    content: "Accessibility isn't a feature. It's a quality of your work. If your design isn't accessible, it's not well-designed. Period.",
    timestamp: "8시간",
    likes: 3102,
    retweets: 672,
    replies: 44,
    views: 198000,
    folderId: "design",
    images: [
      "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1558655146-d09347e92766?w=600&h=400&fit=crop",
    ],
  },
  {
    id: "4",
    author: { name: "Andrej Karpathy", handle: "@karpathy", avatar: "", verified: true },
    content: "The hottest new programming language is English. We're witnessing the emergence of a new kind of software development where natural language is the interface.",
    timestamp: "12시간",
    likes: 12400,
    retweets: 3201,
    replies: 567,
    views: 2100000,
    folderId: "ai",
    images: [
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop",
    ],
  },
  {
    id: "5",
    author: { name: "Wes Bos", handle: "@wesbos", avatar: "", verified: true },
    content: "🔥 CSS Tip: You can use `text-wrap: balance` to make your headings look way better. No more orphaned words on the last line!",
    timestamp: "1일",
    likes: 4521,
    retweets: 891,
    replies: 112,
    views: 310000,
    folderId: "tech",
  },
  {
    id: "6",
    author: { name: "Steve Schoger", handle: "@steveschoger", avatar: "", verified: true },
    content: "Design tip: Instead of using grey text on a colored background, try using a lighter or darker shade of the background color for the text. It looks way more cohesive.",
    timestamp: "1일",
    likes: 2890,
    retweets: 445,
    replies: 67,
    views: 156000,
    folderId: "design",
    images: [
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&h=400&fit=crop",
    ],
  },
  {
    id: "7",
    author: { name: "Sam Altman", handle: "@sama", avatar: "", verified: true },
    content: "The cost of intelligence is dropping exponentially. In 10 years, the cost of a unit of intelligence will be nearly zero. This changes everything about how we build companies.",
    timestamp: "2일",
    likes: 18900,
    retweets: 4521,
    replies: 1203,
    views: 5200000,
    folderId: "ai",
  },
  {
    id: "8",
    author: { name: "Naval Ravikant", handle: "@naval", avatar: "", verified: true },
    content: "Code and media are permissionless leverage. They're the leverage behind the newly rich. You can create software and media that works for you while you sleep.",
    timestamp: "3일",
    likes: 8920,
    retweets: 2100,
    replies: 321,
    views: 1800000,
    folderId: "startup",
  },
  {
    id: "9",
    author: { name: "Yann LeCun", handle: "@ylecun", avatar: "", verified: true },
    content: "Auto-regressive LLMs will not lead to AGI. We need a paradigm shift. World models and planning are the missing pieces. The next breakthrough will come from a different architecture.",
    timestamp: "3일",
    likes: 6700,
    retweets: 1890,
    replies: 890,
    views: 3400000,
    folderId: "ai",
    images: [
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&h=300&fit=crop",
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=300&fit=crop",
      "https://images.unsplash.com/photo-1684369175833-4b445ad6bfb5?w=600&h=300&fit=crop",
    ],
  },
  {
    id: "10",
    author: { name: "Kent C. Dodds", handle: "@kentcdodds", avatar: "", verified: true },
    content: "The best way to learn something is to build something with it. Tutorials are great for getting started, but real learning happens when you're solving your own problems.",
    timestamp: "4일",
    likes: 3400,
    retweets: 567,
    replies: 89,
    views: 220000,
    folderId: "tech",
  },
];
