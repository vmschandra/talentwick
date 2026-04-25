import { redirect } from "next/navigation";

export default function AdminEntry() {
  redirect("/login?role=admin");
}
