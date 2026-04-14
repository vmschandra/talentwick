"use client";

import { useEffect, useState } from "react";
import { getAllUsers } from "@/lib/firebase/firestore";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { UserDoc } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserX, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState("all");

  useEffect(() => {
    getAllUsers()
      .then((data) => setUsers(data as UserDoc[]))
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  const toggleActive = async (uid: string, currentActive: boolean): Promise<void> => {
    try {
      await updateDoc(doc(db, "users", uid), { isActive: !currentActive });
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, isActive: !currentActive } : u)));
      toast.success(`User ${!currentActive ? "activated" : "deactivated"}`);
    } catch {
      toast.error("Failed to update user");
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = tab === "all" || u.role === tab;
    return matchesSearch && matchesTab;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Badge variant="secondary">{users.length} total users</Badge>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All ({users.length})</TabsTrigger>
          <TabsTrigger value="candidate">Candidates ({users.filter((u) => u.role === "candidate").length})</TabsTrigger>
          <TabsTrigger value="recruiter">Recruiters ({users.filter((u) => u.role === "recruiter").length})</TabsTrigger>
          <TabsTrigger value="admin">Admins ({users.filter((u) => u.role === "admin").length})</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="p-4 font-medium">Name</th>
                      <th className="p-4 font-medium">Email</th>
                      <th className="p-4 font-medium">Role</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Joined</th>
                      <th className="p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((user) => (
                      <tr key={user.uid} className="border-b last:border-0">
                        <td className="p-4 font-medium text-sm">{user.displayName || "—"}</td>
                        <td className="p-4 text-sm text-muted-foreground">{user.email}</td>
                        <td className="p-4"><Badge variant="outline">{user.role}</Badge></td>
                        <td className="p-4">
                          <Badge variant={user.isActive ? "success" : "destructive"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {user.createdAt ? formatDate(user.createdAt.toDate()) : "—"}
                        </td>
                        <td className="p-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(user.uid, user.isActive ?? true)}
                          >
                            {user.isActive ? <UserX className="mr-1 h-4 w-4" /> : <UserCheck className="mr-1 h-4 w-4" />}
                            {user.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No users found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
