import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { MainLayout } from '@/components'
import { useAuthStore } from '@/features/auth';

export const Route = createFileRoute('/_authenticated')({
    beforeLoad: ({ location }) => {
        const isAuthenticated = !!useAuthStore.getState().token;

        if (!isAuthenticated) {
            throw redirect({
                to: '/login',
                search: {
                    redirect: location.href,
                },
            })
        }
    },
    component: () => (
        <MainLayout>
            <Outlet />
        </MainLayout>
    )
})