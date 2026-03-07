import { getShopInfo } from "@/actions/shop";
import ShopInfoForm from "./_components/ShopInfoForm";

export default async function SettingsPage() {
    const shopInfo = await getShopInfo();

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#3d405b]">ตั้งค่าร้าน</h1>
                <p className="text-[#3d405b]/50 mt-1">ข้อมูลร้าน และบัญชีธนาคาร</p>
            </div>

            <ShopInfoForm shopInfo={shopInfo} />
        </div>
    );
}
