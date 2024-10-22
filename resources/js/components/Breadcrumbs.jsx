import React from 'react';
import { Link } from '@inertiajs/react';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/Components/ui/breadcrumb"

const Breadcrumbs = ({ items }) => {
  return (
    <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
            {items?.map((item, i) => (
                <React.Fragment key={i}>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href={item.href}>{item.label}</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    {i < (items?.length - 1) && <BreadcrumbSeparator />}
                    
                </React.Fragment>
            ))}
        </BreadcrumbList>
    </Breadcrumb>
  );
};

export default Breadcrumbs;
