import { Suspense } from "react";
import LoginForm from "./_components/LoginForm";

export default function UserLoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}
