import { getShopInfo } from "@/actions/shop";
import { getActivePackages } from "@/actions/packageConfig";
import TopUpForm from "./_components/TopUpForm";

export default async function TopUpPage() {
    const [shopInfo, dbPackages] = await Promise.all([
        getShopInfo(),
        getActivePackages(),
    ]);

    const packages = dbPackages.map(p => ({
        key: p.key,
        coins: p.coins,
        price: p.price,
        bonus: p.bonus,
    }));

    return (
        <TopUpForm
            bankInfo={{
                bankName: shopInfo.bankName,
                accountNumber: shopInfo.accountNumber,
                accountName: shopInfo.accountName,
                note: shopInfo.note,
            }}
            packages={packages}
        />
    );
}
