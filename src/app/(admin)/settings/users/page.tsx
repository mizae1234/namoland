import { getAdminUsers } from "@/actions/admin";
import { auth } from "@/lib/auth";
import AdminUsersManager from "../_components/AdminUsersManager";
import BackLink from "@/components/ui/BackLink";

export default async function AdminUsersPage() {
    const session = await auth();
    const adminUsers = await getAdminUsers();

    return (
        <div>
            <BackLink href="/settings" label="กลับหน้าตั้งค่า" />
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#3d405b]">จัดการผู้ใช้ระบบ</h1>
                <p className="text-[#3d405b]/50 mt-1">เพิ่ม แก้ไข ลบผู้ดูแลระบบ และกำหนดสิทธิ์</p>
            </div>

            <AdminUsersManager
                users={adminUsers}
                currentUserId={session?.user?.id || ""}
            />
        </div>
    );
}
