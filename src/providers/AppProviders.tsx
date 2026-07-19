import { LUIProvider } from "@/components"
import { router } from "@/lib"
import { RouterProvider } from "@tanstack/react-router"

export const AppProviders = () => {
    return (
        <LUIProvider>
            <RouterProvider router={router} />
        </LUIProvider>
    )
}