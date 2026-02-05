
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function getFullImageUrl(path: string | null | undefined) {
    if (!path) return undefined;
    if (path.startsWith('data:')) return path; // Base64
    if (path.startsWith('http')) return path; // Already absolute URL

    // Default backend URL
    const defaultUrl = import.meta.env.DEV ? 'http://localhost:8000' : '';
    const baseUrl = import.meta.env.VITE_BACKEND_URL || defaultUrl;

    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
}
