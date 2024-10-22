import React from 'react';
import { usePage } from '@inertiajs/react';
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import GuestLayout from "@/layouts/GuestLayout";

const DefaultLayout = ({ children }) => {
    const user = usePage().props.auth.user;

    return (
        user ? (
            <AuthenticatedLayout user={user}>{children}</AuthenticatedLayout>
        ) : (
            <GuestLayout>{children}</GuestLayout>
        )
    );
};

export default DefaultLayout;
