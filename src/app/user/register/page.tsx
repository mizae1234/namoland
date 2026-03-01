import { Suspense } from "react";
import RegisterForm from "./_components/RegisterForm";

export default function UserRegisterPage() {
    return (
        <Suspense>
            <RegisterForm />
        </Suspense>
    );
}
