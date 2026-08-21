import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { MainLayout } from '@/components'
import { getToken } from '@/features/auth';

export const Route = createFileRoute('/_authenticated')({
    beforeLoad: ({ location }) => {
        const isAuthenticated = !!getToken();

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