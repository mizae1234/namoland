import { getAllPackageConfigs } from "@/actions/packageConfig";
import PackageManager from "./_components/PackageManager";

export default async function PackagesPage() {
    const packages = await getAllPackageConfigs();

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#3d405b]">จัดการแพ็คเกจเหรียญ</h1>
                <p className="text-[#3d405b]/50 mt-1">เพิ่ม แก้ไข หรือปิดแพ็คเกจเหรียญ</p>
            </div>

            <PackageManager packages={JSON.parse(JSON.stringify(packages))} />
        </div>
    );
}
