import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Button>북마크 동기화</Button>
        <Input className="max-w-sm" placeholder="검색..." />
        <Badge>개발</Badge>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>@username</CardTitle>
        </CardHeader>
        <CardContent>
          트윗 내용 미리보기… 폴더에 들어간 상태는 Badge로 표시.
        </CardContent>
      </Card>
    </main>
  );
}
