import { redirect } from "next/navigation";

export default function ClassesPage() {
    redirect("/settings?tab=classes");
}
