import { LUIProvider } from "@/components"
import { queryClient, router } from "@/lib"
import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "@tanstack/react-router"

export const AppProviders = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <LUIProvider>
                <RouterProvider router={router} />
            </LUIProvider>
        </QueryClientProvider>
    )
}