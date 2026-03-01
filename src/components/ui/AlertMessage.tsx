interface AlertMessageProps {
    type?: "error" | "success" | "warning" | "info";
    message: string;
    className?: string;
}

const styles = {
    error: "bg-red-50 border-red-200 text-red-600",
    success: "bg-emerald-50 border-emerald-200 text-emerald-600",
    warning: "bg-amber-50 border-amber-200 text-amber-600",
    info: "bg-blue-50 border-blue-200 text-blue-600",
};

export default function AlertMessage({ type = "error", message, className = "" }: AlertMessageProps) {
    if (!message) return null;

    return (
        <div className={`mb-4 p-3 border rounded-xl text-sm ${styles[type]} ${className}`}>
            {message}
        </div>
    );
}
